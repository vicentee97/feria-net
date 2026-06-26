//! Repositorio de `Attraction`.
//!
//! Soft-delete via `is_active = 0`. Los listados operativos
//! filtran por `is_active = 1`; los informes pueden querer
//! tambien las inactivas.

use rusqlite::{params, Connection, OptionalExtension, Row};
use uuid::Uuid;

use crate::domain::Attraction;
use crate::errors::{AppError, AppResult};

/// Numero maximo de caracteres para `name` (alineado con CHECK de BD).
const MAX_NAME_LEN: usize = 80;

/// Crea una nueva `Attraction`. Valida inputs y traduce errores.
pub fn create_attraction(
    conn: &Connection,
    fair_edition_id: &Uuid,
    name: &str,
    color: &str,
    base_ticket_price_cents: i64,
) -> AppResult<Attraction> {
    validate_name(name)?;
    validate_color(color)?;
    if base_ticket_price_cents < 0 {
        return Err(AppError::InvalidInput(
            "el precio base no puede ser negativo".into(),
        ));
    }

    let id = Uuid::new_v4();
    conn.execute(
        "INSERT INTO attraction \
            (id, fair_edition_id, name, color, base_ticket_price, is_active) \
         VALUES (?1, ?2, ?3, ?4, ?5, 1)",
        params![
            id.to_string(),
            fair_edition_id.to_string(),
            name.trim(),
            color,
            base_ticket_price_cents,
        ],
    )
    .map_err(map_db_err)?;

    Ok(Attraction {
        id,
        fair_edition_id: *fair_edition_id,
        name: name.trim().to_string(),
        color: color.to_string(),
        base_ticket_price: base_ticket_price_cents,
        is_active: true,
    })
}

/// Lista las atracciones activas de una edicion (las que la UI
/// muestra para operar). Orden alfabetico.
pub fn list_attractions_by_edition(
    conn: &Connection,
    fair_edition_id: &Uuid,
) -> AppResult<Vec<Attraction>> {
    let mut stmt = conn.prepare(
        "SELECT id, fair_edition_id, name, color, base_ticket_price, is_active \
         FROM attraction \
         WHERE fair_edition_id = ?1 AND is_active = 1 \
         ORDER BY name COLLATE NOCASE ASC",
    )?;
    let rows = stmt.query_map(params![fair_edition_id.to_string()], row_to_attraction)?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r?);
    }
    Ok(out)
}

/// Devuelve una atraccion por id, o `None`.
pub fn get_attraction(conn: &Connection, id: &Uuid) -> AppResult<Option<Attraction>> {
    let mut stmt = conn.prepare(
        "SELECT id, fair_edition_id, name, color, base_ticket_price, is_active \
         FROM attraction WHERE id = ?1",
    )?;
    let row = stmt
        .query_row(params![id.to_string()], row_to_attraction)
        .optional()?;
    Ok(row)
}

/// Actualiza una `Attraction`. Campos `None` se ignoran.
pub fn update_attraction(
    conn: &Connection,
    id: &Uuid,
    name: Option<&str>,
    color: Option<&str>,
    base_ticket_price_cents: Option<i64>,
) -> AppResult<Attraction> {
    let mut current = get_attraction(conn, id)?
        .ok_or_else(|| AppError::NotFound(format!("no existe la atraccion con id {}", id)))?;

    if let Some(new_name) = name {
        validate_name(new_name)?;
        current.name = new_name.trim().to_string();
    }
    if let Some(new_color) = color {
        validate_color(new_color)?;
        current.color = new_color.to_string();
    }
    if let Some(new_price) = base_ticket_price_cents {
        if new_price < 0 {
            return Err(AppError::InvalidInput(
                "el precio base no puede ser negativo".into(),
            ));
        }
        current.base_ticket_price = new_price;
    }

    conn.execute(
        "UPDATE attraction SET name = ?1, color = ?2, base_ticket_price = ?3 WHERE id = ?4",
        params![current.name, current.color, current.base_ticket_price, id.to_string()],
    )
    .map_err(map_db_err)?;

    Ok(current)
}

/// Soft-delete: marca `is_active = 0` sin borrar la fila.
pub fn soft_delete_attraction(conn: &Connection, id: &Uuid) -> AppResult<()> {
    let changed = conn.execute(
        "UPDATE attraction SET is_active = 0 WHERE id = ?1",
        params![id.to_string()],
    )?;
    if changed == 0 {
        return Err(AppError::NotFound(format!(
            "no existe la atraccion con id {}",
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
            "el nombre de la atraccion no puede estar vacio".into(),
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

fn validate_color(color: &str) -> AppResult<()> {
    // Mismo GLOB que el CHECK de la BD: exactamente #RRGGBB (6 hex).
    if color.len() != 7
        || !color.starts_with('#')
        || !color[1..].chars().all(|c| c.is_ascii_hexdigit())
    {
        return Err(AppError::InvalidInput(
            "el color debe tener formato hex #RRGGBB".into(),
        ));
    }
    Ok(())
}

fn row_to_attraction(row: &Row<'_>) -> rusqlite::Result<Attraction> {
    let id_str: String = row.get("id")?;
    let fe_id_str: String = row.get("fair_edition_id")?;
    let id = Uuid::parse_str(&id_str).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(
            0,
            rusqlite::types::Type::Text,
            Box::new(e),
        )
    })?;
    let fair_edition_id = Uuid::parse_str(&fe_id_str).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(
            1,
            rusqlite::types::Type::Text,
            Box::new(e),
        )
    })?;
    let name: String = row.get("name")?;
    let color: String = row.get("color")?;
    let base_ticket_price: i64 = row.get("base_ticket_price")?;
    let is_active_int: i64 = row.get("is_active")?;
    Ok(Attraction {
        id,
        fair_edition_id,
        name,
        color,
        base_ticket_price,
        is_active: is_active_int != 0,
    })
}

fn map_db_err(e: rusqlite::Error) -> AppError {
    // En rusqlite 0.40, SqliteFailure toma (ffi::Error, Option<String>).
    if let rusqlite::Error::SqliteFailure(err, _) = &e {
        if err.code == rusqlite::ErrorCode::ConstraintViolation {
            return AppError::ConstraintViolation(e.to_string());
        }
    }
    AppError::Database(e)
}
