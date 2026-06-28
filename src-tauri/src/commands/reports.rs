//! Commands Tauri para informes (epica 4).
//!
//! Capa DELGADA: parsea los argumentos del frontend (UUIDs como
//! `String`, fechas como `YYYY-MM-DD`), valida que la entrada tiene
//! la forma esperada y delega en `db::repository::reports`. La
//! logica de agregacion vive en el repositorio.
//!
//! Contrato con el frontend (`src/api/tauri.ts`):
//! - `get_daily_report(edition_id, date)` -> `DailyReport`.
//! - `get_feria_report(edition_id, from_date, to_date)` -> `FeriaReport`.
//! - `get_comparative_report(fair_id)` -> `ComparativeReport`.
//!
//! Las fechas se reciben como `String` (no `NaiveDate`) para que
//! un input mal formado se traduzca a `InvalidInput` con mensaje
//! claro en vez de al error generico de deserializacion de Tauri.

use tauri::State;

use crate::db::repository::reports;
use crate::domain::report::{ComparativeReport, DailyReport, FeriaReport};
use crate::errors::{AppError, SerializableError};
use crate::state::AppState;

/// Formato canonico para fechas locales del operador. Replica el
/// `DATE_FORMAT` del repositorio para validar antes de delegar.
const DATE_FORMAT: &str = "%Y-%m-%d";

// ============================================================
// Commands
// ============================================================

/// Informe por dia: totales por atraccion + total general del dia.
///
/// `date` en formato ISO 8601 `YYYY-MM-DD` (fecha local del operador).
#[tauri::command]
pub async fn get_daily_report(
    state: State<'_, AppState>,
    edition_id: String,
    date: String,
) -> Result<DailyReport, SerializableError> {
    let edition_uuid = parse_uuid(&edition_id, "edition_id")?;
    let parsed_date = parse_iso_date(&date, "date")?;

    let conn = state.db.conn().await;
    reports::get_daily_report(&conn, &edition_uuid, parsed_date).map_err(Into::into)
}

/// Informe por feria: totales de una edicion sobre un rango de fechas.
///
/// `from_date` y `to_date` en formato ISO 8601 `YYYY-MM-DD`,
/// inclusivos. Se valida que `from_date <= to_date`.
#[tauri::command]
pub async fn get_feria_report(
    state: State<'_, AppState>,
    edition_id: String,
    from_date: String,
    to_date: String,
) -> Result<FeriaReport, SerializableError> {
    let edition_uuid = parse_uuid(&edition_id, "edition_id")?;
    let parsed_from = parse_iso_date(&from_date, "from_date")?;
    let parsed_to = parse_iso_date(&to_date, "to_date")?;

    if parsed_from > parsed_to {
        return Err(AppError::InvalidInput(format!(
            "from_date '{}' no puede ser posterior a to_date '{}'",
            from_date, to_date
        ))
        .into());
    }

    let conn = state.db.conn().await;
    reports::get_feria_report(&conn, &edition_uuid, parsed_from, parsed_to).map_err(Into::into)
}

/// Comparativa interanual: todas las ediciones de una feria,
/// ordenadas por ano ascendente.
#[tauri::command]
pub async fn get_comparative_report(
    state: State<'_, AppState>,
    fair_id: String,
) -> Result<ComparativeReport, SerializableError> {
    let fair_uuid = parse_uuid(&fair_id, "fair_id")?;

    let conn = state.db.conn().await;
    reports::get_comparative_report(&conn, &fair_uuid).map_err(Into::into)
}

// ============================================================
// Helpers
// ============================================================

fn parse_uuid(s: &str, field: &str) -> Result<uuid::Uuid, AppError> {
    uuid::Uuid::parse_str(s).map_err(|_| {
        AppError::InvalidInput(format!("{} invalido: '{}'", field, s))
    })
}

fn parse_iso_date(s: &str, field: &str) -> Result<chrono::NaiveDate, AppError> {
    chrono::NaiveDate::parse_from_str(s, DATE_FORMAT).map_err(|_| {
        AppError::InvalidInput(format!(
            "{} invalida '{}', se esperaba YYYY-MM-DD",
            field, s
        ))
    })
}