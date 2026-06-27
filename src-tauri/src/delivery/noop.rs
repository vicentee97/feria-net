//! `NoOpDelivery`: backend "sin dispositivo fisico".
//!
//! Usos:
//! - **Tests automatizados** (smoke test, pruebas de sustitucion).
//! - **Modo demo / desarrollo** sin hardware conectado.
//!
//! Reglas:
//! - `deliver` siempre devuelve `Ok(())` (entrega exitosa).
//! - `health_check` siempre `Ok(())`.
//! - `list_devices` devuelve un texto fijo que indica el modo.
//!
//! Es la implementacion de **fallback** del `DeliveryRegistry` cuando
//! no hay `FERIANET_PRINTER` ni `FERIANET_TICKETS_DIR` configurados,
//! y la que se usa por defecto si nada se configura.

use async_trait::async_trait;

use crate::delivery::backend::{DeliveryBackend, DeliveryError};
use crate::domain::ticket_delivery_attempt::DeliveryKind;

/// `DeliveryBackend` que no hace nada. Reporta exito siempre.
pub struct NoOpDelivery;

impl NoOpDelivery {
    /// Crea una nueva instancia. El tipo es zero-sized, asi que
    /// clonar es gratis; `Arc<NoOpDelivery>` comparte la misma
    /// "instancia" entre threads sin coste.
    pub fn new() -> Self {
        Self
    }
}

impl Default for NoOpDelivery {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl DeliveryBackend for NoOpDelivery {
    fn kind(&self) -> DeliveryKind {
        DeliveryKind::Noop
    }

    async fn list_devices(&self) -> Result<Vec<String>, DeliveryError> {
        Ok(vec!["NoOp (sin dispositivo fisico)".to_string()])
    }

    async fn health_check(&self) -> Result<(), DeliveryError> {
        Ok(())
    }

    async fn deliver(&self, _ticket_id: &str, _payload: &[u8]) -> Result<(), DeliveryError> {
        // NoOp: la entrega "exitosa" no hace nada. No logueamos
        // nada aqui a proposito: el command que llama ya registra
        // el `TicketDeliveryAttempt` correspondiente.
        Ok(())
    }
}
