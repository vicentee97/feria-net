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

/// Enforce de "una sola edicion active por feria" (V002, R1).
///
/// Indice UNIQUE parcial sobre `fair_edition(fair_id) WHERE status =
/// 'active'` (ver `docs/data-model.md` §5.10). Atomicidad declarativa:
/// un intento de activar dos ediciones de la misma feria falla a
/// nivel de SQLite sin posibilidad de inconsistencia.
pub const V002__ONE_ACTIVE_EDITION_PER_FAIR_SQL: &str =
    include_str!("V002__one_active_edition_per_fair.sql");

/// Lista de migraciones que `rusqlite_migration` aplicara en orden.
///
/// El orden importa: rusqlite_migration usa `PRAGMA user_version`
/// para llevar el control; si una migracion falla, las siguientes
/// no se aplican y la BD queda en el ultimo estado bueno.
///
/// La libreria identifica la version por la posicion en el array
/// (V001 -> user_version=1, V002 -> user_version=2). Solo `up` en v1:
/// el rollback es futuro (post-MVP) y la SSOT no obliga a soportarlo.
pub static MIGRATIONS: &[&str] = &[
    V001__INIT_SQL,
    V002__ONE_ACTIVE_EDITION_PER_FAIR_SQL,
];
