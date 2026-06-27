//! Repositorio de `CashSession` (Caja diaria).
//!
//! Reglas criticas (data-model §2.5, §5.1..§5.3, enforced en V003):
//! - `UNIQUE (attraction_id, date)`: una sola caja por atraccion y dia.
//! - Indice UNIQUE parcial `(attraction_id) WHERE closed_at IS NULL`:
//!   una sola caja abierta por atraccion simultaneamente.
//! - `closed_at >= opened_at`.
//! - `total_amount` se calcula y congela al cerrar.
//!
//! La traduccion de errores de SQLite distingue:
//! - `UNIQUE constraint failed: cash_session.attraction_id, cash_session.date`
//!   (UNIQUE compuesto de §5.1) -> `AppError::UniqueViolation` con
//!   mensaje claro.
//! - `UNIQUE constraint failed: cash_session.attraction_id` (una sola
//!   columna, del indice parcial de §5.2) -> `AppError::CashSessionAlreadyOpen`
//!   con mensaje canonico.
//! - `CHECK constraint failed: closed_at` -> `AppError::CashSessionClosed`
//!   cuando se intenta cerrar una caja ya cerrada.
//! - Resto -> `AppError::ConstraintViolation` o `AppError::Database`.

use chrono::{DateTime, NaiveDate, Utc};
use rusqlite::{params, Connection, OptionalExtension, Row};
use uuid::Uuid;

use crate::domain::CashSession;
use crate::errors::{AppError, AppResult};

/// Formato canonico para fechas locales del operador.
const DATE_FORMAT: &str = "%Y-%m-%d";

/// Mensaje canonico cuando se intenta abrir una segunda caja
/// para una atraccion que ya tiene una abierta (data-model §5.2,
/// enforced por indice UNIQUE parcial V003).
const CASH_SESSION_ALREADY_OPEN_MSG: &str =
    "Ya hay una caja abierta para esta atracción. Ciérrala antes de abrir otra.";

// ============================================================
// Operaciones CRUD
// ============================================================

/// Abre una nueva caja para una atraccion en una fecha concreta.
///
/// Falla con `CashSessionAlreadyOpen` si ya existe una caja abierta
/// para esa atraccion (indice UNIQUE parcial V003) o con
/// `UniqueViolation` si ya existe una caja cerrada para esa
/// fecha (`UNIQUE (attraction_id, date)`).
pub fn open_cash_session(
    conn: &Connection,
    attraction_id: &Uuid,
    date: &str,
    opening_amount_cents: i64,
) -> AppResult<CashSession> {
    if opening_amount_cents < 0 {
        return Err(AppError::InvalidInput(
            "el fondo inicial no puede ser negativo".into(),
        ));
    }
    let parsed_date = parse_iso_date(date)?;
    attraction_exists(conn, attraction_id)?;

    let id = Uuid::new_v4();
    let now = Utc::now();
    conn.execute(
        "INSERT INTO cash_session \
            (id, attraction_id, date, opened_at, opening_amount) \
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            id.to_string(),
            attraction_id.to_string(),
            date,
            now.to_rfc3339(),
            opening_amount_cents,
        ],
    )
    .map_err(|e| classify_db_err(e, attraction_id))?;

    Ok(CashSession {
        id,
        attraction_id: *attraction_id,
        date: parsed_date,
        opened_at: now,
        closed_at: None,
        opening_amount_cents,
        closing_amount_cents: None,
        total_amount_cents: None,
    })
}

/// Cierra una caja abierta. Calcula `total_amount_cents` como la suma
/// de las ventas registradas, fija `closed_at` y `closing_amount_cents`.
///
/// Falla con `CashSessionClosed` si la caja ya estaba cerrada.
pub fn close_cash_session(
    conn: &Connection,
    id: &Uuid,
    closing_amount_cents: i64,
) -> AppResult<CashSession> {
    if closing_amount_cents < 0 {
        return Err(AppError::InvalidInput(
            "el importe de cierre no puede ser negativo".into(),
        ));
    }
    let mut current = get_cash_session(conn, id)?
        .ok_or_else(|| AppError::NotFound(format!("no existe la caja con id {}", id)))?;

    if current.closed_at.is_some() {
        return Err(AppError::CashSessionClosed(format!(
            "la caja {} ya se cerro el {}",
            id,
            current.closed_at.unwrap().to_rfc3339()
        )));
    }

    // Total = suma de ventas de la caja.
    // Calculado en Rust (no en SQL) para que la fuente de verdad
    // sea la capa de aplicacion y no dependa del orden de INSERTs.
    let total: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM(total_amount_cents), 0) FROM sale WHERE cash_session_id = ?1",
            params![id.to_string()],
            |r| r.get(0),
        )
        .map_err(AppError::Database)?;

    let now = Utc::now();
    conn.execute(
        "UPDATE cash_session SET closed_at = ?1, closing_amount = ?2, total_amount = ?3 \
         WHERE id = ?4",
        params![now.to_rfc3339(), closing_amount_cents, total, id.to_string()],
    )
    .map_err(map_db_err)?;

    current.closed_at = Some(now);
    current.closing_amount_cents = Some(closing_amount_cents);
    current.total_amount_cents = Some(total);
    Ok(current)
}

/// Devuelve una `CashSession` por id, o `None` si no existe.
pub fn get_cash_session(conn: &Connection, id: &Uuid) -> AppResult<Option<CashSession>> {
    let mut stmt = conn.prepare(
        "SELECT id, attraction_id, date, opened_at, closed_at, \
                opening_amount, closing_amount, total_amount \
         FROM cash_session WHERE id = ?1",
    )?;
    let row = stmt
        .query_row(params![id.to_string()], row_to_cash_session)
        .optional()?;
    Ok(row)
}

/// Devuelve la caja abierta de una atraccion (si la hay). Como mucho
/// una por la invariante §5.2; devuelve la primera que encuentre.
pub fn get_open_cash_session_for_attraction(
    conn: &Connection,
    attraction_id: &Uuid,
) -> AppResult<Option<CashSession>> {
    let mut stmt = conn.prepare(
        "SELECT id, attraction_id, date, opened_at, closed_at, \
                opening_amount, closing_amount, total_amount \
         FROM cash_session \
         WHERE attraction_id = ?1 AND closed_at IS NULL \
         ORDER BY opened_at DESC LIMIT 1",
    )?;
    let row = stmt
        .query_row(params![attraction_id.to_string()], row_to_cash_session)
        .optional()?;
    Ok(row)
}

/// Devuelve la caja de una atraccion en una fecha concreta
/// (abierta o cerrada). `None` si no hay caja ese dia.
pub fn get_cash_session_for_attraction_on_date(
    conn: &Connection,
    attraction_id: &Uuid,
    date: &str,
) -> AppResult<Option<CashSession>> {
    let _ = parse_iso_date(date)?; // validar formato
    let mut stmt = conn.prepare(
        "SELECT id, attraction_id, date, opened_at, closed_at, \
                opening_amount, closing_amount, total_amount \
         FROM cash_session \
         WHERE attraction_id = ?1 AND date = ?2",
    )?;
    let row = stmt
        .query_row(
            params![attraction_id.to_string(), date],
            row_to_cash_session,
        )
        .optional()?;
    Ok(row)
}

/// Lista cajas de una atraccion en un rango de fechas (inclusivo),
/// ordenadas por fecha descendente. `since`/`until` en formato
/// `YYYY-MM-DD`; cualquiera puede ser `None` para abrir el rango.
pub fn list_cash_sessions_by_attraction(
    conn: &Connection,
    attraction_id: &Uuid,
    since: Option<&str>,
    until: Option<&str>,
) -> AppResult<Vec<CashSession>> {
    let since = match since {
        Some(s) => Some(parse_iso_date(s)?.to_string()),
        None => None,
    };
    let until = match until {
        Some(u) => Some(parse_iso_date(u)?.to_string()),
        None => None,
    };

    // Construimos el WHERE dinamicamente. Mantenemos el orden de
    // placeholders consistente con el `params![]`.
    let mut sql = String::from(
        "SELECT id, attraction_id, date, opened_at, closed_at, \
                opening_amount, closing_amount, total_amount \
         FROM cash_session \
         WHERE attraction_id = ?1",
    );
    if since.is_some() {
        sql.push_str(" AND date >= ?2");
    }
    if until.is_some() {
        sql.push_str(if since.is_some() {
            " AND date <= ?3"
        } else {
            " AND date <= ?2"
        });
    }
    sql.push_str(" ORDER BY date DESC, opened_at DESC");

    let mut stmt = conn.prepare(&sql)?;
    let attraction_id_str = attraction_id.to_string();
    let mut bound: Vec<&dyn rusqlite::ToSql> = vec![&attraction_id_str];
    if let Some(ref s) = since {
        bound.push(s);
    }
    if let Some(ref u) = until {
        bound.push(u);
    }
    let rows = stmt.query_map(bound.as_slice(), row_to_cash_session)?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r?);
    }
    Ok(out)
}

// ============================================================
// Helpers internos
// ============================================================

/// Parsea una fecha ISO 8601 `YYYY-MM-DD`.
fn parse_iso_date(s: &str) -> AppResult<NaiveDate> {
    NaiveDate::parse_from_str(s, DATE_FORMAT).map_err(|_| {
        AppError::InvalidInput(format!(
            "fecha inválida '{}', se esperaba YYYY-MM-DD",
            s
        ))
    })
}

/// Comprueba que la atraccion existe (fail-fast con mensaje claro
/// antes de que SQLite emita su propio error de FK).
fn attraction_exists(conn: &Connection, attraction_id: &Uuid) -> AppResult<bool> {
    let n: i64 = conn.query_row(
        "SELECT COUNT(*) FROM attraction WHERE id = ?1",
        params![attraction_id.to_string()],
        |r| r.get(0),
    )?;
    if n == 0 {
        return Err(AppError::NotFound(format!(
            "no existe la atracción con id {}",
            attraction_id
        )));
    }
    Ok(true)
}

fn row_to_cash_session(row: &Row<'_>) -> rusqlite::Result<CashSession> {
    let id_str: String = row.get("id")?;
    let attraction_id_str: String = row.get("attraction_id")?;
    let date_str: String = row.get("date")?;
    let opened_at_str: String = row.get("opened_at")?;
    let closed_at_str: Option<String> = row.get("closed_at")?;
    let opening_amount: i64 = row.get("opening_amount")?;
    let closing_amount: Option<i64> = row.get("closing_amount")?;
    let total_amount: Option<i64> = row.get("total_amount")?;

    let id = Uuid::parse_str(&id_str).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e))
    })?;
    let attraction_id = Uuid::parse_str(&attraction_id_str).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(1, rusqlite::types::Type::Text, Box::new(e))
    })?;
    let date = NaiveDate::parse_from_str(&date_str, DATE_FORMAT).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(2, rusqlite::types::Type::Text, Box::new(e))
    })?;
    let opened_at = DateTime::parse_from_rfc3339(&opened_at_str)
        .map_err(|e| {
            rusqlite::Error::FromSqlConversionFailure(3, rusqlite::types::Type::Text, Box::new(e))
        })?
        .with_timezone(&Utc);
    let closed_at = match closed_at_str {
        Some(s) => Some(
            DateTime::parse_from_rfc3339(&s)
                .map_err(|e| {
                    rusqlite::Error::FromSqlConversionFailure(
                        4,
                        rusqlite::types::Type::Text,
                        Box::new(e),
                    )
                })?
                .with_timezone(&Utc),
        ),
        None => None,
    };

    Ok(CashSession {
        id,
        attraction_id,
        date,
        opened_at,
        closed_at,
        opening_amount_cents: opening_amount,
        closing_amount_cents: closing_amount,
        total_amount_cents: total_amount,
    })
}

/// Traduce errores de SQLite en `open_cash_session`. Necesita el
/// `attraction_id` para diferenciar las dos violaciones UNIQUE de V003:
/// - Indice UNIQUE parcial `(attraction_id) WHERE closed_at IS NULL`
///   -> `CashSessionAlreadyOpen`.
/// - UNIQUE compuesto `(attraction_id, date)` -> `UniqueViolation`.
fn classify_db_err(e: rusqlite::Error, attraction_id: &Uuid) -> AppError {
    if let rusqlite::Error::SqliteFailure(err, _) = &e {
        if err.code == rusqlite::ErrorCode::ConstraintViolation {
            let msg = e.to_string();
            // Indice parcial V003: una sola columna `attraction_id`.
            // Formato exacto: `UNIQUE constraint failed: cash_session.attraction_id`
            // (sin coma ni `date` al final).
            if msg.starts_with("UNIQUE constraint failed: cash_session.attraction_id")
                && !msg.contains("date")
            {
                return AppError::CashSessionAlreadyOpen(
                    CASH_SESSION_ALREADY_OPEN_MSG.to_string(),
                );
            }
            if msg.starts_with("UNIQUE constraint failed: cash_session") {
                return AppError::UniqueViolation(format!(
                    "ya existe una caja para la atracción {} en esa fecha",
                    attraction_id
                ));
            }
            if msg.contains("FOREIGN KEY constraint failed") {
                return AppError::ConstraintViolation(
                    "no se puede abrir la caja: la atracción no existe".into(),
                );
            }
            if msg.contains("CHECK constraint failed") {
                if msg.contains("opening_amount") || msg.contains("closing_amount") {
                    return AppError::InvalidInput(
                        "los importes no pueden ser negativos".into(),
                    );
                }
            }
            return AppError::ConstraintViolation(msg);
        }
    }
    AppError::Database(e)
}

/// Traduccion generica para `close_cash_session`. Aqui no esperamos
/// UNIQUE (la fila ya existe); esperamos CHECK si la fila fue marcada
/// cerrada por otra transaccion. Se mantiene simple.
fn map_db_err(e: rusqlite::Error) -> AppError {
    if let rusqlite::Error::SqliteFailure(err, _) = &e {
        if err.code == rusqlite::ErrorCode::ConstraintViolation {
            return AppError::ConstraintViolation(e.to_string());
        }
    }
    AppError::Database(e)
}