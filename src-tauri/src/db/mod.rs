//! Capa de persistencia local (SQLite + rusqlite).
//!
//! Composicion:
//! - `pool`: apertura de la BD, configuracion de PRAGMAs y
//!   aplicacion de migraciones.
//! - `migrations`: archivos SQL embebidos versionados.
//! - `repository`: funciones tipadas por entidad (Fair, Attraction).

pub mod migrations;
pub mod pool;
pub mod repository;

pub use pool::DbPool;
