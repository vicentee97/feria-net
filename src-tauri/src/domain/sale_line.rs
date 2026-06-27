//! Entidad de dominio: `SaleLine` (Linea de venta).
//!
//! Cantidad de tickets vendidos a un precio unitario concreto.
//! Ver `docs/data-model.md` §2.7.
//!
//! Modelo aplicado (decidido en diseno de V003 + repo `sales.rs`):
//! - **Sin oferta**: `line_total_cents = quantity * unit_price_cents`.
//! - **Con oferta**: la linea unica tiene `unit_price_cents = 0` y
//!   `quantity = offer.bundle_quantity`; el cobro vive en
//!   `sale.total_amount_cents = offer.bundle_price_cents`.
//!
//! Esto simplifica reglas: el cobro SIEMPRE esta en
//! `sale.total_amount_cents`; las lineas describen QUE se entrego
//! (los tickets fisicos), no el cobro.

use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Linea de venta. Todos los importes en centimos.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SaleLine {
    pub id: Uuid,
    pub sale_id: Uuid,
    /// Numero de tickets. >= 1.
    pub quantity: u32,
    /// Precio por ticket en esta linea. >= 0.
    pub unit_price_cents: i64,
    /// `quantity * unit_price_cents` (puede ser 0 si la venta usa oferta).
    pub line_total_cents: i64,
}