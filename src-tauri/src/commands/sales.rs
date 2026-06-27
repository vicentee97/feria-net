//! Commands Tauri para `Sale` y consultas de `Ticket` asociadas.
//!
//! Capa DELGADA: parsea inputs del frontend (TS) y delega en el
//! repositorio. La logica transaccional vive en
//! `repository/sales.rs::create_sale`.
//!
//! Contrato con el frontend (`src/api/tauri.ts`):
//! - `create_sale(input)` -> `SaleWithLines`.
//! - `list_sales_by_cash_session(cash_session_id)` -> `Vec<Sale>`.
//! - `get_sale(id)` -> `SaleWithLines`.
//! - `list_pending_tickets_by_cash_session(cash_session_id)`
//!     -> `Vec<Ticket>`.
//!
//! `list_pending_tickets_by_cash_session` devuelve los tickets que
//! aun NO se han entregado (placeholder `outcome='failure'`). La
//! epica 3 (modulo `ticket-delivery`) los consulta para reintentar
//! la entrega sin tocar la venta.

use serde::Deserialize;
use tauri::State;
use uuid::Uuid;

use crate::db::repository::{sales, tickets};
use crate::db::repository::sales::{
    CreateSaleInput, CreateSaleLineInput, SaleWithLines,
};
use crate::domain::{Sale, Ticket};
use crate::errors::{AppError, SerializableError};
use crate::state::AppState;

// ============================================================
// Inputs
// ============================================================

/// Linea de venta recibida desde el frontend.
#[derive(Debug, Deserialize)]
pub struct CreateSaleLineWireInput {
    /// Cantidad de tickets. >= 1.
    pub quantity: u32,
    /// Precio unitario en centimos. >= 0. Si la venta tiene oferta,
    /// el repositorio exige que sea 0.
    pub unit_price_cents: i64,
}

/// Input completo de `create_sale`.
#[derive(Debug, Deserialize)]
pub struct CreateSaleWireInput {
    pub cash_session_id: String,
    /// `None` = venta sin oferta. `Some(id)` = oferta aplicada.
    pub offer_id: Option<String>,
    pub lines: Vec<CreateSaleLineWireInput>,
}

// ============================================================
// Commands
// ============================================================

/// Crea una venta completa (sale + sale_lines + tickets + delivery_attempt
/// placeholders) de forma **transaccional y atomica**. Si cualquier
/// paso falla, ROLLBACK completo: no existe la posibilidad de
/// venta parcial.
#[tauri::command]
pub async fn create_sale(
    state: State<'_, AppState>,
    input: CreateSaleWireInput,
) -> Result<SaleWithLines, SerializableError> {
    let cash_session_id = parse_uuid(&input.cash_session_id)?;
    let offer_id = match input.offer_id.as_deref() {
        Some(s) => Some(parse_uuid(s)?),
        None => None,
    };
    let lines = input
        .lines
        .into_iter()
        .map(|l| CreateSaleLineInput {
            quantity: l.quantity,
            unit_price_cents: l.unit_price_cents,
        })
        .collect();

    let repo_input = CreateSaleInput {
        cash_session_id,
        offer_id,
        lines,
    };
    sales::create_sale(&mut *state.db.conn().await, &repo_input).map_err(Into::into)
}

/// Lista las ventas (sin lineas ni tickets) de una caja, ordenadas
/// por `created_at` descendente.
#[tauri::command]
pub async fn list_sales_by_cash_session(
    state: State<'_, AppState>,
    cash_session_id: String,
) -> Result<Vec<Sale>, SerializableError> {
    let uuid = parse_uuid(&cash_session_id)?;
    sales::list_sales_by_cash_session(&mut *state.db.conn().await, &uuid).map_err(Into::into)
}

/// Devuelve una venta con sus lineas y tickets populados, o `None`
/// si no existe. Coherente con el resto de `get_*` del proyecto
/// (`get_fair`, `get_cash_session`, ...).
#[tauri::command]
pub async fn get_sale(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<SaleWithLines>, SerializableError> {
    let uuid = parse_uuid(&id)?;
    sales::get_sale(&mut *state.db.conn().await, &uuid).map_err(Into::into)
}

/// Devuelve un ticket por id, o `None` si no existe.
#[tauri::command]
pub async fn get_ticket(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<Ticket>, SerializableError> {
    let uuid = parse_uuid(&id)?;
    tickets::get_ticket(&mut *state.db.conn().await, &uuid).map_err(Into::into)
}

/// Lista los tickets pendientes de entregar de una caja. Filtra
/// los tickets cuyo ultimo `ticket_delivery_attempt` tiene
/// `outcome = 'failure'` (placeholder inicial creado por la venta).
///
/// La epica 3 (modulo `ticket-delivery`) consulta este command
/// para reintentar la entrega sin tocar la venta.
#[tauri::command]
pub async fn list_pending_tickets_by_cash_session(
    state: State<'_, AppState>,
    cash_session_id: String,
) -> Result<Vec<Ticket>, SerializableError> {
    let uuid = parse_uuid(&cash_session_id)?;
    tickets::list_pending_tickets_by_cash_session(&mut *state.db.conn().await, &uuid)
        .map_err(Into::into)
}

// ============================================================
// Helpers
// ============================================================

fn parse_uuid(s: &str) -> Result<Uuid, AppError> {
    Uuid::parse_str(s).map_err(|_| AppError::InvalidInput(format!("UUID inválido: {}", s)))
}