//! Errores de la aplicacion.
//!
//! Capa comun para errores del dominio y de infraestructura.
//! Se serializa a un tipo plano (`SerializableError`) para que el
//! frontend pueda mostrar mensajes utiles sin filtrar internos.

use serde::{Serialize, Serializer};
use thiserror::Error;

/// Error interno de la aplicacion. NO se expone tal cual al frontend;
/// se convierte a [`SerializableError`] en la frontera de commands Tauri.
#[allow(dead_code)] // Algunas variantes se usan en epicicas futuras.
#[derive(Debug, Error)]
pub enum AppError {
    /// Recurso no encontrado (UUID inexistente, etc.).
    #[error("recurso no encontrado: {0}")]
    NotFound(String),

    /// Entrada del cliente invalida (longitud, formato, rango, etc.).
    #[error("entrada invalida: {0}")]
    InvalidInput(String),

    /// Violacion de una restriccion UNIQUE.
    #[error("conflicto de unicidad: {0}")]
    UniqueViolation(String),

    /// Violacion de una clave foranea u otra restriccion CHECK.
    #[error("restriccion de integridad: {0}")]
    ConstraintViolation(String),

    /// Ya existe una caja abierta para esta atraccion. Una sola
    /// caja abierta por atraccion simultaneamente (data-model §5.2).
    /// Se traduce del indice UNIQUE parcial V003 sobre `cash_session
    /// WHERE closed_at IS NULL`.
    #[error("ya hay una caja abierta para esta atracción: {0}")]
    CashSessionAlreadyOpen(String),

    /// Operacion rechazada: la caja ya esta cerrada.
    /// (data-model §5.3: una caja cerrada no acepta nuevas ventas.)
    #[error("la caja ya está cerrada: {0}")]
    CashSessionClosed(String),

    /// Venta invalida: totales incoherentes, oferta sin linea
    /// valida, etc. Validacion en capa de aplicacion al crear
    /// o modificar una `Sale`.
    #[error("venta inválida: {0}")]
    InvalidSale(String),

    /// Error de SQLite (propagado de rusqlite).
    #[error("error de base de datos: {0}")]
    Database(#[from] rusqlite::Error),

    /// Error interno no clasificable.
    #[error("error interno: {0}")]
    Internal(String),
}

impl AppError {
    /// Devuelve una `String` clasificada apta para mostrar al usuario.
    pub fn to_serializable(&self) -> SerializableError {
        let kind = match self {
            AppError::NotFound(_) => "not_found",
            AppError::InvalidInput(_) => "invalid_input",
            AppError::UniqueViolation(_) => "unique_violation",
            AppError::ConstraintViolation(_) => "constraint_violation",
            AppError::CashSessionAlreadyOpen(_) => "cash_session_already_open",
            AppError::CashSessionClosed(_) => "cash_session_closed",
            AppError::InvalidSale(_) => "invalid_sale",
            AppError::Database(_) => "database",
            AppError::Internal(_) => "internal",
        };
        SerializableError {
            kind: kind.to_string(),
            message: self.to_string(),
        }
    }
}

/// Forma serializable que recibe el frontend (TS).
///
/// ```json
/// { "kind": "not_found", "message": "recurso no encontrado: ..." }
/// ```
#[derive(Debug, Clone, Serialize)]
pub struct SerializableError {
    pub kind: String,
    pub message: String,
}

impl From<AppError> for SerializableError {
    fn from(e: AppError) -> Self {
        e.to_serializable()
    }
}

// Para que `Result<T, AppError>` funcione como retorno de un command
// Tauri, implementamos Serialize manualmente para AppError.
impl Serialize for AppError {
    fn serialize<S: Serializer>(&self, ser: S) -> Result<S::Ok, S::Error> {
        self.to_serializable().serialize(ser)
    }
}

/// Tipo de retorno canonico de los commands Tauri.
///
/// Atajo: cualquier command que pueda fallar de forma controlada
/// devuelve `Result<T, AppError>` y la frontera IPC lo serializa
/// como `SerializableError`.
pub type AppResult<T> = std::result::Result<T, AppError>;