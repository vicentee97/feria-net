//! Repositorio de `Sale` (Venta) y `SaleLine` (Linea de venta).
//!
//! Reglas (enforced en backend por V003 + logica de aplicacion):
//! - `total_amount_cents >= 0`.
//! - Si `offer_id IS NOT NULL`:
//!     * `total_amount_cents = offer.bundle_price_cents`.
//!     * La unica `SaleLine` tiene `quantity = bundle_quantity` y
//!       `unit_price_cents = 0` (modelo bundle, ver `sale_line.rs`).
//! - Si `offer_id IS NULL`:
//!     * `total_amount_cents = SUM(line_total_cents)`.
//! - `Sale` siempre se crea con su caja abierta (data-model §5.3).
//! - Tickets se generan en bloque, en la misma transaccion
//!   (data-model §5.5).
//!
//! `create_sale` es **transaccional y atomica**: si cualquier paso
//! falla, se hace ROLLBACK completo. No existe la posibilidad de
//! tener una venta sin sus lineas, tickets o delivery_attempts.
//!
//! Decoupling de `ticket-delivery`: la venta crea UN
//! `ticket_delivery_attempt` placeholder por ticket con
//! `delivery_kind='noop'`, `outcome='failure'`, `error_code='unknown'`,
//! `error_detail='pending'`. La epica 3 los consulta y actualiza.
//! El esquema de `ticket_delivery_attempt` sigue `docs/data-model.md`
//! §2.9 desde V003, sin necesidad de nueva migracion para esa pieza.

use chrono::{DateTime, Utc};
use rusqlite::{params, Connection, OptionalExtension, Row};
use serde::Serialize;
use uuid::Uuid;

use crate::domain::{Sale, SaleLine, Ticket};
use crate::errors::{AppError, AppResult};

// ============================================================
// Tipos de input/salida
// ============================================================

/// Entrada para `create_sale`. Lineas en orden de captura por la UI.
#[derive(Debug, Clone)]
pub struct CreateSaleLineInput {
    pub quantity: u32,
    pub unit_price_cents: i64,
}

#[derive(Debug, Clone)]
pub struct CreateSaleInput {
    pub cash_session_id: Uuid,
    /// `None` = venta sin oferta. `Some(id)` = oferta aplicada.
    pub offer_id: Option<Uuid>,
    pub lines: Vec<CreateSaleLineInput>,
}

/// Venta con sus lineas y tickets populados. Devuelto por
/// `create_sale` y `get_sale`. La UI lo usa para mostrar el
/// ticket / comprobante de la venta.
///
/// `Serialize` se deriva para que Tauri lo pueda serializar en
/// la frontera IPC (el frontend TS lo recibe como un objeto con
/// `sale`, `lines` y `tickets` anidados; ver `commands/sales.rs`).
#[derive(Debug, Clone, Serialize)]
pub struct SaleWithLines {
    pub sale: Sale,
    pub lines: Vec<SaleLine>,
    pub tickets: Vec<Ticket>,
}

// ============================================================
// Operaciones
// ============================================================

/// Crea una venta completa de forma **transaccional y atomica**.
///
/// Pasos (todos dentro de una sola `Connection::transaction`):
/// 1. Validar que la caja existe y esta abierta.
/// 2. Validar formato de las lineas (quantity >= 1, unit_price >= 0).
/// 3. Si hay oferta: cargarla, validar que pertenece a la misma
///    edicion que la atraccion de la caja, y que las lineas
///    cumplen el contrato bundle.
/// 4. Calcular `total_amount_cents`.
/// 5. INSERT de `sale`.
/// 6. INSERT de `sale_line` (con `line_total_cents` calculado).
/// 7. INSERT de `ticket` (N filas por linea, una por ticket fisico).
/// 8. INSERT de `ticket_delivery_attempt` placeholder por cada ticket.
///
/// Si cualquier paso falla, ROLLBACK completo. La venta nunca queda
/// parcialmente persistida.
pub fn create_sale(conn: &mut Connection, input: &CreateSaleInput) -> AppResult<SaleWithLines> {
    // Validaciones de input tempranas (no requieren BD).
    if input.lines.is_empty() {
        return Err(AppError::InvalidSale(
            "la venta debe tener al menos una línea".into(),
        ));
    }
    for (i, line) in input.lines.iter().enumerate() {
        if line.quantity < 1 {
            return Err(AppError::InvalidSale(format!(
                "línea {}: la cantidad debe ser >= 1",
                i
            )));
        }
        if line.unit_price_cents < 0 {
            return Err(AppError::InvalidSale(format!(
                "línea {}: el precio unitario no puede ser negativo",
                i
            )));
        }
    }

    // Transaccion atomica. `conn.transaction` hace BEGIN; el closure
    // recibe `&mut Transaction` que se commitea al volver Ok y se
    // hace rollback al propagar Err.
    let tx = conn.transaction().map_err(AppError::Database)?;

    // 1. Caja abierta.
    let (attraction_id, fair_edition_id) = load_open_session(&tx, &input.cash_session_id)?;

    // 2. Oferta (si la hay) pertenece a la misma edicion que la
    //    atraccion de la caja.
    let offer = match input.offer_id {
        Some(oid) => Some(load_offer_in_edition(&tx, &oid, &fair_edition_id)?),
        None => None,
    };

    // 3. Calcular totales y validar contrato bundle (si hay oferta).
    let (total_amount_cents, normalized_lines) =
        compute_totals(&input.lines, offer.as_ref())?;

    // 4. INSERT sale.
    let sale_id = Uuid::new_v4();
    let now = Utc::now();
    tx.execute(
        "INSERT INTO sale \
            (id, cash_session_id, offer_id, created_at, total_amount_cents) \
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            sale_id.to_string(),
            input.cash_session_id.to_string(),
            input.offer_id.map(|o| o.to_string()),
            now.to_rfc3339(),
            total_amount_cents,
        ],
    )
    .map_err(map_db_err)?;

    // 5. INSERT sale_line + ticket + ticket_delivery_attempt por linea.
    let mut persisted_lines: Vec<SaleLine> = Vec::with_capacity(normalized_lines.len());
    let mut persisted_tickets: Vec<Ticket> = Vec::new();

    for nl in &normalized_lines {
        let line_id = Uuid::new_v4();
        tx.execute(
            "INSERT INTO sale_line \
                (id, sale_id, quantity, unit_price_cents, line_total_cents) \
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                line_id.to_string(),
                sale_id.to_string(),
                nl.quantity,
                nl.unit_price_cents,
                nl.line_total_cents,
            ],
        )
        .map_err(map_db_err)?;

        persisted_lines.push(SaleLine {
            id: line_id,
            sale_id,
            quantity: nl.quantity,
            unit_price_cents: nl.unit_price_cents,
            line_total_cents: nl.line_total_cents,
        });

        // Generar `quantity` filas en `ticket` (una por ticket fisico).
        for _ in 0..nl.quantity {
            let ticket_id = Uuid::new_v4();
            tx.execute(
                "INSERT INTO ticket \
                    (id, sale_id, sale_line_id, cash_session_id, fair_edition_id, \
                     attraction_id, created_at, quantity, unit_price_cents, total_cents) \
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 1, ?8, ?8)",
                params![
                    ticket_id.to_string(),
                    sale_id.to_string(),
                    line_id.to_string(),
                    input.cash_session_id.to_string(),
                    fair_edition_id.to_string(),
                    attraction_id.to_string(),
                    now.to_rfc3339(),
                    nl.unit_price_cents,
                ],
            )
            .map_err(map_db_err)?;

            // Placeholder para ticket-delivery (epica 3).
            tx.execute(
                "INSERT INTO ticket_delivery_attempt \
                    (id, ticket_id, attempted_at, delivery_kind, outcome, \
                     error_code, error_detail) \
                 VALUES (?1, ?2, ?3, 'noop', 'failure', 'unknown', ?4)",
                params![
                    Uuid::new_v4().to_string(),
                    ticket_id.to_string(),
                    now.to_rfc3339(),
                    "pending",
                ],
            )
            .map_err(map_db_err)?;

            persisted_tickets.push(Ticket {
                id: ticket_id,
                sale_id,
                sale_line_id: line_id,
                cash_session_id: input.cash_session_id,
                fair_edition_id,
                attraction_id,
                created_at: now,
                quantity: 1,
                unit_price_cents: nl.unit_price_cents,
                total_cents: nl.unit_price_cents,
            });
        }
    }

    tx.commit().map_err(AppError::Database)?;

    Ok(SaleWithLines {
        sale: Sale {
            id: sale_id,
            cash_session_id: input.cash_session_id,
            offer_id: input.offer_id,
            created_at: now,
            total_amount_cents,
        },
        lines: persisted_lines,
        tickets: persisted_tickets,
    })
}

/// Devuelve una venta con sus lineas y tickets, o `None` si no existe.
pub fn get_sale(conn: &Connection, id: &Uuid) -> AppResult<Option<SaleWithLines>> {
    let sale = match get_sale_row(conn, id)? {
        Some(s) => s,
        None => return Ok(None),
    };
    let lines = list_lines_by_sale(conn, &sale.id)?;
    let tickets = list_tickets_by_sale(conn, &sale.id)?;
    Ok(Some(SaleWithLines {
        sale,
        lines,
        tickets,
    }))
}

/// Lista las ventas (sin lineas ni tickets) de una caja, ordenadas
/// por `created_at` descendente.
pub fn list_sales_by_cash_session(
    conn: &Connection,
    cash_session_id: &Uuid,
) -> AppResult<Vec<Sale>> {
    let mut stmt = conn.prepare(
        "SELECT id, cash_session_id, offer_id, created_at, total_amount_cents \
         FROM sale WHERE cash_session_id = ?1 \
         ORDER BY created_at DESC",
    )?;
    let rows = stmt.query_map(params![cash_session_id.to_string()], row_to_sale)?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r?);
    }
    Ok(out)
}

/// Lista los tickets de una venta. Orden estable por `created_at`
/// e `id` (imprescindible para reimpresion coherente).
pub fn list_tickets_by_sale(conn: &Connection, sale_id: &Uuid) -> AppResult<Vec<Ticket>> {
    let mut stmt = conn.prepare(
        "SELECT id, sale_id, sale_line_id, cash_session_id, fair_edition_id, \
                attraction_id, created_at, quantity, unit_price_cents, total_cents \
         FROM ticket WHERE sale_id = ?1 \
         ORDER BY created_at ASC, id ASC",
    )?;
    let rows = stmt.query_map(params![sale_id.to_string()], row_to_ticket)?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r?);
    }
    Ok(out)
}

// ============================================================
// Helpers privados
// ============================================================

/// Estructura intermedia usada en `create_sale`. Se calcula antes
/// de tocar la BD para que las validaciones sean tempranas.
struct NormalizedLine {
    quantity: u32,
    unit_price_cents: i64,
    line_total_cents: i64,
}

/// Calcula `total_amount_cents` y las lineas normalizadas. Si hay
/// oferta, valida el contrato bundle:
/// - Exactamente una linea.
/// - `quantity == offer.bundle_quantity`.
/// - `unit_price_cents == 0` (el cobro lo totaliza la oferta).
fn compute_totals(
    lines: &[CreateSaleLineInput],
    offer: Option<&OfferInfo>,
) -> AppResult<(i64, Vec<NormalizedLine>)> {
    match offer {
        Some(o) => {
            if lines.len() != 1 {
                return Err(AppError::InvalidSale(format!(
                    "una venta con oferta debe tener exactamente 1 línea (recibidas: {})",
                    lines.len()
                )));
            }
            let line = &lines[0];
            if line.quantity != o.bundle_quantity {
                return Err(AppError::InvalidSale(format!(
                    "la cantidad de la línea ({}) no coincide con el bundle de la oferta ({})",
                    line.quantity, o.bundle_quantity
                )));
            }
            if line.unit_price_cents != 0 {
                return Err(AppError::InvalidSale(
                    "con oferta aplicada, el precio unitario debe ser 0 (el cobro es el bundle)"
                        .into(),
                ));
            }
            let normalized = vec![NormalizedLine {
                quantity: line.quantity,
                unit_price_cents: 0,
                line_total_cents: 0,
            }];
            Ok((o.bundle_price_cents, normalized))
        }
        None => {
            let mut normalized = Vec::with_capacity(lines.len());
            let mut total: i64 = 0;
            for l in lines {
                let lt = (l.quantity as i64) * l.unit_price_cents;
                total += lt;
                normalized.push(NormalizedLine {
                    quantity: l.quantity,
                    unit_price_cents: l.unit_price_cents,
                    line_total_cents: lt,
                });
            }
            Ok((total, normalized))
        }
    }
}

struct OfferInfo {
    bundle_quantity: u32,
    bundle_price_cents: i64,
}

/// Carga la caja abierta y devuelve `(attraction_id, fair_edition_id)`.
/// Falla con `CashSessionClosed` si esta cerrada, `NotFound` si no
/// existe.
fn load_open_session(
    tx: &rusqlite::Transaction<'_>,
    cash_session_id: &Uuid,
) -> AppResult<(Uuid, Uuid)> {
    let mut stmt = tx.prepare(
        "SELECT cs.attraction_id, a.fair_edition_id, cs.closed_at \
         FROM cash_session cs \
         JOIN attraction a ON a.id = cs.attraction_id \
         WHERE cs.id = ?1",
    )?;
    let row = stmt
        .query_row(params![cash_session_id.to_string()], |r| {
            let attraction_id: String = r.get(0)?;
            let fair_edition_id: String = r.get(1)?;
            let closed_at: Option<String> = r.get(2)?;
            Ok((attraction_id, fair_edition_id, closed_at))
        })
        .optional()?;
    let (attraction_id_str, fair_edition_id_str, closed_at) = row.ok_or_else(|| {
        AppError::NotFound(format!("no existe la caja con id {}", cash_session_id))
    })?;
    if closed_at.is_some() {
        return Err(AppError::CashSessionClosed(format!(
            "no se pueden añadir ventas a la caja {} (cerrada)",
            cash_session_id
        )));
    }
    let attraction_id = Uuid::parse_str(&attraction_id_str).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e))
    })?;
    let fair_edition_id = Uuid::parse_str(&fair_edition_id_str).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(1, rusqlite::types::Type::Text, Box::new(e))
    })?;
    Ok((attraction_id, fair_edition_id))
}

/// Carga la oferta y verifica que pertenece a `expected_edition_id`.
/// Coherencia data-model §5.8: `Sale.offer_id.fair_edition_id =
/// Sale.cash_session.attraction.fair_edition_id`.
fn load_offer_in_edition(
    tx: &rusqlite::Transaction<'_>,
    offer_id: &Uuid,
    expected_edition_id: &Uuid,
) -> AppResult<OfferInfo> {
    let mut stmt = tx.prepare(
        "SELECT fair_edition_id, bundle_quantity, bundle_price_cents, is_active \
         FROM offer WHERE id = ?1",
    )?;
    let row = stmt
        .query_row(params![offer_id.to_string()], |r| {
            let fe: String = r.get(0)?;
            let q: i64 = r.get(1)?;
            let p: i64 = r.get(2)?;
            let active: i64 = r.get(3)?;
            Ok((fe, q, p, active))
        })
        .optional()?;
    let (fe_str, q, p, active) = row.ok_or_else(|| {
        AppError::NotFound(format!("no existe la oferta con id {}", offer_id))
    })?;
    let fe = Uuid::parse_str(&fe_str).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e))
    })?;
    if fe != *expected_edition_id {
        return Err(AppError::InvalidSale(format!(
            "la oferta {} pertenece a otra edición de feria",
            offer_id
        )));
    }
    if active == 0 {
        return Err(AppError::InvalidSale(format!(
            "la oferta {} está desactivada",
            offer_id
        )));
    }
    Ok(OfferInfo {
        bundle_quantity: q as u32,
        bundle_price_cents: p,
    })
}

fn get_sale_row(conn: &Connection, id: &Uuid) -> AppResult<Option<Sale>> {
    let mut stmt = conn.prepare(
        "SELECT id, cash_session_id, offer_id, created_at, total_amount_cents \
         FROM sale WHERE id = ?1",
    )?;
    let row = stmt
        .query_row(params![id.to_string()], row_to_sale)
        .optional()?;
    Ok(row)
}

fn list_lines_by_sale(conn: &Connection, sale_id: &Uuid) -> AppResult<Vec<SaleLine>> {
    let mut stmt = conn.prepare(
        "SELECT id, sale_id, quantity, unit_price_cents, line_total_cents \
         FROM sale_line WHERE sale_id = ?1 \
         ORDER BY id ASC",
    )?;
    let rows = stmt.query_map(params![sale_id.to_string()], row_to_sale_line)?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r?);
    }
    Ok(out)
}

fn row_to_sale(row: &Row<'_>) -> rusqlite::Result<Sale> {
    let id_str: String = row.get("id")?;
    let cs_str: String = row.get("cash_session_id")?;
    let offer_str: Option<String> = row.get("offer_id")?;
    let created_at_str: String = row.get("created_at")?;
    let total: i64 = row.get("total_amount_cents")?;
    let id = Uuid::parse_str(&id_str).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e))
    })?;
    let cash_session_id = Uuid::parse_str(&cs_str).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(1, rusqlite::types::Type::Text, Box::new(e))
    })?;
    let offer_id = match offer_str {
        Some(s) => Some(Uuid::parse_str(&s).map_err(|e| {
            rusqlite::Error::FromSqlConversionFailure(2, rusqlite::types::Type::Text, Box::new(e))
        })?),
        None => None,
    };
    let created_at = DateTime::parse_from_rfc3339(&created_at_str)
        .map_err(|e| {
            rusqlite::Error::FromSqlConversionFailure(3, rusqlite::types::Type::Text, Box::new(e))
        })?
        .with_timezone(&Utc);
    Ok(Sale {
        id,
        cash_session_id,
        offer_id,
        created_at,
        total_amount_cents: total,
    })
}

fn row_to_sale_line(row: &Row<'_>) -> rusqlite::Result<SaleLine> {
    let id_str: String = row.get("id")?;
    let sale_str: String = row.get("sale_id")?;
    let quantity: i64 = row.get("quantity")?;
    let unit_price: i64 = row.get("unit_price_cents")?;
    let line_total: i64 = row.get("line_total_cents")?;
    let id = Uuid::parse_str(&id_str).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e))
    })?;
    let sale_id = Uuid::parse_str(&sale_str).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(1, rusqlite::types::Type::Text, Box::new(e))
    })?;
    Ok(SaleLine {
        id,
        sale_id,
        quantity: quantity as u32,
        unit_price_cents: unit_price,
        line_total_cents: line_total,
    })
}

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

fn map_db_err(e: rusqlite::Error) -> AppError {
    if let rusqlite::Error::SqliteFailure(err, _) = &e {
        if err.code == rusqlite::ErrorCode::ConstraintViolation {
            return AppError::ConstraintViolation(e.to_string());
        }
    }
    AppError::Database(e)
}