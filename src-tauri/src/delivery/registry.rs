//! `DeliveryRegistry`: punto de entrada unico para entregar tickets.
//!
//! Elige el `DeliveryBackend` activo en tiempo de arranque
//! (auto-deteccion por variables de entorno) y expone una API
//! delgada que la capa de commands consume sin acoplarse a una
//! implementacion concreta.
//!
//! **Auto-deteccion** (orden de prioridad):
//! 1. `FERIANET_PRINTER` con un path de dispositivo -> Thermal.
//! 2. `FERIANET_TICKETS_DIR` con un directorio -> File.
//! 3. Ninguno de los anteriores -> NoOp (fallback por defecto).
//!
//! Esto cumple SSOT §2 ("ninguna parte de la logica de venta puede
//! acoplarse a un tipo de entrega concreto"): la venta solo ve
//! `Arc<dyn DeliveryBackend>` y no le importa cual este activo.
//!
//! **Limitacion v1**: el backend se fija en arranque. Cambiarlo
//! requiere reiniciar la app. La UI de "switch en runtime"
//! mencionada en `ARCHITECTURE.md` §5.5 (punto 4) queda como
//! trabajo de la epica de configuracion, post-MVP.
//!
//! **Por que `Arc<dyn DeliveryBackend>`**:
//! - `Arc` porque el registry se comparte con Tauri via
//!   `AppState` y lo consultan varios commands en paralelo.
//! - `dyn DeliveryBackend` para que el binario pueda contener
//!   varias implementaciones y el registry elija una en runtime.

use std::sync::Arc;

use crate::delivery::backend::{DeliveryBackend, DeliveryError};
use crate::delivery::file::FileDelivery;
use crate::delivery::noop::NoOpDelivery;
use crate::delivery::thermal::ThermalPrinterDelivery;
use crate::domain::ticket_delivery_attempt::DeliveryKind;

/// Punto de entrada del modulo `ticket-delivery`. Se construye una
/// sola vez al arrancar la app y se comparte via `AppState`.
pub struct DeliveryRegistry {
    backend: Arc<dyn DeliveryBackend>,
    /// `kind` cacheado para no tener que despachar dinamicamente
    /// en `current().kind()`. Se usa en logs y para serializar el
    /// `backend_kind` en `PrintTicketResult`.
    kind: DeliveryKind,
}

impl DeliveryRegistry {
    /// Crea el registry con auto-deteccion por variables de entorno.
    /// Loguea la decision a `tracing` para que se vea en el log de
    /// arranque.
    pub fn with_auto_detect() -> Self {
        // 1. Termica: `FERIANET_PRINTER` con device path.
        if let Ok(device_path) = std::env::var("FERIANET_PRINTER") {
            if !device_path.trim().is_empty() {
                tracing::info!(
                    target: "delivery.registry",
                    "auto-detect: backend termico seleccionado (FERIANET_PRINTER={})",
                    device_path
                );
                return Self {
                    backend: Arc::new(ThermalPrinterDelivery::new(device_path)),
                    kind: DeliveryKind::Thermal,
                };
            }
        }

        // 2. File: `FERIANET_TICKETS_DIR` con un directorio.
        if let Ok(dir) = std::env::var("FERIANET_TICKETS_DIR") {
            if !dir.trim().is_empty() {
                match FileDelivery::new(&dir) {
                    Ok(file) => {
                        tracing::info!(
                            target: "delivery.registry",
                            "auto-detect: backend file seleccionado (FERIANET_TICKETS_DIR={})",
                            dir
                        );
                        return Self {
                            backend: Arc::new(file),
                            kind: DeliveryKind::File,
                        };
                    }
                    Err(e) => {
                        tracing::warn!(
                            target: "delivery.registry",
                            "FERIANET_TICKETS_DIR={} pero no se pudo crear/abrir el directorio: {}. Cayendo a NoOp.",
                            dir,
                            e
                        );
                    }
                }
            }
        }

        // 3. Fallback: NoOp.
        tracing::info!(
            target: "delivery.registry",
            "auto-detect: ninguna variable de entorno relevante; usando NoOp como fallback"
        );
        Self {
            backend: Arc::new(NoOpDelivery::new()),
            kind: DeliveryKind::Noop,
        }
    }

    /// Crea el registry forzando un `NoOpDelivery`. Util para tests
    /// donde se quiere aislar la logica de la auto-deteccion.
    pub fn noop() -> Self {
        Self {
            backend: Arc::new(NoOpDelivery::new()),
            kind: DeliveryKind::Noop,
        }
    }

    /// Crea el registry con un backend arbitrario. Pensado para
    /// tests que quieran ejercitar el polimorfismo de
    /// `DeliveryBackend` con implementaciones distintas a las
    /// que auto-detect selecciona.
    pub fn with_backend(
        backend: Arc<dyn DeliveryBackend>,
        kind: DeliveryKind,
    ) -> Self {
        Self { backend, kind }
    }

    /// Acceso al backend activo. La capa de commands usa esto para
    /// delegar; los tests de sustitucion lo usan para verificar
    /// que el backend es el esperado.
    pub fn current(&self) -> &Arc<dyn DeliveryBackend> {
        &self.backend
    }

    /// `kind` del backend activo, cacheado en el registry. Mas
    /// barato que `current().kind()` (evita el dispatch dinamico).
    pub fn kind(&self) -> DeliveryKind {
        self.kind
    }

    /// Lista los dispositivos del backend activo. API expuesta al
    /// frontend via `list_delivery_devices`.
    pub async fn list_devices(&self) -> Result<Vec<String>, DeliveryError> {
        self.backend.list_devices().await
    }

    /// Health check del backend activo. API expuesta al frontend
    /// via `delivery_health_check`.
    pub async fn health_check(&self) -> Result<(), DeliveryError> {
        self.backend.health_check().await
    }

    /// Ejecuta la entrega usando el backend activo. API consumida
    /// por `commands::delivery::print_ticket`.
    pub async fn deliver(&self, ticket_id: &str, payload: &[u8]) -> Result<(), DeliveryError> {
        self.backend.deliver(ticket_id, payload).await
    }
}
