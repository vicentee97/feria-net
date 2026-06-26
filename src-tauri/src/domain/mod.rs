//! Tipos de dominio.
//!
//! Cada modulo contiene las entidades puras del modelo, sin
//! dependencias de Tauri ni de rusqlite. Solo `serde` + tipos
//! estandar + tipos del propio dominio (`uuid`, `chrono`).

pub mod attraction;
pub mod fair;
pub mod fair_edition;

pub use attraction::Attraction;
pub use fair::Fair;
pub use fair_edition::{FairEdition, FairEditionStatus};
