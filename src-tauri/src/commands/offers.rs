//! Commands Tauri para `Offer`.
//!
//! Capa DELGADA: valida entrada minima y delega en el repositorio.
//!
//! Contrato con el frontend (`src/api/tauri.ts`):
//! - `create_offer(input)` -> `Offer`.
//! - `list_offers_by_edition(fair_edition_id, include_inactive)`
//!     -> `Vec<Offer>`.
//! - `update_offer(id, input)` -> `Offer`.
//! - `soft_delete_offer(id)` -> `()`.

use serde::Deserialize;
use tauri::State;
use uuid::Uuid;

use crate::db::repository::offers;
use crate::domain::Offer;
use crate::errors::{AppError, SerializableError};
use crate::state::AppState;

// ============================================================
// Inputs
// ============================================================

#[derive(Debug, Deserialize)]
pub struct CreateOfferInput {
    pub fair_edition_id: String,
    pub name: String,
    /// Numero de tickets del bundle. >= 1.
    pub bundle_quantity: u32,
    /// Precio total del bundle en centimos.
    pub bundle_price_cents: i64,
}

#[derive(Debug, Deserialize)]
pub struct UpdateOfferInput {
    pub name: Option<String>,
    pub bundle_quantity: Option<u32>,
    pub bundle_price_cents: Option<i64>,
}

// ============================================================
// Commands
// ============================================================

/// Crea una nueva oferta en una edicion de feria.
#[tauri::command]
pub async fn create_offer(
    state: State<'_, AppState>,
    input: CreateOfferInput,
) -> Result<Offer, SerializableError> {
    let fe_id = parse_uuid(&input.fair_edition_id)?;
    offers::create_offer(
        &mut *state.db.conn().await,
        &fe_id,
        &input.name,
        input.bundle_quantity,
        input.bundle_price_cents,
    )
    .map_err(Into::into)
}

/// Lista las ofertas de una edicion. Si `include_inactive` es `false`
/// (recomendado para UI operativa), oculta las soft-deleted.
#[tauri::command]
pub async fn list_offers_by_edition(
    state: State<'_, AppState>,
    fair_edition_id: String,
    include_inactive: bool,
) -> Result<Vec<Offer>, SerializableError> {
    let fe_id = parse_uuid(&fair_edition_id)?;
    offers::list_offers_by_edition(&mut *state.db.conn().await, &fe_id, include_inactive)
        .map_err(Into::into)
}

/// Actualiza una oferta existente. Campos `None` no se tocan.
#[tauri::command]
pub async fn update_offer(
    state: State<'_, AppState>,
    id: String,
    input: UpdateOfferInput,
) -> Result<Offer, SerializableError> {
    let uuid = parse_uuid(&id)?;
    offers::update_offer(
        &mut *state.db.conn().await,
        &uuid,
        input.name.as_deref(),
        input.bundle_quantity,
        input.bundle_price_cents,
    )
    .map_err(Into::into)
}

/// Soft-delete: marca la oferta como `is_active = 0`. Las ventas
/// pasadas que la aplicaron siguen siendo validas (trazabilidad
/// historica intacta).
#[tauri::command]
pub async fn soft_delete_offer(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), SerializableError> {
    let uuid = parse_uuid(&id)?;
    offers::soft_delete_offer(&mut *state.db.conn().await, &uuid).map_err(Into::into)
}

// ============================================================
// Helpers
// ============================================================

fn parse_uuid(s: &str) -> Result<Uuid, AppError> {
    Uuid::parse_str(s).map_err(|_| AppError::InvalidInput(format!("UUID inválido: {}", s)))
}