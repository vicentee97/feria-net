//! `ThermalPrinterDelivery`: backend ESC/POS sobre USB nativo de
//! Windows.
//!
//! Implementacion de produccion. Usa el crate `escpos` (v0.19.x) y
//! su driver `WindowsUsbPrintDriver` que envuelve `usbprint.sys`
 //! + Win32 API (`CreateFile` / `WriteFile` / `CloseHandle`).
//!
//! **Por que este driver y no `libusb` / `hidapi`**:
//! - Es el driver nativo que Windows usa para impresoras POS USB.
//! - No requiere Zadig ni instalar un driver alternativo.
//! - La impresora sigue siendo accesible al spooler de Windows en
//!   paralelo (util para que el feriante imprima un PDF de backup
//!   desde Notepad, por ejemplo).
//!
//! **Configuracion**:
//! - `FERIANET_PRINTER=<device_path>` activa este backend.
//! - `device_path` es el **path completo de Windows** que devuelve
//!   `WindowsUsbPrintDriver::list()` (formato:
//!   `\\?\USB#VID_xxxx&PID_xxxx#...`), NO el nombre corto tipo
//!   "USB001". Esto es una **desviacion documentada (P3)** del
//!   brief: el brief sugirio "USB001" pero la API real de `escpos`
//!   v0.19 espera el path completo. La UI futura debera resolver
//!   el nombre corto al path completo antes de invocar al backend.
//!
//! **Plataforma**: este modulo solo se compila en **Windows**. En
//! otras plataformas (Linux/macOS), el backend reporta
//! `Internal("Plataforma no soportada")` y el `DeliveryRegistry`
//! cae a `NoOpDelivery` o a `FileDelivery` segun el entorno. Esto
//! respeta SSOT §3 (MVP es Windows-first).
//!
//! **Riesgo abierto (epica 9)**: el codigo compila y se prueba
//! contra el trait, pero **no se ha ejecutado contra hardware
//! fisico real** en el entorno de desarrollo. La validacion con
//! impresoras de feriante (S-B del ARCHITECTURE §2.5) es un
//! entregable de la epica 9 de QA.
//!
//! **Timeout (TEAM-014)**: `deliver()` envuelve la escritura con
//! un timeout de 5 segundos via `tokio::time::timeout` (sobre un
//! `spawn_blocking` para no bloquear el executor). Sin esto, una
//! impresora que cuelga (USB stall, driver zombi) dejaba la UI en
//! "Imprimiendo..." indefinidamente (P2 @revisor).

use std::time::Duration;

use async_trait::async_trait;
use tracing::{debug, warn};

use crate::delivery::backend::{DeliveryBackend, DeliveryError};
use crate::domain::ticket_delivery_attempt::DeliveryKind;

/// Timeout maximo para una operacion de escritura en la impresora.
/// Si la impresora no responde en este tiempo, devolvemos
/// `DeliveryError::Timeout` en lugar de bloquear indefinidamente.
const DELIVER_TIMEOUT_SECS: u64 = 5;

// =================================================================
// Codigo Windows: usa `escpos::driver::WindowsUsbPrintDriver`.
// =================================================================
#[cfg(windows)]
mod imp {
    use super::*;
    use escpos::driver::{Driver, WindowsUsbPrintDriver};

    /// Abre el driver para el `device_path` configurado.
    /// Devuelve `DeviceUnavailable` si la ruta no es valida o la
    /// impresora esta desconectada.
    pub(super) fn open_driver(
        device_path: &str,
    ) -> Result<WindowsUsbPrintDriver, DeliveryError> {
        WindowsUsbPrintDriver::open(device_path).map_err(|e| {
            DeliveryError::DeviceUnavailable(format!(
                "no se pudo abrir la impresora en '{}': {}",
                device_path, e
            ))
        })
    }

    /// Lista los dispositivos USB disponibles via `usbprint.sys`.
    /// Devuelve una lista de strings legibles (device path + VID/PID).
    pub(super) fn list_printers() -> Result<Vec<String>, DeliveryError> {
        let infos = WindowsUsbPrintDriver::list().map_err(|e| {
            DeliveryError::Internal(format!(
                "no se pudo enumerar impresoras USB: {}",
                e
            ))
        })?;
        Ok(infos
            .into_iter()
            .map(|i| {
                let vid = i
                    .vendor_id
                    .map(|v| format!("VID={:#06x}", v))
                    .unwrap_or_else(|| "VID=?".to_string());
                let pid = i
                    .product_id
                    .map(|p| format!("PID={:#06x}", p))
                    .unwrap_or_else(|| "PID=?".to_string());
                format!("{} ({}, {})", i.device_path, vid, pid)
            })
            .collect())
    }

    /// Escribe `payload` a la impresora y vacia el buffer. Encapsula
    /// las llamadas a `Driver::write` y `Driver::flush` para que el
    /// modulo exterior no necesite importar el trait `Driver`
    /// (mantiene la superficie publica limpia).
    pub(super) fn write_payload(
        device_path: &str,
        payload: &[u8],
    ) -> Result<(), DeliveryError> {
        let driver = open_driver(device_path)?;
        driver.write(payload).map_err(|e| {
            DeliveryError::Communication(format!("WriteFile fallo: {}", e))
        })?;
        // `usbprint.sys` no implementa flush, pero el `Driver::flush`
        // del crate ya trata `ERROR_INVALID_FUNCTION` como OK.
        driver.flush().map_err(|e| {
            DeliveryError::Communication(format!("FlushFileBuffers fallo: {}", e))
        })?;
        // `driver` se dropea aqui, cerrando el handle de Windows.
        Ok(())
    }
}

// =================================================================
// Codigo no-Windows: stub que reporta plataforma no soportada.
// =================================================================
#[cfg(not(windows))]
mod imp {
    use super::*;

    pub(super) fn open_driver(
        _device_path: &str,
    ) -> Result<(), DeliveryError> {
        Err(DeliveryError::Internal(
            "plataforma no soportada: ThermalPrinterDelivery solo compila en Windows".into(),
        ))
    }

    pub(super) fn list_printers() -> Result<Vec<String>, DeliveryError> {
        Err(DeliveryError::Internal(
            "plataforma no soportada: ThermalPrinterDelivery solo compila en Windows".into(),
        ))
    }
}

// =================================================================
// Struct publico, multiplataforma en su firma.
// =================================================================

/// `DeliveryBackend` que imprime en una termica ESC/POS USB en
/// Windows. El `device_path` lo resuelve el `DeliveryRegistry` a
/// partir de la variable de entorno `FERIANET_PRINTER`.
///
/// El backend no mantiene una conexion abierta entre llamadas:
/// cada `deliver` / `health_check` abre, opera y cierra. Esto es
/// simple y robusto para el volumen de v1 (<1000 tickets/dia); si
/// el perfil de uso lo exige, se puede mantener un pool en el
/// futuro sin cambiar el trait.
pub struct ThermalPrinterDelivery {
    device_path: String,
}

impl ThermalPrinterDelivery {
    /// Crea un `ThermalPrinterDelivery` que apunta a la impresora
    /// identificada por `device_path`. El path NO se valida en
    /// construccion (no abrimos la conexion): si es invalido, los
    /// siguientes `deliver` / `health_check` fallaran con un error
    /// clasificado.
    pub fn new(device_path: impl Into<String>) -> Self {
        Self {
            device_path: device_path.into(),
        }
    }

    /// Devuelve el `device_path` configurado. Solo para
    /// inspeccion / tests.
    pub fn device_path(&self) -> &str {
        &self.device_path
    }
}

#[async_trait]
impl DeliveryBackend for ThermalPrinterDelivery {
    fn kind(&self) -> DeliveryKind {
        DeliveryKind::Thermal
    }

    async fn list_devices(&self) -> Result<Vec<String>, DeliveryError> {
        let mut devices = imp::list_printers()?;
        // Siempre incluimos la ruta configurada para que el
        // operador sepa que backend tiene activo, aunque no este
        // conectada en este momento.
        devices.push(format!("configurado: {}", self.device_path));
        Ok(devices)
    }

    async fn health_check(&self) -> Result<(), DeliveryError> {
        // Estrategia: enumeramos. Si la lista viene vacia y la
        // ruta configurada tampoco abre, devolvemos
        // `DeviceUnavailable`. Si `list` ya falla, eso es Internal.
        match imp::list_printers() {
            Ok(devices) => {
                if devices.is_empty() {
                    Err(DeliveryError::DeviceUnavailable(
                        "no hay impresoras USB detectadas por usbprint.sys".into(),
                    ))
                } else {
                    // La ruta configurada podria no estar entre las
                    // detectadas (cable recien conectado, etc.),
                    // pero si hay al menos una, el backend esta
                    // "vivo". La validacion estricta se hace en
                    // `deliver`.
                    debug!(
                        target: "delivery.thermal",
                        "health_check: {} impresora(s) detectada(s)",
                        devices.len()
                    );
                    Ok(())
                }
            }
            Err(e) => {
                warn!(target: "delivery.thermal", "health_check fallo: {}", e);
                Err(e)
            }
        }
    }

    async fn deliver(&self, ticket_id: &str, payload: &[u8]) -> Result<(), DeliveryError> {
        // Trazabilidad minima: el command que llama ya escribe el
        // TicketDeliveryAttempt; aqui solo dejamos un log para
        // depurar emparejamientos payload/ticket.
        debug!(
            target: "delivery.thermal",
            ticket_id,
            bytes = payload.len(),
            device = %self.device_path,
            "entregando ticket a termica"
        );

        // La escritura real va por `do_write` (async, usa
        // `spawn_blocking` para que el USB I/O sincrono no bloquee
        // el executor de tokio). Anadimos un timeout para que una
        // impresora que cuelga devuelva `Timeout` en lugar de
        // dejar la UI colgada (P2 @revisor, TEAM-014).
        let device_path = self.device_path.clone();
        let payload_owned = payload.to_vec();
        let ticket_id_owned = ticket_id.to_string();

        match tokio::time::timeout(
            Duration::from_secs(DELIVER_TIMEOUT_SECS),
            Self::do_write(device_path, payload_owned, ticket_id_owned),
        )
        .await
        {
            Ok(inner_result) => inner_result,
            Err(_elapsed) => {
                warn!(
                    target: "delivery.thermal",
                    timeout_secs = DELIVER_TIMEOUT_SECS,
                    device = %self.device_path,
                    "timeout: la impresora no respondio a tiempo"
                );
                Err(DeliveryError::Timeout(format!(
                    "La impresora no respondio en {} segundos (device={})",
                    DELIVER_TIMEOUT_SECS, self.device_path
                )))
            }
        }
    }
}

impl ThermalPrinterDelivery {
    /// Escribe `payload` a la impresora, en un hilo bloqueante.
    ///
    /// Se ejecuta dentro de `tokio::task::spawn_blocking` para que
    /// las llamadas Win32 sincronas (`CreateFile` / `WriteFile` /
    /// `CloseHandle` via `escpos`) no bloqueen el executor async.
    /// Cualquier panic del hilo se traduce a `DeliveryError::Internal`.
    async fn do_write(
        device_path: String,
        payload: Vec<u8>,
        ticket_id: String,
    ) -> Result<(), DeliveryError> {
        let join_result = tokio::task::spawn_blocking(move || {
            imp::write_payload(&device_path, &payload)
        })
        .await;

        match join_result {
            Ok(delivery_result) => delivery_result,
            Err(join_err) => {
                // El worker task fallo (panic o cancelacion). El
                // error no es del driver, es del runtime; lo
                // reportamos como Internal para no perderlo en
                // logs.
                warn!(
                    target: "delivery.thermal",
                    ticket_id,
                    "worker task de escritura fallo: {}",
                    join_err
                );
                Err(DeliveryError::Internal(format!(
                    "worker task de escritura termino con error: {}",
                    join_err
                )))
            }
        }
    }
}
