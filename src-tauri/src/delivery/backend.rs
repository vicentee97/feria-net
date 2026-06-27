//! Trait `DeliveryBackend` y `DeliveryError`.
//!
//! Contrato del modulo `ticket-delivery`. La venta solo conoce este
//! trait, nunca una implementacion concreta. Esto cumple SSOT §2:
//! "ninguna parte de la logica de venta puede acoplarse a un tipo de
//! entrega concreto".
//!
//! Implementaciones en v1:
//! - `NoOpDelivery` (tests, modo sin hardware).
//! - `FileDelivery` (depuracion).
//! - `ThermalPrinterDelivery` (produccion, ESC/POS USB en Windows).
//!
//! Una entrega exitosa debe ser **idempotente** a nivel del caller
//! (no del backend): el `ticket_id` se usa como clave de
//! idempotencia y la columna `ticket.id` UNIQUE en BD lo enforce.

use async_trait::async_trait;

use crate::domain::ticket_delivery_attempt::DeliveryKind;

/// Error devuelto por un `DeliveryBackend` al intentar entregar un
/// ticket. La capa de aplicacion traduce cada variante al
/// `error_code` corto persistido en `ticket_delivery_attempt.error_code`
/// (ver `docs/data-model.md` §2.9).
///
/// **Importante**: este error es **interno al backend**. En la
/// frontera de los `#[tauri::command]` se convierte a `AppError` y
/// finalmente a `SerializableError` para no filtrar detalles al
/// frontend.
#[derive(Debug, thiserror::Error)]
pub enum DeliveryError {
    /// Dispositivo no disponible, desconectado, sin permisos, o el
    /// driver no encuentra el hardware. El operador deberia revisar
    /// la conexion fisica o reintentar.
    #[error("dispositivo no disponible: {0}")]
    DeviceUnavailable(String),

    /// Error de comunicacion con el dispositivo (USB, red, etc.).
    /// Tipicamente transitorio: un reintento suele funcionar.
    #[error("error de comunicacion: {0}")]
    Communication(String),

    /// El payload del ticket es invalido para este backend
    /// (formato, longitud, encoding...). Raro; suele ser bug.
    #[error("ticket invalido: {0}")]
    InvalidTicket(String),

    /// La operacion excedio el timeout configurado del backend.
    #[error("timeout: {0}")]
    Timeout(String),

    /// Error interno no clasificable del backend.
    #[error("error interno: {0}")]
    Internal(String),
}

impl DeliveryError {
    /// Traduce el error a un `error_code` corto (snake_case) que se
    /// persiste en `ticket_delivery_attempt.error_code` y que la UI
    /// puede mostrar al operador.
    ///
    /// El mapping es estable y la SSOT lo considera parte del
    /// contrato del modulo. Los valores validos son los del CHECK
    /// constraint de V003:
    /// `'offline' | 'out_of_paper' | 'jammed' | 'timeout' | 'unknown' | 'none'`
    pub fn to_error_code(&self) -> &'static str {
        match self {
            // Mapeo "natural" entre el semantico del backend y los
            // codigos canonicos del modelo. Cualquier nuevo error
            // cae en `unknown` para no inventar codigos.
            DeliveryError::DeviceUnavailable(_) => "offline",
            DeliveryError::Communication(_) => "offline",
            DeliveryError::InvalidTicket(_) => "unknown",
            DeliveryError::Timeout(_) => "timeout",
            DeliveryError::Internal(_) => "unknown",
        }
    }
}

impl From<DeliveryError> for crate::errors::AppError {
    /// Convierte un error de delivery en un `AppError` para que la
    /// frontera IPC lo pueda serializar a `SerializableError`.
    ///
    /// Decision: cualquier error de delivery se reporta como
    /// `Internal(...)` desde el punto de vista del command Tauri
    /// (no se traduce a `NotFound` / `InvalidInput` / etc.) porque
    /// el command que imprime tickets **no debe fallar la venta**.
    /// La traduccion se hace en `commands::delivery::print_ticket`
    /// donde el `DeliveryError` se loguea y se persiste en
    /// `ticket_delivery_attempt`, devolviendo un `PrintTicketResult`
    /// con `success: false` en vez de propagar la excepcion.
    fn from(e: DeliveryError) -> Self {
        crate::errors::AppError::Internal(e.to_string())
    }
}

/// Trait abstracto para entrega de tickets.
///
/// Cualquier implementacion (termica, RFID, noop, file) cumple este
/// contrato. La venta solo ve este trait.
///
/// **Garantias del contrato**:
/// - `deliver` se ejecuta de forma **asincrona**; nunca se llama
///   sincronamente desde la ruta critica de venta. El command
///   Tauri ya devuelve el resultado al frontend, la entrega
///   fisica puede continuar en background.
/// - `list_devices` y `health_check` son **solo informativas** para
///   la UI; no se usan en la ruta de venta.
/// - Las implementaciones deben ser **thread-safe** (`Send + Sync`)
///   porque el `DeliveryRegistry` se comparte via `Arc`.
#[async_trait]
pub trait DeliveryBackend: Send + Sync {
    /// Identifica que tipo de backend es. Util para UI, logs y
    /// para el campo `delivery_kind` en `ticket_delivery_attempt`.
    fn kind(&self) -> DeliveryKind;

    /// Lista los dispositivos disponibles del backend (impresoras
    /// USB conectadas, ruta del directorio file, etc.). La UI lo
    /// usa en la pantalla de configuracion.
    ///
    /// Devuelve una lista de **nombres legibles** para mostrar al
    /// usuario, no IDs internos.
    async fn list_devices(&self) -> Result<Vec<String>, DeliveryError>;

    /// Comprueba el estado del backend (papel, conexion, permisos,
    /// existencia del directorio, etc.). Para `NoOp` siempre
    /// devuelve `Ok(())`.
    ///
    /// Es un health check **ligero**; no imprime nada. Pensado para
    /// ser invocado desde la UI antes de empezar a vender.
    async fn health_check(&self) -> Result<(), DeliveryError>;

    /// Entrega un ticket. La implementacion concreta imprime en
    /// termica, escribe a archivo, o no-op segun el backend.
    ///
    /// `ticket_id` es la **clave de idempotencia**: el caller
    /// (registry / command) ya ha comprobado que no existe un
    /// `TicketDeliveryAttempt` con `outcome = success` para este
    /// ticket antes de llamar, asi que la implementacion puede
    /// confiar en que es la primera entrega.
    ///
    /// `payload` contiene el contenido ya formateado (bytes o texto
    /// especifico del backend). El registry decide el formato:
    /// - Para termica: bytes ESC/POS (con `ESC @` init + corte).
    /// - Para file: texto plano UTF-8.
    /// - Para noop: ignorado.
    ///
    /// Devuelve `Ok(())` si la entrega fue exitosa, o un
    /// `DeliveryError` clasificado.
    async fn deliver(&self, ticket_id: &str, payload: &[u8]) -> Result<(), DeliveryError>;
}
