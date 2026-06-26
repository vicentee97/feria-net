//! Entidad de dominio: `Fair` (Feria generica, sin año).
//!
//! Una `Fair` agrupa todas las ediciones anuales de una misma feria
//! (ver `docs/data-model.md` §2.1 y §4). La identificación de
//! "misma feria en distintos años" es asistida (no automatica): la
//! UI sugiere `Fair` existentes con el mismo nombre al crear una
//! nueva edicion, y el operador confirma.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Feria generica (sin año). Una feria con N ediciones anuales se
/// modela como una sola `Fair` con N `FairEdition` apuntando a ella.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Fair {
    pub id: Uuid,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub notes: Option<String>,
}
