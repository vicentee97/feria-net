//! Repositorio de `TicketDeliveryAttempt` (intento de entrega).
//!
//! Tabla `ticket_delivery_attempt` segun `docs/data-model.md` §2.9
//! y el CHECK constraint de V003 (V003__epica2_tpv.sql). La
//! entrega de tickets la escribe el modulo `ticket-delivery`
//! (epica 3 / TEAM-012) y los placeholders los crea la venta en
//! `repository::sales::create_sale`.
//!
//! Por que este modulo vive aparte de `tickets.rs`:
//! - Separacion de responsabilidades: `tickets.rs` consulta
//!   tickets; `delivery_attempts.rs` registra el historial de
//!   intentos.
//! - La venta nunca escribe aqui directamente: el command
//!   `print_ticket` es el unico productor de filas "reales".

use chrono::{DateTime, Utc};
use rusqlite::{params, Connection, Row};
use uuid::Uuid;

use crate::domain::ticket_delivery_attempt::{
    DeliveryErrorCode, DeliveryKind, DeliveryOutcome, TicketDeliveryAttempt,
};
use crate::errors::{AppError, AppResult};

// ============================================================
// Inputs
// ============================================================

/// Entrada para `create_delivery_attempt`. La capa de commands
/// rellena estos campos a partir del resultado del
/// `DeliveryBackend::deliver`.
///
/// `payload` se trunca a 4 KB antes de persistir (limite del
/// CHECK de V003; SQLite no valida longitud de BLOB nativamente).
#[derive(Debug, Clone)]
pub struct CreateDeliveryAttemptInput {
    pub ticket_id: Uuid,
    pub delivery_kind: DeliveryKind,
    pub outcome: DeliveryOutcome,
    pub error_code: DeliveryErrorCode,
    pub error_detail: Option<String>,
    pub payload: Option<Vec<u8>>,
    pub attempted_at: DateTime<Utc>,
}

// ============================================================
// Operaciones
// ============================================================

/// Tamano maximo del payload (bytes) que se persiste en
/// `ticket_delivery_attempt.payload`. Coherente con el CHECK del
/// V003 (que en realidad solo valida cuando es NOT NULL) y con
/// la nota en `docs/data-model.md` §2.9: 4 KB.
pub const MAX_PAYLOAD_BYTES: usize = 4 * 1024;

/// Inserta un `TicketDeliveryAttempt`. Trunca `payload` a
/// `MAX_PAYLOAD_BYTES` si fuera mayor (defensa contra payloads
/// enormes generados por error o por un backend malicioso).
///
/// Devuelve el `id` generado del intento para que la capa de
/// commands lo pueda correlacionar con logs o eventos.
pub fn create_delivery_attempt(
    conn: &Connection,
    input: &CreateDeliveryAttemptInput,
) -> AppResult<Uuid> {
    let id = Uuid::new_v4();
    let payload_truncated: Option<Vec<u8>> = input
        .payload
        .as_ref()
        .map(|p| {
            if p.len() > MAX_PAYLOAD_BYTES {
                tracing::warn!(
                    target: "repo.delivery_attempts",
                    "payload truncado a {} bytes (original: {})",
                    MAX_PAYLOAD_BYTES,
                    p.len()
                );
                p[..MAX_PAYLOAD_BYTES].to_vec()
            } else {
                p.clone()
            }
        });

    conn.execute(
        "INSERT INTO ticket_delivery_attempt \
            (id, ticket_id, attempted_at, delivery_kind, outcome, \
             error_code, error_detail, payload) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            id.to_string(),
            input.ticket_id.to_string(),
            input.attempted_at.to_rfc3339(),
            input.delivery_kind.as_str(),
            input.outcome.as_str(),
            input.error_code.as_str(),
            input.error_detail.as_deref(),
            payload_truncated,
        ],
    )
    .map_err(map_db_err)?;

    Ok(id)
}

/// Cuenta cuantos `TicketDeliveryAttempt` tiene un ticket.
/// Util para sincronizar el campo `delivery_attempts` derivado
/// en memoria (no se persiste en V003, ver `domain/ticket.rs`).
pub fn count_attempts_for_ticket(conn: &Connection, ticket_id: &Uuid) -> AppResult<u32> {
    let n: i64 = conn.query_row(
        "SELECT COUNT(*) FROM ticket_delivery_attempt WHERE ticket_id = ?1",
        params![ticket_id.to_string()],
        |r| r.get(0),
    )?;
    Ok(n as u32)
}

/// Devuelve el ultimo intento de un ticket, o `None` si no tiene.
/// Orden estable por `attempted_at` descendente y luego por `id`
/// descendente (criterio "lo mas reciente primero").
pub fn last_attempt_for_ticket(
    conn: &Connection,
    ticket_id: &Uuid,
) -> AppResult<Option<TicketDeliveryAttempt>> {
    let mut stmt = conn.prepare(
        "SELECT id, ticket_id, attempted_at, delivery_kind, outcome, \
                error_code, error_detail, payload \
         FROM ticket_delivery_attempt \
         WHERE ticket_id = ?1 \
         ORDER BY attempted_at DESC, id DESC \
         LIMIT 1",
    )?;
    let row = stmt
        .query_row(params![ticket_id.to_string()], row_to_attempt)
        .ok();
    Ok(row)
}

// ============================================================
// Helpers internos
// ============================================================

fn row_to_attempt(row: &Row<'_>) -> rusqlite::Result<TicketDeliveryAttempt> {
    let id_str: String = row.get("id")?;
    let ticket_str: String = row.get("ticket_id")?;
    let attempted_at_str: String = row.get("attempted_at")?;
    let delivery_kind_str: String = row.get("delivery_kind")?;
    let outcome_str: String = row.get("outcome")?;
    let error_code_str: String = row.get("error_code")?;
    let error_detail: Option<String> = row.get("error_detail")?;
    let payload: Option<Vec<u8>> = row.get("payload")?;

    let id = Uuid::parse_str(&id_str).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e))
    })?;
    let ticket_id = Uuid::parse_str(&ticket_str).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(1, rusqlite::types::Type::Text, Box::new(e))
    })?;

    let delivery_kind = DeliveryKind::from_str(&delivery_kind_str).ok_or_else(|| {
        rusqlite::Error::FromSqlConversionFailure(
            2,
            rusqlite::types::Type::Text,
            Box::new(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                format!("delivery_kind no reconocido: {}", delivery_kind_str),
            )),
        )
    })?;
    let outcome = DeliveryOutcome::from_str(&outcome_str).ok_or_else(|| {
        rusqlite::Error::FromSqlConversionFailure(
            3,
            rusqlite::types::Type::Text,
            Box::new(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                format!("outcome no reconocido: {}", outcome_str),
            )),
        )
    })?;
    let error_code = DeliveryErrorCode::from_str(&error_code_str).ok_or_else(|| {
        rusqlite::Error::FromSqlConversionFailure(
            4,
            rusqlite::types::Type::Text,
            Box::new(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                format!("error_code no reconocido: {}", error_code_str),
            )),
        )
    })?;
    let attempted_at = DateTime::parse_from_rfc3339(&attempted_at_str)
        .map_err(|e| {
            rusqlite::Error::FromSqlConversionFailure(5, rusqlite::types::Type::Text, Box::new(e))
        })?
        .with_timezone(&Utc);

    Ok(TicketDeliveryAttempt {
        id,
        ticket_id,
        attempted_at,
        delivery_kind,
        outcome,
        error_code,
        error_detail,
        payload,
    })
}

fn map_db_err(e: rusqlite::Error) -> AppError {
    if let rusqlite::Error::SqliteFailure(err, _) = &e {
        if err.code == rusqlite::ErrorCode::ConstraintViolation {
            return AppError::ConstraintViolation(e.to_string());
        }
    }
    AppError::Database(e)
}

// ============================================================
// Tests
// ============================================================

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::pool::DbPool;
    use rusqlite::Connection;
    use std::path::PathBuf;

    /// Helper: crea una BD en memoria con las migraciones V001-V003
    /// aplicadas. Usado por los tests de este modulo.
    fn in_memory_pool() -> Connection {
        let conn = Connection::open_in_memory().expect("open in-memory db");
        // Aplicar PRAGMAs equivalentes al pool real para no
        // divergir en tests.
        conn.pragma_update(None, "foreign_keys", "ON").unwrap();
        // El `DbPool::open` toma un path, no una Connection;
        // aplicamos las migraciones manualmente aqui para evitar
        // dependencia circular en los tests.
        for sql in crate::db::migrations::MIGRATIONS.iter() {
            conn.execute_batch(sql).expect("migration applies");
        }
        conn
    }

    /// Test de smoke: el payload se trunca a MAX_PAYLOAD_BYTES
    /// cuando excede el limite.
    #[test]
    fn create_delivery_attempt_truncates_huge_payload() {
        let conn = in_memory_pool();
        // Crear el ticket minimo necesario para que el FK no
        // falle. Usamos el flujo de venta abreviado.
        let ticket_id = insert_minimal_ticket(&conn);

        let huge: Vec<u8> = vec![0xAB; MAX_PAYLOAD_BYTES + 1024];
        let input = CreateDeliveryAttemptInput {
            ticket_id,
            delivery_kind: DeliveryKind::Thermal,
            outcome: DeliveryOutcome::Success,
            error_code: DeliveryErrorCode::None,
            error_detail: None,
            payload: Some(huge),
            attempted_at: Utc::now(),
        };
        let id = create_delivery_attempt(&conn, &input).expect("create ok");
        // El id es valido.
        assert!(!id.is_nil());

        // El payload persistido esta truncado.
        let last = last_attempt_for_ticket(&conn, &ticket_id)
            .expect("query ok")
            .expect("attempt exists");
        let stored = last.payload.expect("payload debe estar persistido");
        assert_eq!(stored.len(), MAX_PAYLOAD_BYTES);
    }

    #[test]
    fn create_delivery_attempt_persists_all_fields() {
        let conn = in_memory_pool();
        let ticket_id = insert_minimal_ticket(&conn);

        let input = CreateDeliveryAttemptInput {
            ticket_id,
            delivery_kind: DeliveryKind::File,
            outcome: DeliveryOutcome::Failure,
            error_code: DeliveryErrorCode::OutOfPaper,
            error_detail: Some("sin papel".to_string()),
            payload: Some(b"abc".to_vec()),
            attempted_at: Utc::now(),
        };
        create_delivery_attempt(&conn, &input).expect("create ok");

        let last = last_attempt_for_ticket(&conn, &ticket_id)
            .expect("query ok")
            .expect("attempt exists");
        assert_eq!(last.delivery_kind, DeliveryKind::File);
        assert_eq!(last.outcome, DeliveryOutcome::Failure);
        assert_eq!(last.error_code, DeliveryErrorCode::OutOfPaper);
        assert_eq!(last.error_detail.as_deref(), Some("sin papel"));
        assert_eq!(last.payload.as_deref(), Some(b"abc".as_slice()));
    }

    /// Inserta un ticket minimo (mas sus dependencias) para que
    /// los tests de este modulo no necesiten recrear la jerarquia
    /// completa de feria / edicion / atraccion / caja / venta.
    fn insert_minimal_ticket(conn: &Connection) -> Uuid {
        let fair_id = Uuid::new_v4();
        let edition_id = Uuid::new_v4();
        let attraction_id = Uuid::new_v4();
        let cs_id = Uuid::new_v4();
        let sale_id = Uuid::new_v4();
        let sale_line_id = Uuid::new_v4();
        let ticket_id = Uuid::new_v4();
        let now = Utc::now();

        conn.execute(
            "INSERT INTO fair (id, name, created_at) VALUES (?1, ?2, ?3)",
            params![fair_id.to_string(), "Test Fair", now.to_rfc3339()],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO fair_edition (id, fair_id, year, start_date, end_date, status, created_at) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                edition_id.to_string(),
                fair_id.to_string(),
                2026,
                "2026-06-01",
                "2026-06-30",
                "active",
                now.to_rfc3339(),
            ],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO attraction (id, fair_edition_id, name, color, base_ticket_price, is_active) \
             VALUES (?1, ?2, ?3, ?4, ?5, 1)",
            params![
                attraction_id.to_string(),
                edition_id.to_string(),
                "Test Attr",
                "#000000",
                250i64,
            ],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO cash_session \
                (id, attraction_id, date, opened_at, opening_amount) \
             VALUES (?1, ?2, ?3, ?4, 0)",
            params![
                cs_id.to_string(),
                attraction_id.to_string(),
                "2026-06-27",
                now.to_rfc3339(),
            ],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO sale (id, cash_session_id, created_at, total_amount_cents) \
             VALUES (?1, ?2, ?3, 250)",
            params![sale_id.to_string(), cs_id.to_string(), now.to_rfc3339()],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO sale_line (id, sale_id, quantity, unit_price_cents, line_total_cents) \
             VALUES (?1, ?2, 1, 250, 250)",
            params![sale_line_id.to_string(), sale_id.to_string()],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO ticket \
                (id, sale_id, sale_line_id, cash_session_id, fair_edition_id, \
                 attraction_id, created_at, quantity, unit_price_cents, total_cents) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 1, 250, 250)",
            params![
                ticket_id.to_string(),
                sale_id.to_string(),
                sale_line_id.to_string(),
                cs_id.to_string(),
                edition_id.to_string(),
                attraction_id.to_string(),
                now.to_rfc3339(),
            ],
        )
        .unwrap();
        ticket_id
    }

    // Evita el warning de variable no usada si el test se omite.
    #[allow(dead_code)]
    fn _unused_path() -> PathBuf {
        PathBuf::from("ignored")
    }

    // Tambien evita el warning de import no usado.
    #[allow(dead_code)]
    fn _unused_pool() {
        let _ = DbPool::open;
    }
}
