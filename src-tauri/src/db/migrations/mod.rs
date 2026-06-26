//! Migraciones versionadas de la base de datos local.
//!
//! Los archivos SQL viven en `db/migrations/` y se embeben en el
//! binario con `include_str!` para que las migraciones viajen con
//! la aplicacion (sin dependencia de rutas en disco en runtime).

/// Esquema inicial (V001).
///
/// Mapea 1:1 con `docs/data-model.md` §2.1, §2.2, §2.3.
/// Incluye solo `Fair`, `FairEdition` y `Attraction` (epica 1).
/// Las entidades de venta (CashSession, Sale, Ticket) entran en
/// migraciones posteriores.
pub const V001__INIT_SQL: &str = include_str!("V001__init.sql");

/// Lista de migraciones que `rusqlite_migration` aplicara en orden.
///
/// El orden importa: rusqlite_migration usa `PRAGMA user_version`
/// para llevar el control; si una migracion falla, las siguientes
/// no se aplican y la BD queda en el ultimo estado bueno.
pub static MIGRATIONS: &[&str] = &[V001__INIT_SQL];
