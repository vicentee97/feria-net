//! Entidad de dominio: `FairEdition` (Edicion anual de feria).
//!
//! Es la unidad desde la que cuelgan atracciones, ofertas, cajas y
//! tickets. Toda comparativa interanual (ver `docs/data-model.md` §4)
//! pasa por aqui. Reglas criticas:
//! - `(fair_id, year)` es UNIQUE.
//! - `end_date >= start_date`.
//! - Solo una edicion por `fair_id` puede tener `status = active` a la vez.

use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Estado operativo de una edicion de feria.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum FairEditionStatus {
    /// Prevista para el futuro. Aun no operativa.
    Planned,
    /// Operativa: hay cajas abiertas o ventas en curso.
    Active,
    /// Cerrada: ya no se venden tickets en esta edicion.
    Closed,
}

impl FairEditionStatus {
    /// Cadena usada en SQLite CHECK constraint.
    pub fn as_str(&self) -> &'static str {
        match self {
            FairEditionStatus::Planned => "planned",
            FairEditionStatus::Active => "active",
            FairEditionStatus::Closed => "closed",
        }
    }

    /// Intenta parsear desde la cadena persistida.
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "planned" => Some(Self::Planned),
            "active" => Some(Self::Active),
            "closed" => Some(Self::Closed),
            _ => None,
        }
    }
}

/// Edicion anual concreta de una feria.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct FairEdition {
    pub id: Uuid,
    pub fair_id: Uuid,
    pub year: i32,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub status: FairEditionStatus,
    pub created_at: DateTime<Utc>,
}
