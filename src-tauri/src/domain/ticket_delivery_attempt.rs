//! Entidad de dominio: `TicketDeliveryAttempt` (Intento de entrega).
//!
//! Historial de intentos de entregar un ticket. Cada entrega
//! (exitosa o fallida) genera una fila aqui. La venta registra
//! UN placeholder inicial (`delivery_kind = 'noop'`, `outcome =
//! 'failure'`, `error_code = 'unknown'`, `error_detail = 'pending'`)
//! para que el modulo `ticket-delivery` (epica 3) lo consulte
//! y actualice. La epica 3 NO necesita migracion: el contrato
//! sigue `docs/data-model.md` §2.9 al pie de la letra desde V003.
//!
//! Ver `docs/data-model.md` §2.9.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Tipo de delivery usado en el intento. Alineado con data-model §2.9.
///
/// API publico para la epica 3 (modulo `ticket-delivery`). En esta
/// epica 2, el repositorio `sales.rs` escribe placeholders via SQL
/// crudo (los strings se mantienen sincronizados aqui).
#[allow(dead_code)]
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum DeliveryKind {
    /// Impresora termica ESC/POS (USB/Bluetooth).
    Thermal,
    /// Futuro: grabador de fichas RFID (epica 8).
    Rfid,
    /// Tests automatizados y modo "sin impresora".
    Noop,
    /// Depuracion: escribe el payload a un archivo.
    File,
    /// Tipo de delivery desconocido o no clasificado.
    Unknown,
}

#[allow(dead_code)] // Usado por epica 3.
impl DeliveryKind {
    /// Cadena usada en SQLite CHECK constraint.
    pub fn as_str(&self) -> &'static str {
        match self {
            DeliveryKind::Thermal => "thermal",
            DeliveryKind::Rfid => "rfid",
            DeliveryKind::Noop => "noop",
            DeliveryKind::File => "file",
            DeliveryKind::Unknown => "unknown",
        }
    }

    /// Intenta parsear desde la cadena persistida.
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "thermal" => Some(Self::Thermal),
            "rfid" => Some(Self::Rfid),
            "noop" => Some(Self::Noop),
            "file" => Some(Self::File),
            "unknown" => Some(Self::Unknown),
            _ => None,
        }
    }
}

/// Resultado del intento. Alineado con data-model §2.9.
///
/// API publico para la epica 3.
#[allow(dead_code)]
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum DeliveryOutcome {
    /// Entrega exitosa (ticket impreso o grabado).
    Success,
    /// Entrega fallida (papel, conexion, timeout, etc.).
    Failure,
}

#[allow(dead_code)] // Usado por epica 3.
impl DeliveryOutcome {
    pub fn as_str(&self) -> &'static str {
        match self {
            DeliveryOutcome::Success => "success",
            DeliveryOutcome::Failure => "failure",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "success" => Some(Self::Success),
            "failure" => Some(Self::Failure),
            _ => None,
        }
    }
}

/// Codigo de error cuando `outcome = failure`. `None` cuando
/// `outcome = success`. Alineado con data-model §2.9.
///
/// API publico para la epica 3.
#[allow(dead_code)]
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum DeliveryErrorCode {
    /// Dispositivo no disponible / desconectado.
    Offline,
    /// Sin papel.
    OutOfPaper,
    /// Atasco de papel / cabezal.
    Jammed,
    /// Timeout de comunicacion.
    Timeout,
    /// Error sin clasificar.
    Unknown,
    /// Sin error (acompana a `outcome = success`).
    None,
}

#[allow(dead_code)] // Usado por epica 3.
impl DeliveryErrorCode {
    pub fn as_str(&self) -> &'static str {
        match self {
            DeliveryErrorCode::Offline => "offline",
            DeliveryErrorCode::OutOfPaper => "out_of_paper",
            DeliveryErrorCode::Jammed => "jammed",
            DeliveryErrorCode::Timeout => "timeout",
            DeliveryErrorCode::Unknown => "unknown",
            DeliveryErrorCode::None => "none",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "offline" => Some(Self::Offline),
            "out_of_paper" => Some(Self::OutOfPaper),
            "jammed" => Some(Self::Jammed),
            "timeout" => Some(Self::Timeout),
            "unknown" => Some(Self::Unknown),
            "none" => Some(Self::None),
            _ => None,
        }
    }
}

/// Intento de entrega de un ticket.
///
/// `payload` se almacena como `Vec<u8>` (BLOB en SQLite). La
/// longitud maxima (4 KB) se enforce en capa de aplicacion al
/// insertar; SQLite no valida tamano de BLOB nativamente.
///
/// API publico para la epica 3 (modulo `ticket-delivery`). En esta
/// epica 2, el repositorio `sales.rs` crea placeholders via SQL
/// crudo directamente sobre `ticket_delivery_attempt`.
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct TicketDeliveryAttempt {
    pub id: Uuid,
    pub ticket_id: Uuid,
    pub attempted_at: DateTime<Utc>,
    pub delivery_kind: DeliveryKind,
    pub outcome: DeliveryOutcome,
    pub error_code: DeliveryErrorCode,
    /// Mensaje detallado del fallo (o "pending" en el placeholder
    /// inicial que crea la venta).
    pub error_detail: Option<String>,
    /// Bytes enviados al hardware (ESC/POS, RFID, etc.) para
    /// depuracion y soporte. Vacio o `None` si no aplica.
    pub payload: Option<Vec<u8>>,
}