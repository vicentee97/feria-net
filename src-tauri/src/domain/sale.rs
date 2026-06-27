//! Entidad de dominio: `Sale` (Venta).
//!
//! Una transaccion de venta dentro de una caja. Contiene una o varias
//! `SaleLine`. Si tiene `offer_id`, el total es el del bundle
//! (no la suma de lineas).
//! Ver `docs/data-model.md` §2.6.
//!
//! Reglas (enforced en backend por V003):
//! - `total_amount_cents >= 0`.
//! - `total_amount_cents` se calcula al crear la venta y se
//!   congela: no se modifica despues.
//! - Una venta nunca se elimina en v1 (correccion via
//!   `CashAdjustment`, fuera del MVP).

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Venta. `total_amount_cents` esta en centimos.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Sale {
    pub id: Uuid,
    pub cash_session_id: Uuid,
    /// `None` si la venta no aplica ninguna oferta.
    pub offer_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub total_amount_cents: i64,
}