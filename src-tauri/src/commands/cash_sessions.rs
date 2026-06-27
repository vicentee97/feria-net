//! Commands Tauri para `CashSession`.
//!
//! Capa DELGADA: valida entrada minima (UUID, fecha) y delega en
//! el repositorio. Logica de negocio vive en `repository/cash_sessions.rs`.
//!
//! Contrato con el frontend (`src/api/tauri.ts`):
//! - `open_cash_session(attraction_id, date, opening_amount_cents)`
//!     -> `CashSession`.
//! - `close_cash_session(id, closing_amount_cents)` -> `CashSession`.
//! - `get_open_cash_session(attraction_id)` -> `Option<CashSession>`.
//! - `list_cash_sessions_for_attraction(attraction_id)`
//!     -> `Vec<CashSession>`.
//! - `get_cash_session_for_attraction_on_date(attraction_id, date)`
//!     -> `Option<CashSession>`.

use serde::Deserialize;
use tauri::State;
use uuid::Uuid;

use crate::db::repository::cash_sessions;
use crate::domain::CashSession;
use crate::errors::{AppError, SerializableError};
use crate::state::AppState;

// ============================================================
// Inputs
// ============================================================

/// Input para `open_cash_session`. `date` en formato ISO 8601
/// `YYYY-MM-DD` (fecha local del operador).
#[derive(Debug, Deserialize)]
pub struct OpenCashSessionInput {
    pub attraction_id: String,
    pub date: String,
    /// Fondo inicial en centimos.
    pub opening_amount_cents: i64,
}

/// Input para `close_cash_session`. `closing_amount_cents` es el
/// importe declarado por el operador al cierre (no se obliga a
/// coincidir con el teorico; la diferencia es visible en informes).
#[derive(Debug, Deserialize)]
pub struct CloseCashSessionInput {
    pub closing_amount_cents: i64,
}

// ============================================================
// Commands
// ============================================================

/// Abre una caja nueva para una atraccion en una fecha concreta.
#[tauri::command]
pub async fn open_cash_session(
    state: State<'_, AppState>,
    input: OpenCashSessionInput,
) -> Result<CashSession, SerializableError> {
    let attraction_id = parse_uuid(&input.attraction_id)?;
    cash_sessions::open_cash_session(
        &mut *state.db.conn().await,
        &attraction_id,
        &input.date,
        input.opening_amount_cents,
    )
    .map_err(Into::into)
}

/// Cierra una caja abierta. Calcula `total_amount_cents` con la
/// suma de ventas y congela `closed_at`.
#[tauri::command]
pub async fn close_cash_session(
    state: State<'_, AppState>,
    id: String,
    input: CloseCashSessionInput,
) -> Result<CashSession, SerializableError> {
    let uuid = parse_uuid(&id)?;
    cash_sessions::close_cash_session(&mut *state.db.conn().await, &uuid, input.closing_amount_cents)
        .map_err(Into::into)
}

/// Devuelve la caja abierta de una atraccion (si la hay).
#[tauri::command]
pub async fn get_open_cash_session(
    state: State<'_, AppState>,
    attraction_id: String,
) -> Result<Option<CashSession>, SerializableError> {
    let uuid = parse_uuid(&attraction_id)?;
    cash_sessions::get_open_cash_session_for_attraction(&mut *state.db.conn().await, &uuid)
        .map_err(Into::into)
}

/// Lista TODAS las cajas (abiertas y cerradas) de una atraccion,
/// ordenadas por fecha descendente.
#[tauri::command]
pub async fn list_cash_sessions_for_attraction(
    state: State<'_, AppState>,
    attraction_id: String,
) -> Result<Vec<CashSession>, SerializableError> {
    let uuid = parse_uuid(&attraction_id)?;
    cash_sessions::list_cash_sessions_by_attraction(&mut *state.db.conn().await, &uuid, None, None)
        .map_err(Into::into)
}

/// Devuelve la caja (abierta o cerrada) de una atraccion en una
/// fecha concreta. Util para "abrir caja del dia" cuando la UI
/// detecta si ya existe.
#[tauri::command]
pub async fn get_cash_session_for_attraction_on_date(
    state: State<'_, AppState>,
    attraction_id: String,
    date: String,
) -> Result<Option<CashSession>, SerializableError> {
    let uuid = parse_uuid(&attraction_id)?;
    cash_sessions::get_cash_session_for_attraction_on_date(
        &mut *state.db.conn().await,
        &uuid,
        &date,
    )
    .map_err(Into::into)
}

// ============================================================
// Helpers
// ============================================================

fn parse_uuid(s: &str) -> Result<Uuid, AppError> {
    Uuid::parse_str(s).map_err(|_| AppError::InvalidInput(format!("UUID inválido: {}", s)))
}