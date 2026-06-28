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
//!
//! **Trazabilidad de errores en arranque (H1 / TEAM-014)**:
//! Si la auto-deteccion no puede inicializar el backend solicitado
//! (p.ej. `FERIANET_TICKETS_DIR` apunta a un directorio no
//! escribible), el registry cae a `NoOpDelivery` PERO conserva:
//! - `init_error`: mensaje legible del fallo (visible via
//!   `init_error()` y expuesto al frontend via el command
//!   `get_delivery_status`).
//! - `attempted_backend`: el `DeliveryKind` que se intento usar
//!   originalmente (visible via `attempted_backend()`).
//! Asi el operador puede saber que la app NO esta entregando
//! tickets al backend que el configuro, en lugar del fallo
//! silencioso a NoOp que reporto @qa-validador (H1).

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
    /// Mensaje de error si la auto-deteccion fallo al intentar
    /// inicializar el backend solicitado (cierra el hallazgo H1
    /// del QA de la epica 3: el operador se entera del fallback
    /// en lugar de creer que todo esta OK). `None` cuando no hubo
    /// error de inicializacion (caso normal: el backend activo es
    /// el que se configuro, o NoOp se eligio por falta de env vars).
    init_error: Option<String>,
    /// Backend que se intento usar originalmente, antes de un
    /// posible fallback a NoOp. `Some(k)` cuando el backend
    /// solicitado fallo al inicializarse y se cayo a NoOp;
    /// `None` en arranque normal (sin env vars) o cuando el
    /// backend solicitado se inicializo correctamente.
    attempted_backend: Option<DeliveryKind>,
}

impl DeliveryRegistry {
    /// Crea el registry con auto-deteccion por variables de entorno.
    /// Loguea la decision a `tracing` para que se vea en el log de
    /// arranque.
    ///
    /// Si la inicializacion del backend solicitado falla (p.ej.
    /// `FERIANET_TICKETS_DIR` no escribible), cae a `NoOpDelivery`
    /// y registra el error en `init_error` + `attempted_backend`
    /// para que `health_check()` y `get_delivery_status` lo
    /// reporten al frontend (H1 cerrado, TEAM-014).
    pub fn with_auto_detect() -> Self {
        // 1. Termica: `FERIANET_PRINTER` con device path.
        if let Ok(device_path) = std::env::var("FERIANET_PRINTER") {
            if !device_path.trim().is_empty() {
                tracing::info!(
                    target: "delivery.registry",
                    "auto-detect: backend termico seleccionado (FERIANET_PRINTER={})",
                    device_path
                );
                // La construccion del ThermalPrinterDelivery nunca
                // falla (no abre USB al construirse). La validacion
                // real del device path ocurre async en
                // `health_check()` y `deliver()`. Por eso no
                // marcamos `init_error` aqui: si el device esta
                // offline, se manifestara en el primer health check
                // o intento de impresion.
                return Self {
                    backend: Arc::new(ThermalPrinterDelivery::new(device_path)),
                    kind: DeliveryKind::Thermal,
                    init_error: None,
                    attempted_backend: None,
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
                            init_error: None,
                            attempted_backend: None,
                        };
                    }
                    Err(e) => {
                        // Antes (H1): fallback silencioso a NoOp con
                        // un `tracing::warn`. El operador no se
                        // enteraba de que la app NO estaba
                        // guardando tickets.
                        // Ahora (TEAM-014): conservamos el mensaje
                        // en `init_error` y el backend intentado en
                        // `attempted_backend` para que `health_check`
                        // y `get_delivery_status` lo expongan al
                        // frontend.
                        let msg = format!(
                            "FERIANET_TICKETS_DIR='{}' no se pudo inicializar: {}. \
                             La app ha caido a NoOp y NO esta guardando tickets en disco. \
                             Revisa permisos y la existencia del directorio.",
                            dir, e
                        );
                        tracing::error!(
                            target: "delivery.registry",
                            "fallback silencioso evitado (H1 cerrado): {}",
                            msg
                        );
                        return Self {
                            backend: Arc::new(NoOpDelivery::new()),
                            kind: DeliveryKind::Noop,
                            init_error: Some(msg),
                            attempted_backend: Some(DeliveryKind::File),
                        };
                    }
                }
            }
        }

        // 3. Fallback por defecto: NoOp. No es un error, es la
        //    opcion normal cuando el operador no ha configurado
        //    hardware (modo demo / tests).
        tracing::info!(
            target: "delivery.registry",
            "auto-detect: ninguna variable de entorno relevante; usando NoOp como fallback"
        );
        Self {
            backend: Arc::new(NoOpDelivery::new()),
            kind: DeliveryKind::Noop,
            init_error: None,
            attempted_backend: None,
        }
    }

    /// Crea el registry forzando un `NoOpDelivery`. Util para tests
    /// donde se quiere aislar la logica de la auto-deteccion.
    pub fn noop() -> Self {
        Self {
            backend: Arc::new(NoOpDelivery::new()),
            kind: DeliveryKind::Noop,
            init_error: None,
            attempted_backend: None,
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
        Self {
            backend,
            kind,
            init_error: None,
            attempted_backend: None,
        }
    }

    /// Acceso al backend activo. La capa de commands usa esto para
    /// delegar; los tests de sustitucion lo usan para verificar
    /// que el backend es el esperado.
    pub fn current(&self) -> &Arc<dyn DeliveryBackend> {
        &self.backend
    }

    /// `kind` del backend activo, cacheado en el registry. Mas
    /// barato que `current().kind()` (evita el dispatch dinamico).
    /// Alias historico; los callers nuevos pueden preferir
    /// `current_kind()` por claridad.
    pub fn kind(&self) -> DeliveryKind {
        self.kind
    }

    /// `kind` del backend activo. Alias explicito de `kind()` para
    /// que el command `get_delivery_status` y la UI tengan un
    /// nombre que se lea bien al lado de `attempted_backend()`.
    pub fn current_kind(&self) -> DeliveryKind {
        self.kind
    }

    /// Mensaje de error si la auto-deteccion fallo al inicializar
    /// el backend solicitado (H1 / TEAM-014). `None` cuando el
    /// backend activo es el que se configuro, o cuando se eligio
    /// NoOp por falta de env vars (caso normal).
    pub fn init_error(&self) -> Option<&str> {
        self.init_error.as_deref()
    }

    /// Backend que se intento usar originalmente antes de un
    /// posible fallback a NoOp. `Some(k)` indica que la
    /// auto-deteccion intento `k` pero fallo (el operador deberia
    /// ver un warning). `None` cuando no hubo intento explicito
    /// (sin env vars) o cuando el intento fue exitoso.
    pub fn attempted_backend(&self) -> Option<DeliveryKind> {
        self.attempted_backend
    }

    /// Lista los dispositivos del backend activo. API expuesta al
    /// frontend via `list_delivery_devices`.
    pub async fn list_devices(&self) -> Result<Vec<String>, DeliveryError> {
        self.backend.list_devices().await
    }

    /// Health check del backend activo. API expuesta al frontend
    /// via `delivery_health_check`.
    ///
    /// **Si `init_error` esta presente**, devuelve ese error en
    /// lugar de delegar al backend. Asi la UI detecta el fallback
    /// silencioso (H1 cerrado) y puede mostrar un warning rojo en
    /// lugar del verde "Impresora OK" engañoso.
    pub async fn health_check(&self) -> Result<(), DeliveryError> {
        if let Some(err) = &self.init_error {
            return Err(DeliveryError::Internal(err.clone()));
        }
        self.backend.health_check().await
    }

    /// Ejecuta la entrega usando el backend activo. API consumida
    /// por `commands::delivery::print_ticket`.
    pub async fn deliver(&self, ticket_id: &str, payload: &[u8]) -> Result<(), DeliveryError> {
        self.backend.deliver(ticket_id, payload).await
    }
}
