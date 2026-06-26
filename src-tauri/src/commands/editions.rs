//! Commands Tauri para `FairEdition`.
//!
//! Reciben inputs serializables desde el frontend (TS), validan
//! lo minimo (UUID, status) y delegan en el repositorio.
//!
//! Contrato con el frontend (`src/api/tauri.ts`):
//! - `list_fair_editions(fairId)` -> `Vec<FairEdition>`.
//! - `create_fair_edition(fairId, input)` -> `FairEdition`.
//! - `update_fair_edition(id, input)` -> `FairEdition`.
//! - `delete_fair_edition(id)` -> `()`.
//! - `change_fair_edition_status(id, status)` -> `FairEdition`.
//!
//! El argumento `fairId` viaja separado del input para encajar
//! con el stub del frontend (que lo recibe asi). El campo
//! `fair_id` NO forma parte de `CreateFairEditionInput`.

use serde::Deserialize;
use tauri::State;
use uuid::Uuid;

use crate::db::repository::editions;
use crate::domain::{FairEdition, FairEditionStatus};
use crate::errors::{AppError, SerializableError};
use crate::state::AppState;

// ============================================================
// Inputs
// ============================================================

/// Input para `create_fair_edition`.
///
/// NO contiene `fair_id`: llega como argumento separado del
/// command (`fair_id: String`). Encaja con el stub del frontend
/// en `src/api/tauri.ts`.
#[derive(Debug, Deserialize)]
pub struct CreateFairEditionInput {
    pub year: i32,
    /// ISO 8601 `YYYY-MM-DD` (fecha local del operador).
    pub start_date: String,
    /// ISO 8601 `YYYY-MM-DD`.
    pub end_date: String,
    pub status: FairEditionStatus,
}

/// Input para `update_fair_edition`. Campos `None` no se tocan.
///
/// Refleja `Partial<Omit<FairEdition, "id" | "fair_id" | "created_at">>`
/// del frontend. `fair_id` no es actualizable: la edicion queda
/// ligada a la feria bajo la que fue creada.
#[derive(Debug, Deserialize)]
pub struct UpdateFairEditionInput {
    pub year: Option<i32>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub status: Option<FairEditionStatus>,
}

// ============================================================
// Commands
// ============================================================

/// Lista las ediciones de una feria, ordenadas por año descendente.
#[tauri::command]
pub async fn list_fair_editions(
    state: State<'_, AppState>,
    fair_id: String,
) -> Result<Vec<FairEdition>, SerializableError> {
    let uuid = parse_uuid(&fair_id)?;
    editions::list_editions_by_fair(&mut *state.db.conn().await, &uuid).map_err(Into::into)
}

/// Crea una nueva edicion dentro de la feria `fair_id`.
#[tauri::command]
pub async fn create_fair_edition(
    state: State<'_, AppState>,
    fair_id: String,
    input: CreateFairEditionInput,
) -> Result<FairEdition, SerializableError> {
    let uuid = parse_uuid(&fair_id)?;
    editions::create_edition(
        &mut *state.db.conn().await,
        &uuid,
        input.year,
        &input.start_date,
        &input.end_date,
        input.status,
    )
    .map_err(Into::into)
}

/// Actualiza una edicion existente. Campos `None` no se tocan.
#[tauri::command]
pub async fn update_fair_edition(
    state: State<'_, AppState>,
    id: String,
    input: UpdateFairEditionInput,
) -> Result<FairEdition, SerializableError> {
    let uuid = parse_uuid(&id)?;
    editions::update_edition(
        &mut *state.db.conn().await,
        &uuid,
        input.year,
        input.start_date.as_deref(),
        input.end_date.as_deref(),
        input.status,
    )
    .map_err(Into::into)
}

/// Elimina una edicion. Falla con `ConstraintViolation` si tiene
/// atracciones asociadas (`ON DELETE RESTRICT` en la FK).
#[tauri::command]
pub async fn delete_fair_edition(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), SerializableError> {
    let uuid = parse_uuid(&id)?;
    editions::delete_edition(&mut *state.db.conn().await, &uuid).map_err(Into::into)
}

/// Cambia solo el estado de una edicion (`planned -> active -> closed`).
///
/// Recibe el status como `String` desde TS para devolver un
/// `InvalidInput` claro si llega un valor no esperado, en vez del
/// error generico de deserializacion.
#[tauri::command]
pub async fn change_fair_edition_status(
    state: State<'_, AppState>,
    id: String,
    status: String,
) -> Result<FairEdition, SerializableError> {
    let uuid = parse_uuid(&id)?;
    let parsed = FairEditionStatus::from_str(&status).ok_or_else(|| {
        AppError::InvalidInput(format!(
            "status inválido '{}', se esperaba 'planned' | 'active' | 'closed'",
            status
        ))
    })?;
    editions::change_edition_status(&mut *state.db.conn().await, &uuid, parsed)
        .map_err(Into::into)
}

// ============================================================
// Helpers
// ============================================================

fn parse_uuid(s: &str) -> Result<Uuid, AppError> {
    Uuid::parse_str(s).map_err(|_| AppError::InvalidInput(format!("UUID inválido: {}", s)))
}
