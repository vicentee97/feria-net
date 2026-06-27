//! Entidad de dominio: `Offer` (Oferta / bundle).
//!
//! Bundle con precio especial (`N` tickets por un precio fijo).
//! Vive dentro de una `FairEdition`. Una venta puede aplicar
//! **como maximo una** oferta (data-model §2.4).
//!
//! Reglas (enforced en backend por V003):
//! - `bundle_quantity >= 1`.
//! - `bundle_price_cents >= 0`.
//! - `is_active` es soft-delete.

use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Oferta / bundle. Precio total del bundle en **centimos**.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Offer {
    pub id: Uuid,
    pub fair_edition_id: Uuid,
    pub name: String,
    /// Numero de tickets del bundle. >= 1.
    pub bundle_quantity: u32,
    /// Precio total del bundle en centimos. >= 0.
    pub bundle_price_cents: i64,
    /// Soft-delete. `false` significa borrado logico.
    pub is_active: bool,
}