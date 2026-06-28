//! Commands Tauri del modulo `ticket-delivery` (epica 3 / TEAM-012).
//!
//! Capa DELGADA: parsea inputs del frontend (TS), resuelve el
//! ticket + atraccion para construir el payload, delega en el
//! `DeliveryRegistry` y registra el `TicketDeliveryAttempt` en
//! BD. Logica de formato vive en `delivery::format`; logica de
//! error mapping vive en `delivery::backend`.
//!
//! **Reglas duras**:
//! - `print_ticket` **nunca falla la venta**: un fallo del
//!   backend se traduce a un `PrintTicketResult { success: false }`
//!   con `error_code` y `error_detail` poblados, y se registra
//!   el intento en BD. La venta ya esta confirmada.
//! - El payload se construye segun el `kind` del backend activo.
//! - `latency_ms` se mide **en memoria** y se devuelve al
//!   frontend, no se persiste (el schema V003 no tiene esa
//!   columna; ver TEAM-012 "Desviaciones del brief").
//!
//! Contrato con el frontend (`src/api/tauri.ts`):
//! - `print_ticket(ticket_id)` -> `PrintTicketResult`.
//! - `retry_pending_tickets(cash_session_id)` -> `RetryResult`.
//! - `list_delivery_devices()` -> `Vec<String>`.
//! - `delivery_health_check()` -> `()`.

use std::time::Instant;

use serde::Serialize;
use tauri::State;
use tracing::{debug, error, info, warn};
use uuid::Uuid;

use crate::db::repository::attractions as repo_attractions;
use crate::db::repository::delivery_attempts as repo_attempts;
use crate::db::repository::delivery_attempts::{CreateDeliveryAttemptInput, MAX_PAYLOAD_BYTES};
use crate::db::repository::tickets as repo_tickets;
use crate::delivery::format::{format_ticket_for_file, format_ticket_for_thermal};
use crate::domain::ticket_delivery_attempt::{
    DeliveryErrorCode, DeliveryKind, DeliveryOutcome,
};
use crate::errors::{AppError, SerializableError};
use crate::state::AppState;

// ============================================================
// Outputs (serializan al frontend)
// ============================================================

/// Resultado de un intento de imprimir un ticket. Se devuelve SIEMPRE
/// (aunque haya error), porque la venta nunca debe fallar por la
/// impresion. El frontend decide que mostrar segun `success`.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PrintTicketResult {
    pub ticket_id: String,
    pub success: bool,
    /// `'success' | 'failure'`. String para no atar el frontend
    /// a la representacion interna del enum.
    pub outcome: String,
    /// `Some("offline")` etc. cuando `success = false`.
    pub error_code: Option<String>,
    pub error_detail: Option<String>,
    /// Latencia observada del intento (incluye apertura, escritura
    /// y registro en BD). En milisegundos.
    pub latency_ms: u64,
    /// `'thermal' | 'file' | 'noop' | ...`. Util para que la UI
    /// sepa que backend respondio.
    pub backend_kind: String,
}

/// Resumen del reintento de pendientes de una caja.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RetryResult {
    pub attempted: u32,
    pub succeeded: u32,
    pub failed: u32,
    pub details: Vec<PrintTicketResult>,
}

/// Estado del backend de impresion para la UI (cierra H1).
///
/// El frontend usa este command en el indicador de salud de la
/// cabecera global (`PrinterHealthBadge`) para mostrar un warning
/// explicito cuando hubo un fallback silencioso en el arranque
/// (p.ej. `FERIANET_TICKETS_DIR` no escribible -> NoOp). Antes de
/// TEAM-014 esto se manifestaba como "Impresora OK" verde, lo que
/// era enganoso.
///
/// Campos:
/// - `kind`: backend activo actualmente (el que responderia a un
///   `deliver()`).
/// - `attempted_kind`: backend que se intento usar originalmente
///   antes del fallback. `Some(k)` indica que hubo fallback.
/// - `healthy`: `health_check()` del backend activo (true si OK).
///   Si hay `init_error`, esto sera `false` aunque el backend
///   activo (NoOp) reporte OK por contrato.
/// - `devices`: dispositivos detectados por el backend activo.
///   Util para el tooltip del badge.
/// - `init_error`: mensaje legible del error en el arranque (si lo
///   hubo). La UI lo muestra verbatim o lo resume.
/// - `backend_label`: etiqueta legible ya formateada para mostrar
///   al operador (p.ej. "Thermal (USB)", "NoOp (fallback desde File: ...)").
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeliveryStatus {
    pub kind: DeliveryKind,
    pub attempted_kind: Option<DeliveryKind>,
    pub healthy: bool,
    pub devices: Vec<String>,
    pub init_error: Option<String>,
    pub backend_label: String,
}

// ============================================================
// Commands
// ============================================================

/// Intenta entregar un ticket usando el backend activo. Nunca
/// falla la venta: si el backend falla, devuelve
/// `PrintTicketResult { success: false, ... }` con el `error_code`
/// y registra el intento en `ticket_delivery_attempt`.
///
/// La latencia se mide en memoria y se devuelve al frontend
/// (no se persiste; el schema V003 no tiene columna para ello).
#[tauri::command]
pub async fn print_ticket(
    state: State<'_, AppState>,
    ticket_id: String,
) -> Result<PrintTicketResult, SerializableError> {
    let started = Instant::now();
    let ticket_uuid = parse_uuid(&ticket_id)?;
    let backend_kind = state.delivery.kind();

    debug!(
        target: "cmd.delivery.print_ticket",
        ticket_id = %ticket_uuid,
        backend = %backend_kind_str(backend_kind),
        "iniciando intento de impresion"
    );

    // 1. Cargar ticket. Si no existe -> error de input (no es
    //    fallo de delivery, es bug del caller).
    let mut conn = state.db.conn().await;
    let ticket = repo_tickets::get_ticket(&mut *conn, &ticket_uuid)
        .map_err(SerializableError::from)?
        .ok_or_else(|| {
            SerializableError::from(AppError::NotFound(format!(
                "no existe el ticket {}",
                ticket_uuid
            )))
        })?;

    // 2. Cargar atraccion para resolver el nombre.
    let attraction = repo_attractions::get_attraction(&mut *conn, &ticket.attraction_id)
        .map_err(SerializableError::from)?
        .ok_or_else(|| {
            SerializableError::from(AppError::NotFound(format!(
                "no existe la atraccion {} del ticket {}",
                ticket.attraction_id, ticket_uuid
            )))
        })?;

    // 3. Formatear payload segun el backend activo.
    let payload: Vec<u8> = match backend_kind {
        DeliveryKind::Thermal => format_ticket_for_thermal(&ticket, &attraction.name),
        DeliveryKind::File => format_ticket_for_file(&ticket, &attraction.name),
        // NoOp / Rfid (futuro) / Unknown: payload vacio. La
        // entrega NoOp ignora el payload por contrato del trait.
        _ => Vec::new(),
    };

    // 4. Intentar la entrega. Capturamos el error SIN propagarlo
    //    (regla dura: la venta no falla por la impresion).
    let delivery_outcome = state
        .delivery
        .deliver(&ticket.id.to_string(), &payload)
        .await;

    let latency_ms = started.elapsed().as_millis() as u64;
    let now = chrono::Utc::now();

    let (
        success,
        outcome,
        error_code,
        error_detail,
    ) = match &delivery_outcome {
        Ok(()) => (
            true,
            DeliveryOutcome::Success,
            DeliveryErrorCode::None,
            None,
        ),
        Err(e) => {
            warn!(
                target: "cmd.delivery.print_ticket",
                ticket_id = %ticket_uuid,
                backend = %backend_kind_str(backend_kind),
                error = %e,
                "fallo la entrega"
            );
            (
                false,
                DeliveryOutcome::Failure,
                err_code_from_str(e.to_error_code()),
                Some(e.to_string()),
            )
        }
    };

    // 5. Registrar el intento en BD. Si la propia BD falla aqui
    //    (muy raro), lo logueamos pero NO revertimos la entrega:
    //   我们已经知道了 el resultado del backend y eso es lo que
    //    importa al operador.
    let payload_for_bd: Option<Vec<u8>> = if payload.is_empty() {
        None
    } else if payload.len() > MAX_PAYLOAD_BYTES {
        Some(payload[..MAX_PAYLOAD_BYTES].to_vec())
    } else {
        Some(payload)
    };

    let attempt_input = CreateDeliveryAttemptInput {
        ticket_id: ticket_uuid,
        delivery_kind: backend_kind,
        outcome,
        error_code,
        error_detail: error_detail.clone(),
        payload: payload_for_bd,
        attempted_at: now,
    };

    if let Err(e) = repo_attempts::create_delivery_attempt(&mut *conn, &attempt_input) {
        // No fallamos el command, pero el log es critico para
        // depurar.
        error!(
            target: "cmd.delivery.print_ticket",
            ticket_id = %ticket_uuid,
            "no se pudo registrar el TicketDeliveryAttempt: {}",
            e
        );
    }

    let backend_kind_str = backend_kind_str(backend_kind).to_string();
    Ok(PrintTicketResult {
        ticket_id: ticket_uuid.to_string(),
        success,
        outcome: outcome.as_str().to_string(),
        error_code: if error_code == DeliveryErrorCode::None {
            None
        } else {
            Some(error_code.as_str().to_string())
        },
        error_detail,
        latency_ms,
        backend_kind: backend_kind_str,
    })
}

/// Reintenta la entrega de todos los tickets pendientes de una caja.
/// Por cada ticket pendiente, ejecuta el mismo flujo que
/// `print_ticket` y agrega el resultado.
///
/// **Importante**: aunque internamente cada intento es async, este
/// command los procesa **secuencialmente** para no saturar el
/// puerto USB ni el spooler de Windows. Si en el futuro se quiere
/// paralelizar, se limita el paralelismo con un semaphore.
#[tauri::command]
pub async fn retry_pending_tickets(
    state: State<'_, AppState>,
    cash_session_id: String,
) -> Result<RetryResult, SerializableError> {
    let cash_session_uuid = parse_uuid(&cash_session_id)?;

    let mut conn = state.db.conn().await;
    let pending = repo_tickets::list_pending_tickets_by_cash_session(&mut *conn, &cash_session_uuid)
        .map_err(SerializableError::from)?;
    drop(conn); // Liberamos el mutex del pool entre iteraciones
                // (cada print_ticket abre su propio conn()).

    info!(
        target: "cmd.delivery.retry_pending",
        cash_session_id = %cash_session_uuid,
        pending = pending.len(),
        "reintentando tickets pendientes"
    );

    let mut details = Vec::with_capacity(pending.len());
    let mut succeeded = 0u32;
    let mut failed = 0u32;

    for ticket in pending {
        // Llamamos al mismo flujo que print_ticket. Reutilizamos
        // la funcion helper local `deliver_one` para evitar
        // re-abrir el `State` por cada ticket.
        let result = deliver_one(&state, ticket.id).await?;
        if result.success {
            succeeded += 1;
        } else {
            failed += 1;
        }
        details.push(result);
    }

    Ok(RetryResult {
        attempted: (succeeded + failed),
        succeeded,
        failed,
        details,
    })
}

/// Lista los dispositivos del backend activo (impresoras USB
/// detectadas por `usbprint.sys`, ruta del directorio file, etc.).
#[tauri::command]
pub async fn list_delivery_devices(
    state: State<'_, AppState>,
) -> Result<Vec<String>, SerializableError> {
    state
        .delivery
        .list_devices()
        .await
        .map_err(|e| SerializableError::from(crate::errors::AppError::from(e)))
}

/// Health check del backend activo. Devuelve `Ok(())` si esta
/// disponible. La UI lo usa para mostrar un indicador en la
/// cabecera.
#[tauri::command]
pub async fn delivery_health_check(
    state: State<'_, AppState>,
) -> Result<(), SerializableError> {
    state
        .delivery
        .health_check()
        .await
        .map_err(|e| SerializableError::from(crate::errors::AppError::from(e)))
}

/// Estado completo del backend de impresion para la UI.
///
/// Cierra el hallazgo H1 del QA de la epica 3: el frontend puede
/// ahora distinguir "NoOp sin error" (modo demo) de "NoOp con
/// fallback" (alguien configuro algo y fallo). El campo
/// `init_error` y `attempted_kind` exponen la informacion que antes
/// se perdia en el fallback silencioso del `DeliveryRegistry`.
///
/// La UI llama a este command en el render inicial y tras el
/// health check (no hace falta polling dedicado: el `refetchInterval`
/// de `useDeliveryHealthCheck` ya cubre la periodicidad).
#[tauri::command]
pub async fn get_delivery_status(
    state: State<'_, AppState>,
) -> Result<DeliveryStatus, SerializableError> {
    let registry = &state.delivery;
    let kind = registry.kind();
    let attempted_kind = registry.attempted_backend();
    let init_error = registry.init_error().map(|s| s.to_string());

    // Health check. Si init_error esta presente, devuelve Err y por
    // tanto healthy=false; si no, delegamos al backend activo.
    let healthy = registry.health_check().await.is_ok();

    // Listado de dispositivos del backend activo. Si falla, logueamos
    // y devolvemos lista vacia (no es bloqueante para el command).
    let devices = match registry.list_devices().await {
        Ok(devs) => devs,
        Err(e) => {
            warn!(
                target: "cmd.delivery.get_delivery_status",
                error = %e,
                "list_devices fallo; devolviendo lista vacia"
            );
            Vec::new()
        }
    };

    let backend_label = build_backend_label(kind, attempted_kind, init_error.as_deref());

    Ok(DeliveryStatus {
        kind,
        attempted_kind,
        healthy,
        devices,
        init_error,
        backend_label,
    })
}

/// Construye la etiqueta legible del backend para la UI.
///
/// Reglas:
/// - Si no hay fallback: `kind` plano (p.ej. "Thermal (\\?\USB#VID_xxxx...)"
///   o "NoOp (sin dispositivo)" o "File (C:\path)").
/// - Si hay fallback (init_error presente): "NoOp (fallback desde
///   {attempted_kind}: {init_error truncado})".
fn build_backend_label(
    kind: DeliveryKind,
    attempted_kind: Option<DeliveryKind>,
    init_error: Option<&str>,
) -> String {
    if let (Some(attempted), Some(err)) = (attempted_kind, init_error) {
        // Truncar el error para que el label no sea un wall-of-text.
        // 80 chars es suficiente para una cabecera y cabe en tooltip.
        const MAX_ERR_CHARS: usize = 80;
        let truncated: String = if err.chars().count() > MAX_ERR_CHARS {
            let s: String = err.chars().take(MAX_ERR_CHARS).collect();
            format!("{}...", s)
        } else {
            err.to_string()
        };
        return format!(
            "NoOp (fallback desde {}: {})",
            backend_kind_str(attempted),
            truncated
        );
    }
    // Sin fallback: etiqueta segun el backend activo.
    match kind {
        DeliveryKind::Thermal => "Thermal (configurado)".to_string(),
        DeliveryKind::File => "File (configurado)".to_string(),
        DeliveryKind::Noop => "NoOp (sin dispositivo)".to_string(),
        DeliveryKind::Rfid => "Rfid (no implementado v1)".to_string(),
        DeliveryKind::Unknown => "Unknown (estado inconsistente)".to_string(),
    }
}

// ============================================================
// Helpers
// ============================================================

/// Refactor de `print_ticket` para reutilizar en `retry_pending_tickets`.
/// No es un `#[tauri::command]`; solo se llama desde Rust.
async fn deliver_one(
    state: &State<'_, AppState>,
    ticket_id: Uuid,
) -> Result<PrintTicketResult, SerializableError> {
    let started = Instant::now();
    let backend_kind = state.delivery.kind();

    let mut conn = state.db.conn().await;
    let ticket = repo_tickets::get_ticket(&mut *conn, &ticket_id)
        .map_err(SerializableError::from)?
        .ok_or_else(|| {
            SerializableError::from(AppError::NotFound(format!(
                "no existe el ticket {}",
                ticket_id
            )))
        })?;

    let attraction = repo_attractions::get_attraction(&mut *conn, &ticket.attraction_id)
        .map_err(SerializableError::from)?
        .ok_or_else(|| {
            SerializableError::from(AppError::NotFound(format!(
                "no existe la atraccion {} del ticket {}",
                ticket.attraction_id, ticket_id
            )))
        })?;

    let payload: Vec<u8> = match backend_kind {
        DeliveryKind::Thermal => format_ticket_for_thermal(&ticket, &attraction.name),
        DeliveryKind::File => format_ticket_for_file(&ticket, &attraction.name),
        _ => Vec::new(),
    };

    let delivery_outcome = state
        .delivery
        .deliver(&ticket.id.to_string(), &payload)
        .await;

    let latency_ms = started.elapsed().as_millis() as u64;
    let now = chrono::Utc::now();

    let (success, outcome, error_code, error_detail) = match &delivery_outcome {
        Ok(()) => (
            true,
            DeliveryOutcome::Success,
            DeliveryErrorCode::None,
            None,
        ),
        Err(e) => (
            false,
            DeliveryOutcome::Failure,
            err_code_from_str(e.to_error_code()),
            Some(e.to_string()),
        ),
    };

    let payload_for_bd: Option<Vec<u8>> = if payload.is_empty() {
        None
    } else if payload.len() > MAX_PAYLOAD_BYTES {
        Some(payload[..MAX_PAYLOAD_BYTES].to_vec())
    } else {
        Some(payload)
    };

    let attempt_input = CreateDeliveryAttemptInput {
        ticket_id,
        delivery_kind: backend_kind,
        outcome,
        error_code,
        error_detail: error_detail.clone(),
        payload: payload_for_bd,
        attempted_at: now,
    };

    if let Err(e) = repo_attempts::create_delivery_attempt(&mut *conn, &attempt_input) {
        error!(
            target: "cmd.delivery.retry",
            ticket_id = %ticket_id,
            "no se pudo registrar el TicketDeliveryAttempt: {}",
            e
        );
    }

    let backend_kind_str = backend_kind_str(backend_kind).to_string();
    Ok(PrintTicketResult {
        ticket_id: ticket_id.to_string(),
        success,
        outcome: outcome.as_str().to_string(),
        error_code: if error_code == DeliveryErrorCode::None {
            None
        } else {
            Some(error_code.as_str().to_string())
        },
        error_detail,
        latency_ms,
        backend_kind: backend_kind_str,
    })
}

fn parse_uuid(s: &str) -> Result<Uuid, AppError> {
    Uuid::parse_str(s).map_err(|_| AppError::InvalidInput(format!("UUID inválido: {}", s)))
}

/// Convierte el `DeliveryKind` activo a la cadena estable que
/// ve el frontend (`thermal`, `file`, `noop`, ...). Mapeo
/// explicito para no atarnos a `serde` del enum interno.
fn backend_kind_str(kind: DeliveryKind) -> &'static str {
    match kind {
        DeliveryKind::Thermal => "thermal",
        DeliveryKind::File => "file",
        DeliveryKind::Noop => "noop",
        DeliveryKind::Rfid => "rfid",
        DeliveryKind::Unknown => "unknown",
    }
}

/// Traduce el `error_code` que devuelve `DeliveryError::to_error_code`
/// (que ya devuelve una `&'static str` canonica) al enum fuerte
/// del dominio, para guardarlo en BD. Si el mapping no encaja
/// (no deberia pasar), cae a `Unknown`.
fn err_code_from_str(s: &str) -> DeliveryErrorCode {
    match s {
        "offline" => DeliveryErrorCode::Offline,
        "out_of_paper" => DeliveryErrorCode::OutOfPaper,
        "jammed" => DeliveryErrorCode::Jammed,
        "timeout" => DeliveryErrorCode::Timeout,
        "none" => DeliveryErrorCode::None,
        _ => DeliveryErrorCode::Unknown,
    }
}
