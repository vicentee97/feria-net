//! Repositorio de `Ticket` (consultas de soporte para la UI).
//!
//! Los tickets se crean SIEMPRE dentro de `create_sale`
//! (transaccional, atomico). Este repositorio expone solo
//! lecturas y la consulta "tickets pendientes de imprimir"
//! para la UI.
//!
//! El modulo `ticket-delivery` (epica 3) anadira escrituras
//! aqui (reintentos, actualizacion de `delivery_status`, etc.)
//! sin tocar la venta.

use chrono::{DateTime, Utc};
use rusqlite::{params, Connection, OptionalExtension, Row};
use uuid::Uuid;

use crate::domain::Ticket;
use crate::errors::AppResult;

// ============================================================
// Operaciones
// ============================================================

/// Devuelve un `Ticket` por id, o `None` si no existe.
pub fn get_ticket(conn: &Connection, id: &Uuid) -> AppResult<Option<Ticket>> {
    let mut stmt = conn.prepare(
        "SELECT id, sale_id, sale_line_id, cash_session_id, fair_edition_id, \
                attraction_id, created_at, quantity, unit_price_cents, total_cents \
         FROM ticket WHERE id = ?1",
    )?;
    let row = stmt
        .query_row(params![id.to_string()], row_to_ticket)
        .optional()?;
    Ok(row)
}

/// Lista todos los tickets de una caja (para informes y detalle de
/// la caja). Orden estable por `created_at` e `id`.
///
/// API expuesta para uso futuro por informes (epica 4) y por la UI
/// en el panel "tickets emitidos". No consumido por command en esta
/// epoca; queda como parte del contrato del repositorio.
#[allow(dead_code)]
pub fn list_tickets_by_cash_session(
    conn: &Connection,
    cash_session_id: &Uuid,
) -> AppResult<Vec<Ticket>> {
    let mut stmt = conn.prepare(
        "SELECT id, sale_id, sale_line_id, cash_session_id, fair_edition_id, \
                attraction_id, created_at, quantity, unit_price_cents, total_cents \
         FROM ticket WHERE cash_session_id = ?1 \
         ORDER BY created_at ASC, id ASC",
    )?;
    let rows = stmt.query_map(params![cash_session_id.to_string()], row_to_ticket)?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r?);
    }
    Ok(out)
}

/// Lista los tickets pendientes de entregar de una caja.
///
/// Filtra los tickets cuyo ultimo `ticket_delivery_attempt` tiene
/// `outcome = 'failure'` (placeholder inicial creado por la venta).
/// La epica 3 (`ticket-delivery`) consulta este listado para
/// reintentar la entrega.
///
/// Cuando la epica 3 entregue un ticket, escribira un NUEVO
/// `ticket_delivery_attempt` con `outcome = 'success'`. Como aqui
/// solo miramos el ultimo intento por ticket, ese ticket dejara
/// de aparecer como pendiente.
pub fn list_pending_tickets_by_cash_session(
    conn: &Connection,
    cash_session_id: &Uuid,
) -> AppResult<Vec<Ticket>> {
    let mut stmt = conn.prepare(
        "SELECT t.id, t.sale_id, t.sale_line_id, t.cash_session_id, \
                t.fair_edition_id, t.attraction_id, t.created_at, \
                t.quantity, t.unit_price_cents, t.total_cents \
         FROM ticket t \
         JOIN ticket_delivery_attempt a ON a.id = ( \
             SELECT a2.id FROM ticket_delivery_attempt a2 \
             WHERE a2.ticket_id = t.id \
             ORDER BY a2.attempted_at DESC, a2.id DESC LIMIT 1 \
         ) \
         WHERE t.cash_session_id = ?1 AND a.outcome = 'failure' \
         ORDER BY t.created_at ASC, t.id ASC",
    )?;
    let rows = stmt.query_map(params![cash_session_id.to_string()], row_to_ticket)?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r?);
    }
    Ok(out)
}

// ============================================================
// Helpers internos
// ============================================================

fn row_to_ticket(row: &Row<'_>) -> rusqlite::Result<Ticket> {
    let id_str: String = row.get("id")?;
    let sale_str: String = row.get("sale_id")?;
    let line_str: String = row.get("sale_line_id")?;
    let cs_str: String = row.get("cash_session_id")?;
    let fe_str: String = row.get("fair_edition_id")?;
    let attr_str: String = row.get("attraction_id")?;
    let created_at_str: String = row.get("created_at")?;
    let quantity: i64 = row.get("quantity")?;
    let unit_price: i64 = row.get("unit_price_cents")?;
    let total: i64 = row.get("total_cents")?;

    let id = Uuid::parse_str(&id_str).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e))
    })?;
    let sale_id = Uuid::parse_str(&sale_str).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(1, rusqlite::types::Type::Text, Box::new(e))
    })?;
    let sale_line_id = Uuid::parse_str(&line_str).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(2, rusqlite::types::Type::Text, Box::new(e))
    })?;
    let cash_session_id = Uuid::parse_str(&cs_str).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(3, rusqlite::types::Type::Text, Box::new(e))
    })?;
    let fair_edition_id = Uuid::parse_str(&fe_str).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(4, rusqlite::types::Type::Text, Box::new(e))
    })?;
    let attraction_id = Uuid::parse_str(&attr_str).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(5, rusqlite::types::Type::Text, Box::new(e))
    })?;
    let created_at = DateTime::parse_from_rfc3339(&created_at_str)
        .map_err(|e| {
            rusqlite::Error::FromSqlConversionFailure(6, rusqlite::types::Type::Text, Box::new(e))
        })?
        .with_timezone(&Utc);
    Ok(Ticket {
        id,
        sale_id,
        sale_line_id,
        cash_session_id,
        fair_edition_id,
        attraction_id,
        created_at,
        quantity: quantity as u32,
        unit_price_cents: unit_price,
        total_cents: total,
    })
}