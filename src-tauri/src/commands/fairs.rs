//! Commands Tauri para `Fair`.
//!
//! Reciben inputs serializables desde el frontend (TS), validan
//! lo minimo y delegan en el repositorio.

use serde::Deserialize;
use tauri::State;
use uuid::Uuid;

use crate::db::repository::fairs;
use crate::domain::Fair;
use crate::errors::{AppError, SerializableError};
use crate::state::AppState;

// ============================================================
// Inputs
// ============================================================

/// Input para `create_fair`.
#[derive(Debug, Deserialize)]
pub struct CreateFairInput {
    pub name: String,
    pub notes: Option<String>,
}

/// Input para `update_fair`.
///
/// `notes` con doble Option para distinguir "no tocar" de "borrar":
/// - `None`            -> no tocar el campo.
/// - `Some(None)`      -> poner el campo a NULL (borrar notas).
/// - `Some(Some(s))`   -> actualizar a `s`.
#[derive(Debug, Deserialize)]
pub struct UpdateFairInput {
    pub name: Option<String>,
    pub notes: Option<Option<String>>,
}

// ============================================================
// Commands
// ============================================================

/// Crea una nueva feria generica.
#[tauri::command]
pub async fn create_fair(
    state: State<'_, AppState>,
    input: CreateFairInput,
) -> Result<Fair, SerializableError> {
    fairs::create_fair(&mut *state.db.conn().await, &input.name, input.notes.as_deref())
        .map_err(Into::into)
}

/// Lista todas las ferias.
#[tauri::command]
pub async fn list_fairs(state: State<'_, AppState>) -> Result<Vec<Fair>, SerializableError> {
    fairs::list_fairs(&mut *state.db.conn().await).map_err(Into::into)
}

/// Devuelve una feria por id (UUID como String desde TS).
#[tauri::command]
pub async fn get_fair(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<Fair>, SerializableError> {
    let uuid = parse_uuid(&id)?;
    fairs::get_fair(&mut *state.db.conn().await, &uuid).map_err(Into::into)
}

/// Actualiza una feria.
#[tauri::command]
pub async fn update_fair(
    state: State<'_, AppState>,
    id: String,
    input: UpdateFairInput,
) -> Result<Fair, SerializableError> {
    let uuid = parse_uuid(&id)?;
    fairs::update_fair(
        &mut *state.db.conn().await,
        &uuid,
        input.name.as_deref(),
        input.notes.as_ref().map(|n| n.as_deref()),
    )
    .map_err(Into::into)
}

/// Elimina una feria. Falla si tiene ediciones asociadas.
#[tauri::command]
pub async fn delete_fair(state: State<'_, AppState>, id: String) -> Result<(), SerializableError> {
    let uuid = parse_uuid(&id)?;
    fairs::delete_fair(&mut *state.db.conn().await, &uuid).map_err(Into::into)
}

/// Sugiere una feria existente con nombre equivalente.
#[tauri::command]
pub async fn suggest_fair_by_name(
    state: State<'_, AppState>,
    name: String,
) -> Result<Option<Fair>, SerializableError> {
    fairs::suggest_fair_by_name(&mut *state.db.conn().await, &name).map_err(Into::into)
}

// ============================================================
// Helpers
// ============================================================

fn parse_uuid(s: &str) -> Result<Uuid, AppError> {
    Uuid::parse_str(s).map_err(|_| AppError::InvalidInput(format!("UUID invalido: {}", s)))
}
