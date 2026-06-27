//! Entidad de dominio: `Ticket` (Ticket emitido).
//!
//! Representacion logica de UN ticket fisico. Una `SaleLine` con
//! `quantity = N` genera N filas en `ticket` (una por ticket fisico).
//! Cada fila tiene `quantity = 1` por defecto; el `total_cents`
//! por fila es simplemente `unit_price_cents`.
//!
//! Ver `docs/data-model.md` §2.8.
//!
//! Decisiones de esta migracion (V003, epica 2):
//! - Se denormalizan `cash_session_id`, `fair_edition_id` y
//!   `attraction_id` para que informes y sync lean de una sola
//!   tabla sin joins profundos (data-model §2.8 nota).
//! - NO se incluyen `delivery_status`, `delivery_attempts` ni
//!   `last_delivery_error` todavia. La epica 3 los anade por una
//!   migracion V00X con `ALTER TABLE ADD COLUMN` (sin migracion
//!   destructiva). El `ticket-delivery` consulta los tickets creados
//!   en V003 y registra intentos en `ticket_delivery_attempt`
//!   (que SI se crea en V003 con el contrato completo de data-model
//!   §2.9, listo para la epica 3).
//!
//! Reglas (enforced en backend por V003):
//! - `quantity >= 1`.
//! - `unit_price_cents >= 0`, `total_cents >= 0`.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Ticket fisico emitido. Importes en centimos.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Ticket {
    pub id: Uuid,
    pub sale_id: Uuid,
    pub sale_line_id: Uuid,
    /// Denormalizado: caja de origen (data-model §2.8).
    pub cash_session_id: Uuid,
    /// Denormalizado: edicion de la feria (data-model §2.8).
    pub fair_edition_id: Uuid,
    /// Denormalizado: atraccion (data-model §2.8).
    pub attraction_id: Uuid,
    pub created_at: DateTime<Utc>,
    /// Tickets representados por esta fila. Por defecto 1
    /// (una fila = un ticket fisico).
    pub quantity: u32,
    pub unit_price_cents: i64,
    pub total_cents: i64,
}