//! Repositorio de `Fair`.
//!
//! Funciones tipadas sobre `Connection`. Las validaciones de
//! longitud/formato viven en CHECK constraints de la BD; el
//! repositorio traduce errores de SQLite a `AppError` con
//! semantica legible.

use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension, Row};
use uuid::Uuid;

use crate::domain::Fair;
use crate::errors::{AppError, AppResult};

/// Numero maximo de caracteres para `name` (alineado con CHECK de BD).
const MAX_NAME_LEN: usize = 120;
/// Numero maximo de caracteres para `notes` (alineado con CHECK de BD).
const MAX_NOTES_LEN: usize = 500;

/// Crea una nueva `Fair`. Valida longitudes en capa de aplicacion
/// ademas del CHECK de BD (mensajes de error mas claros).
pub fn create_fair(conn: &Connection, name: &str, notes: Option<&str>) -> AppResult<Fair> {
    let name = name.trim();
    if name.is_empty() {
        return Err(AppError::InvalidInput(
            "el nombre de la feria no puede estar vacio".into(),
        ));
    }
    if name.chars().count() > MAX_NAME_LEN {
        return Err(AppError::InvalidInput(format!(
            "el nombre excede {} caracteres",
            MAX_NAME_LEN
        )));
    }
    if let Some(n) = notes {
        if n.chars().count() > MAX_NOTES_LEN {
            return Err(AppError::InvalidInput(format!(
                "las notas exceden {} caracteres",
                MAX_NOTES_LEN
            )));
        }
    }

    let id = Uuid::new_v4();
    let now = Utc::now();
    let notes_owned = notes.map(|s| s.to_string());

    conn.execute(
        "INSERT INTO fair (id, name, created_at, notes) VALUES (?1, ?2, ?3, ?4)",
        params![
            id.to_string(),
            name,
            now.to_rfc3339(),
            notes_owned,
        ],
    )
    .map_err(map_db_err)?;

    Ok(Fair {
        id,
        name: name.to_string(),
        created_at: now,
        notes: notes_owned,
    })
}

/// Lista todas las ferias ordenadas por nombre.
pub fn list_fairs(conn: &Connection) -> AppResult<Vec<Fair>> {
    let mut stmt = conn.prepare("SELECT id, name, created_at, notes FROM fair ORDER BY name COLLATE NOCASE ASC")?;
    let rows = stmt.query_map([], row_to_fair)?;
    let mut fairs = Vec::new();
    for r in rows {
        fairs.push(r?);
    }
    Ok(fairs)
}

/// Devuelve una `Fair` por id, o `None` si no existe.
pub fn get_fair(conn: &Connection, id: &Uuid) -> AppResult<Option<Fair>> {
    let mut stmt = conn.prepare("SELECT id, name, created_at, notes FROM fair WHERE id = ?1")?;
    let row = stmt
        .query_row(params![id.to_string()], row_to_fair)
        .optional()?;
    Ok(row)
}

/// Actualiza una `Fair`. `notes` con doble `Option` distingue:
/// - `None`            -> no tocar `notes`.
/// - `Some(None)`      -> borrar `notes` (poner NULL).
/// - `Some(Some(s))`   -> actualizar a `s`.
pub fn update_fair(
    conn: &Connection,
    id: &Uuid,
    name: Option<&str>,
    notes: Option<Option<&str>>,
) -> AppResult<Fair> {
    let mut current = get_fair(conn, id)?.ok_or_else(|| {
        AppError::NotFound(format!("no existe la feria con id {}", id))
    })?;

    if let Some(new_name) = name {
        let trimmed = new_name.trim();
        if trimmed.is_empty() {
            return Err(AppError::InvalidInput(
                "el nombre no puede estar vacio".into(),
            ));
        }
        if trimmed.chars().count() > MAX_NAME_LEN {
            return Err(AppError::InvalidInput(format!(
                "el nombre excede {} caracteres",
                MAX_NAME_LEN
            )));
        }
        current.name = trimmed.to_string();
    }

    if let Some(new_notes) = notes {
        if let Some(s) = new_notes {
            if s.chars().count() > MAX_NOTES_LEN {
                return Err(AppError::InvalidInput(format!(
                    "las notas exceden {} caracteres",
                    MAX_NOTES_LEN
                )));
            }
        }
        current.notes = new_notes.map(|s| s.to_string());
    }

    conn.execute(
        "UPDATE fair SET name = ?1, notes = ?2 WHERE id = ?3",
        params![current.name, current.notes, id.to_string()],
    )
    .map_err(map_db_err)?;

    Ok(current)
}

/// Elimina una `Fair`. Falla con `ConstraintViolation` si tiene
/// ediciones asociadas (ON DELETE RESTRICT).
pub fn delete_fair(conn: &Connection, id: &Uuid) -> AppResult<()> {
    let changed = conn.execute(
        "DELETE FROM fair WHERE id = ?1",
        params![id.to_string()],
    )?;
    if changed == 0 {
        return Err(AppError::NotFound(format!(
            "no existe la feria con id {}",
            id
        )));
    }
    Ok(())
}

/// Sugiere una `Fair` existente con nombre equivalente al dado.
///
/// Matching: `LOWER(TRIM(name)) = LOWER(TRIM(input))`.
/// Devuelve `None` si no hay candidata. La comparativa interanual
/// se resuelve asi: el operador confirma si cuelga de una `Fair`
/// existente o crea una nueva.
pub fn suggest_fair_by_name(conn: &Connection, name: &str) -> AppResult<Option<Fair>> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Ok(None);
    }
    let mut stmt = conn.prepare(
        "SELECT id, name, created_at, notes FROM fair \
         WHERE LOWER(TRIM(name)) = LOWER(TRIM(?1)) \
         ORDER BY created_at ASC LIMIT 1",
    )?;
    let row = stmt
        .query_row(params![trimmed], row_to_fair)
        .optional()?;
    Ok(row)
}

// ============================================================
// Helpers internos
// ============================================================

fn row_to_fair(row: &Row<'_>) -> rusqlite::Result<Fair> {
    let id_str: String = row.get("id")?;
    let created_at_str: String = row.get("created_at")?;
    let id = Uuid::parse_str(&id_str).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(
            0,
            rusqlite::types::Type::Text,
            Box::new(e),
        )
    })?;
    let created_at = chrono::DateTime::parse_from_rfc3339(&created_at_str)
        .map_err(|e| {
            rusqlite::Error::FromSqlConversionFailure(
                1,
                rusqlite::types::Type::Text,
                Box::new(e),
            )
        })?
        .with_timezone(&Utc);
    let notes: Option<String> = row.get("notes")?;
    let name: String = row.get("name")?;
    Ok(Fair {
        id,
        name,
        created_at,
        notes,
    })
}

/// Traduce errores de rusqlite a AppError con semantica util.
fn map_db_err(e: rusqlite::Error) -> AppError {
    // En rusqlite 0.40, SqliteFailure toma (ffi::Error, Option<String>).
    // Solo nos interesa el codigo (primer campo) para clasificar.
    if let rusqlite::Error::SqliteFailure(err, _) = &e {
        // 19 = SQLITE_CONSTRAINT.
        if err.code == rusqlite::ErrorCode::ConstraintViolation {
            return AppError::ConstraintViolation(e.to_string());
        }
    }
    AppError::Database(e)
}
