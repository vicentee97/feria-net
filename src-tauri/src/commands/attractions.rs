//! Commands Tauri para `Attraction`.
//!
//! Reciben inputs serializables desde el frontend (TS), validan
//! lo minimo y delegan en el repositorio.

use serde::Deserialize;
use tauri::State;
use uuid::Uuid;

use crate::db::repository::attractions;
use crate::domain::Attraction;
use crate::errors::{AppError, SerializableError};
use crate::state::AppState;

// ============================================================
// Inputs
// ============================================================

/// Input para `create_attraction`.
#[derive(Debug, Deserialize)]
pub struct CreateAttractionInput {
    pub fair_edition_id: String,
    pub name: String,
    pub color: String,
    /// Precio base en **centimos** (ej. 250 = 2,50 EUR).
    pub base_ticket_price_cents: i64,
}

/// Input para `update_attraction`. Campos `None` no se tocan.
#[derive(Debug, Deserialize)]
pub struct UpdateAttractionInput {
    pub name: Option<String>,
    pub color: Option<String>,
    pub base_ticket_price_cents: Option<i64>,
}

// ============================================================
// Commands
// ============================================================

/// Crea una nueva atraccion en una edicion.
#[tauri::command]
pub async fn create_attraction(
    state: State<'_, AppState>,
    input: CreateAttractionInput,
) -> Result<Attraction, SerializableError> {
    let fe_id = parse_uuid(&input.fair_edition_id)?;
    attractions::create_attraction(
        &mut *state.db.conn().await,
        &fe_id,
        &input.name,
        &input.color,
        input.base_ticket_price_cents,
    )
    .map_err(Into::into)
}

/// Lista las atracciones activas de una edicion.
#[tauri::command]
pub async fn list_attractions_by_edition(
    state: State<'_, AppState>,
    fair_edition_id: String,
) -> Result<Vec<Attraction>, SerializableError> {
    let fe_id = parse_uuid(&fair_edition_id)?;
    attractions::list_attractions_by_edition(&mut *state.db.conn().await, &fe_id)
        .map_err(Into::into)
}

/// Actualiza una atraccion existente.
#[tauri::command]
pub async fn update_attraction(
    state: State<'_, AppState>,
    id: String,
    input: UpdateAttractionInput,
) -> Result<Attraction, SerializableError> {
    let uuid = parse_uuid(&id)?;
    attractions::update_attraction(
        &mut *state.db.conn().await,
        &uuid,
        input.name.as_deref(),
        input.color.as_deref(),
        input.base_ticket_price_cents,
    )
    .map_err(Into::into)
}

/// Soft-delete de una atraccion (`is_active = 0`).
#[tauri::command]
pub async fn soft_delete_attraction(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), SerializableError> {
    let uuid = parse_uuid(&id)?;
    attractions::soft_delete_attraction(&mut *state.db.conn().await, &uuid).map_err(Into::into)
}

// ============================================================
// Helpers
// ============================================================

fn parse_uuid(s: &str) -> Result<Uuid, AppError> {
    Uuid::parse_str(s).map_err(|_| AppError::InvalidInput(format!("UUID invalido: {}", s)))
}
