//! Repositorio de `Offer` (Oferta / bundle).
//!
//! Una oferta aplica un precio especial a un bundle de N tickets.
//! Vive dentro de una `FairEdition` y es opcional.
//! Ver `docs/data-model.md` §2.4.
//!
//! Reglas (enforced en backend por V003):
//! - `bundle_quantity >= 1`.
//! - `bundle_price_cents >= 0`.
//! - `is_active` es soft-delete (1 = activa, 0 = borrada logica).

use rusqlite::{params, Connection, OptionalExtension, Row};
use uuid::Uuid;

use crate::domain::Offer;
use crate::errors::{AppError, AppResult};

/// Limite de caracteres del nombre (alineado con CHECK de BD).
const MAX_NAME_LEN: usize = 80;

// ============================================================
// Operaciones CRUD
// ============================================================

/// Crea una nueva `Offer` en una edicion de feria. Falla con
/// `NotFound` si la edicion no existe y con `InvalidInput` si los
/// datos no cumplen las validaciones.
pub fn create_offer(
    conn: &Connection,
    fair_edition_id: &Uuid,
    name: &str,
    bundle_quantity: u32,
    bundle_price_cents: i64,
) -> AppResult<Offer> {
    validate_name(name)?;
    if bundle_quantity < 1 {
        return Err(AppError::InvalidInput(
            "la cantidad del bundle debe ser >= 1".into(),
        ));
    }
    if bundle_price_cents < 0 {
        return Err(AppError::InvalidInput(
            "el precio del bundle no puede ser negativo".into(),
        ));
    }
    if !fair_edition_exists(conn, fair_edition_id)? {
        return Err(AppError::NotFound(format!(
            "no existe la edición de feria con id {}",
            fair_edition_id
        )));
    }

    let id = Uuid::new_v4();
    conn.execute(
        "INSERT INTO offer \
            (id, fair_edition_id, name, bundle_quantity, bundle_price_cents, is_active) \
         VALUES (?1, ?2, ?3, ?4, ?5, 1)",
        params![
            id.to_string(),
            fair_edition_id.to_string(),
            name.trim(),
            bundle_quantity,
            bundle_price_cents,
        ],
    )
    .map_err(map_db_err)?;

    Ok(Offer {
        id,
        fair_edition_id: *fair_edition_id,
        name: name.trim().to_string(),
        bundle_quantity,
        bundle_price_cents,
        is_active: true,
    })
}

/// Lista las ofertas de una edicion. Si `include_inactive` es `false`
/// (default operativo), filtra `is_active = 1`.
pub fn list_offers_by_edition(
    conn: &Connection,
    fair_edition_id: &Uuid,
    include_inactive: bool,
) -> AppResult<Vec<Offer>> {
    let sql = if include_inactive {
        "SELECT id, fair_edition_id, name, bundle_quantity, bundle_price_cents, is_active \
         FROM offer WHERE fair_edition_id = ?1 \
         ORDER BY name COLLATE NOCASE ASC"
    } else {
        "SELECT id, fair_edition_id, name, bundle_quantity, bundle_price_cents, is_active \
         FROM offer WHERE fair_edition_id = ?1 AND is_active = 1 \
         ORDER BY name COLLATE NOCASE ASC"
    };
    let mut stmt = conn.prepare(sql)?;
    let rows = stmt.query_map(params![fair_edition_id.to_string()], row_to_offer)?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r?);
    }
    Ok(out)
}

/// Devuelve una `Offer` por id, o `None` si no existe.
pub fn get_offer(conn: &Connection, id: &Uuid) -> AppResult<Option<Offer>> {
    let mut stmt = conn.prepare(
        "SELECT id, fair_edition_id, name, bundle_quantity, bundle_price_cents, is_active \
         FROM offer WHERE id = ?1",
    )?;
    let row = stmt
        .query_row(params![id.to_string()], row_to_offer)
        .optional()?;
    Ok(row)
}

/// Actualiza una `Offer`. Campos `None` no se tocan. Si se reactiva
/// (`is_active` a `true`) se permite; si se desactiva, se considera
/// soft-delete.
pub fn update_offer(
    conn: &Connection,
    id: &Uuid,
    name: Option<&str>,
    bundle_quantity: Option<u32>,
    bundle_price_cents: Option<i64>,
) -> AppResult<Offer> {
    let mut current = get_offer(conn, id)?
        .ok_or_else(|| AppError::NotFound(format!("no existe la oferta con id {}", id)))?;

    if let Some(new_name) = name {
        validate_name(new_name)?;
        current.name = new_name.trim().to_string();
    }
    if let Some(q) = bundle_quantity {
        if q < 1 {
            return Err(AppError::InvalidInput(
                "la cantidad del bundle debe ser >= 1".into(),
            ));
        }
        current.bundle_quantity = q;
    }
    if let Some(p) = bundle_price_cents {
        if p < 0 {
            return Err(AppError::InvalidInput(
                "el precio del bundle no puede ser negativo".into(),
            ));
        }
        current.bundle_price_cents = p;
    }

    conn.execute(
        "UPDATE offer SET name = ?1, bundle_quantity = ?2, bundle_price_cents = ?3 \
         WHERE id = ?4",
        params![
            current.name,
            current.bundle_quantity,
            current.bundle_price_cents,
            id.to_string(),
        ],
    )
    .map_err(map_db_err)?;

    Ok(current)
}

/// Soft-delete: marca `is_active = 0` sin borrar la fila. Mantiene
/// trazabilidad historica para informes y ventas pasadas que
/// aplicaron esta oferta.
pub fn soft_delete_offer(conn: &Connection, id: &Uuid) -> AppResult<()> {
    let changed = conn.execute(
        "UPDATE offer SET is_active = 0 WHERE id = ?1",
        params![id.to_string()],
    )?;
    if changed == 0 {
        return Err(AppError::NotFound(format!(
            "no existe la oferta con id {}",
            id
        )));
    }
    Ok(())
}

// ============================================================
// Helpers internos
// ============================================================

fn validate_name(name: &str) -> AppResult<()> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err(AppError::InvalidInput(
            "el nombre de la oferta no puede estar vacío".into(),
        ));
    }
    if trimmed.chars().count() > MAX_NAME_LEN {
        return Err(AppError::InvalidInput(format!(
            "el nombre excede {} caracteres",
            MAX_NAME_LEN
        )));
    }
    Ok(())
}

fn fair_edition_exists(conn: &Connection, fair_edition_id: &Uuid) -> AppResult<bool> {
    let n: i64 = conn.query_row(
        "SELECT COUNT(*) FROM fair_edition WHERE id = ?1",
        params![fair_edition_id.to_string()],
        |r| r.get(0),
    )?;
    Ok(n > 0)
}

fn row_to_offer(row: &Row<'_>) -> rusqlite::Result<Offer> {
    let id_str: String = row.get("id")?;
    let fe_id_str: String = row.get("fair_edition_id")?;
    let id = Uuid::parse_str(&id_str).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e))
    })?;
    let fair_edition_id = Uuid::parse_str(&fe_id_str).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(1, rusqlite::types::Type::Text, Box::new(e))
    })?;
    let name: String = row.get("name")?;
    let bundle_quantity: i64 = row.get("bundle_quantity")?;
    let bundle_price_cents: i64 = row.get("bundle_price_cents")?;
    let is_active_int: i64 = row.get("is_active")?;
    Ok(Offer {
        id,
        fair_edition_id,
        name,
        bundle_quantity: bundle_quantity as u32,
        bundle_price_cents,
        is_active: is_active_int != 0,
    })
}

fn map_db_err(e: rusqlite::Error) -> AppError {
    if let rusqlite::Error::SqliteFailure(err, _) = &e {
        if err.code == rusqlite::ErrorCode::ConstraintViolation {
            return AppError::ConstraintViolation(e.to_string());
        }
    }
    AppError::Database(e)
}