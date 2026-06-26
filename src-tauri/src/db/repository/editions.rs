//! Repositorio de `FairEdition` (Edicion anual de feria).
//!
//! Es la unidad desde la que cuelgan atracciones, ofertas, cajas
//! y tickets (ver `docs/data-model.md` §2.2). Reglas criticas:
//! - `(fair_id, year)` es UNIQUE.
//! - `end_date >= start_date`.
//! - Solo una edicion por `fair_id` puede tener `status = active`
//!   a la vez (regla §5.10). **Enforced en backend** desde V002
//!   mediante un indice UNIQUE parcial (TEAM-007 cierra R1).
//!
//! Validaciones de aplicacion:
//! - `year BETWEEN 1900 AND 2100`.
//! - `start_date` y `end_date` con formato ISO 8601 `YYYY-MM-DD`.
//! - `end_date >= start_date`.
//! - `fair_id` debe existir en `fair`.
//!
//! La traduccion de errores de SQLite distingue:
//! - `UNIQUE constraint failed` por el indice parcial V002 (R1)
//!   -> `AppError::UniqueViolation` con el mensaje canonico sobre
//!   conflicto de edicion activa.
//! - `UNIQUE constraint failed` (en `fair_edition.fair_id` / `.year`)
//!   -> `AppError::UniqueViolation` con el año concreto que se intento.
//! - `FOREIGN KEY constraint failed` (al borrar con atracciones)
//!   -> `AppError::ConstraintViolation` con mensaje claro.
//! - Cualquier otra `ConstraintViolation` -> `AppError::ConstraintViolation`.

use chrono::{NaiveDate, Utc};
use rusqlite::{params, Connection, OptionalExtension, Row};
use uuid::Uuid;

use crate::domain::{FairEdition, FairEditionStatus};
use crate::errors::{AppError, AppResult};

/// Rango valido para `year` (alineado con CHECK de BD).
const MIN_YEAR: i32 = 1900;
const MAX_YEAR: i32 = 2100;

/// Formato canonico para fechas locales del operador.
const DATE_FORMAT: &str = "%Y-%m-%d";

// ============================================================
// Operaciones CRUD
// ============================================================

/// Crea una nueva `FairEdition` validando rango de año, formato
/// ISO 8601 de fechas, orden cronologico y existencia del `fair_id`.
///
/// Devuelve la fila creada (reconstruida en memoria desde los inputs
/// validados; no se reconsulta la BD para evitar una lectura extra).
pub fn create_edition(
    conn: &Connection,
    fair_id: &Uuid,
    year: i32,
    start_date: &str,
    end_date: &str,
    status: FairEditionStatus,
) -> AppResult<FairEdition> {
    if !(MIN_YEAR..=MAX_YEAR).contains(&year) {
        return Err(AppError::InvalidInput(format!(
            "el año debe estar entre {} y {}",
            MIN_YEAR, MAX_YEAR
        )));
    }
    let start = parse_iso_date(start_date)?;
    let end = parse_iso_date(end_date)?;
    if end < start {
        return Err(AppError::InvalidInput(
            "end_date no puede ser anterior a start_date".into(),
        ));
    }
    if !fair_exists(conn, fair_id)? {
        return Err(AppError::NotFound(format!(
            "no existe la feria con id {}",
            fair_id
        )));
    }

    let id = Uuid::new_v4();
    let now = Utc::now();

    let attempted_year = year;
    conn.execute(
        "INSERT INTO fair_edition \
            (id, fair_id, year, start_date, end_date, status, created_at) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            id.to_string(),
            fair_id.to_string(),
            year,
            start_date,
            end_date,
            status.as_str(),
            now.to_rfc3339(),
        ],
    )
    .map_err(|e| classify_db_err(e, Some(attempted_year)))?;

    Ok(FairEdition {
        id,
        fair_id: *fair_id,
        year,
        start_date: start,
        end_date: end,
        status,
        created_at: now,
    })
}

/// Lista las ediciones de una feria, ordenadas por año descendente
/// (mas reciente primero).
pub fn list_editions_by_fair(
    conn: &Connection,
    fair_id: &Uuid,
) -> AppResult<Vec<FairEdition>> {
    let mut stmt = conn.prepare(
        "SELECT id, fair_id, year, start_date, end_date, status, created_at \
         FROM fair_edition WHERE fair_id = ?1 ORDER BY year DESC",
    )?;
    let rows = stmt.query_map(params![fair_id.to_string()], row_to_edition)?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r?);
    }
    Ok(out)
}

/// Devuelve una `FairEdition` por id, o `None` si no existe.
pub fn get_edition(conn: &Connection, id: &Uuid) -> AppResult<Option<FairEdition>> {
    let mut stmt = conn.prepare(
        "SELECT id, fair_id, year, start_date, end_date, status, created_at \
         FROM fair_edition WHERE id = ?1",
    )?;
    let row = stmt
        .query_row(params![id.to_string()], row_to_edition)
        .optional()?;
    Ok(row)
}

/// Actualiza una `FairEdition`. `None` en un campo = no tocar.
/// Si se pasa `year`, se revalida la unicidad `(fair_id, year)` y
/// se devuelve `UniqueViolation` con el año concreto si choca.
/// Si se pasa `start_date` o `end_date`, se revalidan formato y
/// orden comparando contra el valor actual si el otro campo no
/// se esta actualizando.
///
/// `fair_id` no es actualizable: la edicion queda ligada a la
/// feria bajo la que fue creada para preservar la trazabilidad
/// de las atracciones que cuelgan de ella.
pub fn update_edition(
    conn: &Connection,
    id: &Uuid,
    year: Option<i32>,
    start_date: Option<&str>,
    end_date: Option<&str>,
    status: Option<FairEditionStatus>,
) -> AppResult<FairEdition> {
    let mut current =
        get_edition(conn, id)?.ok_or_else(|| {
            AppError::NotFound(format!("no existe la edición con id {}", id))
        })?;

    // Validar year antes de tocar nada.
    if let Some(new_year) = year {
        if !(MIN_YEAR..=MAX_YEAR).contains(&new_year) {
            return Err(AppError::InvalidInput(format!(
                "el año debe estar entre {} y {}",
                MIN_YEAR, MAX_YEAR
            )));
        }
        current.year = new_year;
    }

    // Parsear fechas nuevas (si llegan) ANTES de validar orden.
    let new_start = match start_date {
        Some(s) => Some(parse_iso_date(s)?),
        None => None,
    };
    let new_end = match end_date {
        Some(e) => Some(parse_iso_date(e)?),
        None => None,
    };

    // Orden efectivo: el nuevo si llega, si no el actual.
    let effective_start = new_start.unwrap_or(current.start_date);
    let effective_end = new_end.unwrap_or(current.end_date);
    if effective_end < effective_start {
        return Err(AppError::InvalidInput(
            "end_date no puede ser anterior a start_date".into(),
        ));
    }

    if let Some(s) = new_start {
        current.start_date = s;
    }
    if let Some(e) = new_end {
        current.end_date = e;
    }
    if let Some(s) = status {
        current.status = s;
    }

    // Para el mensaje de unicidad usamos el year final que se intenta persistir.
    let attempted_year = current.year;
    let start_str = current.start_date.format(DATE_FORMAT).to_string();
    let end_str = current.end_date.format(DATE_FORMAT).to_string();
    conn.execute(
        "UPDATE fair_edition SET year = ?1, start_date = ?2, end_date = ?3, status = ?4 \
         WHERE id = ?5",
        params![
            current.year,
            start_str,
            end_str,
            current.status.as_str(),
            id.to_string(),
        ],
    )
    .map_err(|e| classify_db_err(e, Some(attempted_year)))?;

    Ok(current)
}

/// Elimina una `FairEdition`. Falla con `ConstraintViolation` si
/// tiene atracciones asociadas (`ON DELETE RESTRICT` en FK de
/// `attraction.fair_edition_id`).
pub fn delete_edition(conn: &Connection, id: &Uuid) -> AppResult<()> {
    conn.execute(
        "DELETE FROM fair_edition WHERE id = ?1",
        params![id.to_string()],
    )
    .map_err(|e| classify_db_err(e, None))?;
    Ok(())
}

/// Atajo para cambiar solo el estado de una edicion
/// (`planned -> active -> closed`).
pub fn change_edition_status(
    conn: &Connection,
    id: &Uuid,
    status: FairEditionStatus,
) -> AppResult<FairEdition> {
    update_edition(conn, id, None, None, None, Some(status))
}

// ============================================================
// Helpers internos
// ============================================================

/// Parsea una fecha ISO 8601 `YYYY-MM-DD` desde la entrada del
/// frontend. Devuelve `InvalidInput` con mensaje util si falla.
fn parse_iso_date(s: &str) -> AppResult<NaiveDate> {
    NaiveDate::parse_from_str(s, DATE_FORMAT).map_err(|_| {
        AppError::InvalidInput(format!(
            "fecha inválida '{}', se esperaba YYYY-MM-DD",
            s
        ))
    })
}

/// Comprueba si existe la `Fair` referenciada. Usado en alta
/// para fallar rapido con un mensaje claro antes de que SQLite
/// emita su propio error de FK.
fn fair_exists(conn: &Connection, fair_id: &Uuid) -> AppResult<bool> {
    let n: i64 = conn.query_row(
        "SELECT COUNT(*) FROM fair WHERE id = ?1",
        params![fair_id.to_string()],
        |r| r.get(0),
    )?;
    Ok(n > 0)
}

fn row_to_edition(row: &Row<'_>) -> rusqlite::Result<FairEdition> {
    let id_str: String = row.get("id")?;
    let fair_id_str: String = row.get("fair_id")?;
    let year: i32 = row.get("year")?;
    let start_date_str: String = row.get("start_date")?;
    let end_date_str: String = row.get("end_date")?;
    let status_str: String = row.get("status")?;
    let created_at_str: String = row.get("created_at")?;

    let id = Uuid::parse_str(&id_str).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(
            0,
            rusqlite::types::Type::Text,
            Box::new(e),
        )
    })?;
    let fair_id = Uuid::parse_str(&fair_id_str).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(
            1,
            rusqlite::types::Type::Text,
            Box::new(e),
        )
    })?;
    let start_date = NaiveDate::parse_from_str(&start_date_str, DATE_FORMAT).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(
            2,
            rusqlite::types::Type::Text,
            Box::new(e),
        )
    })?;
    let end_date = NaiveDate::parse_from_str(&end_date_str, DATE_FORMAT).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(
            3,
            rusqlite::types::Type::Text,
            Box::new(e),
        )
    })?;
    let status = FairEditionStatus::from_str(&status_str).ok_or_else(|| {
        rusqlite::Error::FromSqlConversionFailure(
            4,
            rusqlite::types::Type::Text,
            Box::from(format!("status desconocido en BD: {}", status_str)),
        )
    })?;
    let created_at = chrono::DateTime::parse_from_rfc3339(&created_at_str)
        .map_err(|e| {
            rusqlite::Error::FromSqlConversionFailure(
                5,
                rusqlite::types::Type::Text,
                Box::new(e),
            )
        })?
        .with_timezone(&Utc);

    Ok(FairEdition {
        id,
        fair_id,
        year,
        start_date,
        end_date,
        status,
        created_at,
    })
}

/// Mensaje que el usuario ve cuando intenta dejar dos ediciones
/// `active` en la misma feria (R1, V002). Coherente con el texto
/// del `ActivateEditionDialog` pero en forma imperativa, ya que
/// llega cuando el dialog no estaba presente (p. ej. `create_fair_edition`
/// directo, `update_edition` cambiando status, o un cliente externo).
const ACTIVE_EDITION_CONFLICT_MSG: &str = "Ya existe una edición activa para esta feria. \
     Cierra la edición activa actual antes de activar otra.";

/// Traduce errores de SQLite a `AppError` con la semantica que
/// la UI necesita.
///
/// - `UNIQUE constraint failed` por el indice parcial
///   `idx_fair_edition_one_active_per_fair` => `UniqueViolation` con
///   el mensaje canonico de R1. La diferenciacion del otro UNIQUE
///   `(fair_id, year)` se hace por el formato de columnas en el
///   mensaje (ver nota en `V002__one_active_edition_per_fair.sql`).
/// - `UNIQUE constraint failed` sobre `(fair_id, year)` =>
///   `UniqueViolation` con el año concreto que se intento (si llega
///   como contexto).
/// - `FOREIGN KEY constraint failed` al borrar => `ConstraintViolation`
///   con mensaje claro sobre atracciones asociadas.
/// - Cualquier otra `ConstraintViolation` => `ConstraintViolation`
///   con el mensaje crudo de SQLite.
/// - Resto => `Database`.
fn classify_db_err(e: rusqlite::Error, attempted_year: Option<i32>) -> AppError {
    if let rusqlite::Error::SqliteFailure(err, _) = &e {
        if err.code == rusqlite::ErrorCode::ConstraintViolation {
            let msg = e.to_string();
            // Indice parcial V002 sobre `fair_edition(fair_id) WHERE
            // status='active'`: SQLite emite el mensaje como
            // "UNIQUE constraint failed: fair_edition.fair_id" (una
            // sola columna, sin coma). Se distingue del UNIQUE
            // (fair_id, year) que produce "fair_edition.fair_id,
            // fair_edition.year".
            if msg.starts_with("UNIQUE constraint failed: fair_edition.fair_id")
                && !msg.contains("year")
            {
                return AppError::UniqueViolation(ACTIVE_EDITION_CONFLICT_MSG.to_string());
            }
            if msg.contains("UNIQUE constraint failed") && msg.contains("fair_edition") {
                let detail = match attempted_year {
                    Some(y) => format!(
                        "ya existe una edición de esta feria para el año {}",
                        y
                    ),
                    None => "ya existe una edición de esta feria con esos datos".to_string(),
                };
                return AppError::UniqueViolation(detail);
            }
            if msg.contains("FOREIGN KEY constraint failed") {
                return AppError::ConstraintViolation(
                    "no se puede eliminar: la edición tiene atracciones asociadas".into(),
                );
            }
            return AppError::ConstraintViolation(msg);
        }
    }
    AppError::Database(e)
}
