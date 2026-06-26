//! Entidad de dominio: `Attraction` (Atraccion por edicion).
//!
//! Una atraccion solo existe dentro de una `FairEdition` concreta
//! (no hay atracciones globales). Esto permite que el precio base,
//! el color y la configuracion varíen entre años.
//!
//! El borrado es **soft-delete** via `is_active = false`, para
//! preservar el historico de ventas e informes cuando una atraccion
//! deja de operar.
//!
//! Reglas:
//! - `name` <= 80 caracteres (CHECK en BD).
//! - `color` en formato hex `#RRGGBB` (CHECK con regex GLOB en BD).
//! - `base_ticket_price` se almacena en **centimos** (INTEGER) para
//!   evitar errores de coma flotante. La conversion a euros ocurre
//!   en la capa de presentacion.

use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Atraccion por edicion de feria.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Attraction {
    pub id: Uuid,
    pub fair_edition_id: Uuid,
    pub name: String,
    /// Color identificativo en hex `#RRGGBB`.
    pub color: String,
    /// Precio base del ticket en **centimos** (ej. 250 = 2,50 €).
    pub base_ticket_price: i64,
    /// Soft-delete. `false` significa borrado logico.
    pub is_active: bool,
}
