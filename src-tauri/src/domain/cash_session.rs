//! Entidad de dominio: `CashSession` (Caja diaria).
//!
//! Caja diaria de una atraccion en una fecha concreta. Es la unidad
//! operativa del TPV: las ventas cuelgan de aqui.
//! Ver `docs/data-model.md` §2.5 y §5.1, §5.2.
//!
//! Reglas criticas (enforced en backend por V003):
//! - `UNIQUE (attraction_id, date)`: una sola caja por atraccion y dia.
//! - Indice UNIQUE parcial `WHERE closed_at IS NULL`: una sola caja
//!   abierta por atraccion simultaneamente.
//! - `closed_at >= opened_at`.
//! - `total_amount` se calcula al cerrar y se congela (inmutable).

use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Estado operativo derivado de `closed_at`. La fuente de verdad
/// es la columna `closed_at` en SQLite; este enum es solo una
/// proyeccion tipada para la UI.
///
/// API publico: lo consume la UI en la pantalla de caja. Aun no se
/// usa dentro de los commands (la UI se calcula su propio booleano
/// desde `closed_at`), pero se mantiene en el dominio como tipo
/// canonico para no inventar variantes en frontend.
#[allow(dead_code)]
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum CashSessionStatus {
    /// Caja abierta (`closed_at IS NULL`).
    Open,
    /// Caja cerrada (`closed_at IS NOT NULL`).
    Closed,
}

#[allow(dead_code)]
impl CashSessionStatus {
    /// Construye el estado a partir de `closed_at`.
    pub fn from_closed_at(closed_at: Option<DateTime<Utc>>) -> Self {
        if closed_at.is_some() {
            CashSessionStatus::Closed
        } else {
            CashSessionStatus::Open
        }
    }
}

/// Caja diaria de una atraccion en una fecha local del operador.
///
/// Los importes estan en **centimos** (INTEGER) para evitar errores
/// de coma flotante; la conversion a euros ocurre en la capa de
/// presentacion.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct CashSession {
    pub id: Uuid,
    pub attraction_id: Uuid,
    /// Fecha local del operador (`YYYY-MM-DD`).
    pub date: NaiveDate,
    /// Momento exacto de apertura (UTC).
    pub opened_at: DateTime<Utc>,
    /// Momento exacto de cierre (UTC). `None` mientras la caja esta abierta.
    pub closed_at: Option<DateTime<Utc>>,
    /// Fondo inicial de la caja en centimos.
    pub opening_amount_cents: i64,
    /// Importe declarado al cierre en centimos. `None` mientras abierta.
    pub closing_amount_cents: Option<i64>,
    /// Suma de ventas registradas, congelada al cerrar.
    /// `None` mientras la caja esta abierta.
    pub total_amount_cents: Option<i64>,
}

#[allow(dead_code)] // API publico: usado por UI en pantalla de caja.
impl CashSession {
    /// Estado operativo derivado.
    pub fn status(&self) -> CashSessionStatus {
        CashSessionStatus::from_closed_at(self.closed_at)
    }

    /// `true` si la caja sigue abierta.
    pub fn is_open(&self) -> bool {
        self.closed_at.is_none()
    }
}