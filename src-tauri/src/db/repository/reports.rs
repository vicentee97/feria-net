//! Repositorio de informes (epica 4).
//!
//! Construye las tres proyecciones del MVP sobre los datos ya
//! persistidos por las epicAs 1-3:
//! - `get_daily_report`: una edicion, una fecha.
//! - `get_feria_report`: una edicion, un rango de fechas.
//! - `get_comparative_report`: una feria, todas sus ediciones.
//!
//! Convenciones de consulta (alineadas con `docs/TODO.md` epica 4):
//! - **Atracciones soft-deleted (`is_active = 0`) NO aparecen**.
//!   Coherente con el resto de listados operativos.
//! - **LEFT JOIN desde `attraction` / `fair_edition`** para que
//!   entidades sin ventas aparezcan con totales a 0 (no se omiten).
//! - **Importes y tickets siempre via `sale.total_amount_cents` y
//!   `sale_line.quantity`.** La CTE `sale_tickets` pre-agrega las
//!   lineas por venta para evitar el cross-product del JOIN
//!   `sale -> sale_line`.
//!
//! Validaciones (en commands Tauri):
//! - `edition_id` y `fair_id` deben existir (commands).
//! - Fechas en formato ISO 8601 `YYYY-MM-DD`.
//! - `from_date <= to_date` en `get_feria_report`.

use chrono::NaiveDate;
use rusqlite::{params, Connection, Row};
use uuid::Uuid;

use crate::domain::report::{
    AttractionReport, ComparativeEdition, ComparativeReport, DailyReport, DayReport,
    FeriaReport, ReportTotals,
};
use crate::domain::{FairEditionStatus, Fair};
use crate::errors::{AppError, AppResult};

/// Formato canonico para fechas locales del operador.
const DATE_FORMAT: &str = "%Y-%m-%d";

// ============================================================
// Query SQL reutilizable
// ============================================================
//
// Cada informe comparte el mismo patron:
//   1. CTE `sale_tickets` que pre-agrega `sale_line` por venta.
//      Asi evitamos que `LEFT JOIN sale_line` multiplique filas
//      cuando una venta tiene varias lineas (el modelo bundle de
//      V003 lo permite).
//   2. JOINs encadenados desde `attraction` (daily, comparative)
//      o `cash_session` (feria por dia) hasta `sale` y `sale_tickets`.
//   3. Agregacion final con `GROUP BY` + `SUM(COALESCE(...))`
//      para que `NULL` en columnas opcionales no descuadre los
//      totales (atribuciones sin caja abierta, etc.).
//
// Las queries son `const &str` para que SQLite pueda prepararlas
// sin reallocaciones en cada llamada.

/// CTE base: tickets por venta. Se antepone a cada informe para
/// neutralizar el cross-product del JOIN `sale -> sale_line`.
///
/// Se concatena con `; ` al final para encadenar tras las CTEs
/// previas que pueda necesitar un informe concreto. Las funciones
/// publicas la usan directamente.
const CTE_SALE_TICKETS: &str = "
    sale_tickets AS (
        SELECT sale_id, SUM(quantity) AS total_tickets
        FROM sale_line
        GROUP BY sale_id
    )
";

// ============================================================
// Helpers privados
// ============================================================

/// Construye un `ReportTotals` desde los valores opcionales que
/// devuelve la query. Si la fila no existe (caso degenerado),
/// devuelve totales a 0.
fn totals_from(
    total_sales: Option<i64>,
    total_tickets: Option<i64>,
    total_amount_cents: Option<i64>,
) -> ReportTotals {
    ReportTotals {
        total_sales: total_sales.unwrap_or(0).max(0) as u32,
        total_tickets: total_tickets.unwrap_or(0).max(0) as u32,
        total_amount_cents: total_amount_cents.unwrap_or(0),
    }
}

/// Suma dos `ReportTotals` componente a componente.
fn add_totals(a: &ReportTotals, b: &ReportTotals) -> ReportTotals {
    ReportTotals {
        total_sales: a.total_sales + b.total_sales,
        total_tickets: a.total_tickets + b.total_tickets,
        total_amount_cents: a.total_amount_cents + b.total_amount_cents,
    }
}

fn empty_totals() -> ReportTotals {
    ReportTotals {
        total_sales: 0,
        total_tickets: 0,
        total_amount_cents: 0,
    }
}

/// Parsea un entero opcional sin signo (`u32`) de SQLite.
///
/// SQLite entrega `i64` para INTEGER. Esta funcion convierte con
/// `as u32` y clampea a 0 si el valor es negativo (no deberia
/// ocurrir en BD pero el cast silencioso puede dar pánicos).
fn parse_u32_opt(v: Option<i64>) -> u32 {
    v.unwrap_or(0).max(0) as u32
}

/// Parsea un `NaiveDate` desde TEXT `YYYY-MM-DD`. Devuelve error
/// de conversion si el formato no encaja.
fn parse_date_str(s: &str) -> rusqlite::Result<NaiveDate> {
    NaiveDate::parse_from_str(s, DATE_FORMAT).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(
            0,
            rusqlite::types::Type::Text,
            Box::new(e),
        )
    })
}

/// Parsea un UUID desde TEXT.
fn parse_uuid_text(s: &str, idx: usize) -> rusqlite::Result<Uuid> {
    Uuid::parse_str(s).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(idx, rusqlite::types::Type::Text, Box::new(e))
    })
}

/// Carga los campos de una `Fair` por id. Devuelve `None` si no
/// existe. Usado para enriquecer la respuesta con `fair_name`.
fn load_fair(conn: &Connection, id: &Uuid) -> AppResult<Option<Fair>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, created_at, notes FROM fair WHERE id = ?1",
    )?;
    let row = stmt
        .query_row(params![id.to_string()], |r| {
            let id_str: String = r.get(0)?;
            let name: String = r.get(1)?;
            let created_at_str: String = r.get(2)?;
            let notes: Option<String> = r.get(3)?;
            let id = parse_uuid_text(&id_str, 0)?;
            let created_at = chrono::DateTime::parse_from_rfc3339(&created_at_str)
                .map_err(|e| {
                    rusqlite::Error::FromSqlConversionFailure(
                        1,
                        rusqlite::types::Type::Text,
                        Box::new(e),
                    )
                })?
                .with_timezone(&chrono::Utc);
            Ok(Fair { id, name, created_at, notes })
        })
        .ok();
    Ok(row)
}

/// Carga los campos de cabecera de una `FairEdition` por id.
/// Devuelve `None` si no existe. Usado para enriquecer el informe
/// diario/por feria con `edition_year` y `fair_id`.
struct EditionHeader {
    fair_id: Uuid,
    year: i32,
    #[allow(dead_code)] // Cargado para diagnosticar filas mal formadas en BD.
    status: FairEditionStatus,
}

fn load_edition_header(conn: &Connection, id: &Uuid) -> AppResult<Option<EditionHeader>> {
    let mut stmt = conn.prepare(
        "SELECT fair_id, year, status FROM fair_edition WHERE id = ?1",
    )?;
    let row = stmt
        .query_row(params![id.to_string()], |r| {
            let fair_id_str: String = r.get(0)?;
            let year: i32 = r.get(1)?;
            let status_str: String = r.get(2)?;
            let fair_id = parse_uuid_text(&fair_id_str, 0)?;
            let status = FairEditionStatus::from_str(&status_str).ok_or_else(|| {
                rusqlite::Error::FromSqlConversionFailure(
                    2,
                    rusqlite::types::Type::Text,
                    Box::from(format!("status desconocido en BD: {}", status_str)),
                )
            })?;
            Ok(EditionHeader { fair_id, year, status })
        })
        .ok();
    Ok(row)
}

// ============================================================
// Informes publicos
// ============================================================

/// Informe por dia: totales por atraccion + total general del dia.
///
/// Una sola fecha (`YYYY-MM-DD`) sobre una sola edicion. Las
/// atracciones activas de la edicion aparecen todas, con totales
/// a 0 si no vendieron ese dia.
pub fn get_daily_report(
    conn: &Connection,
    edition_id: &Uuid,
    date: NaiveDate,
) -> AppResult<DailyReport> {
    let date_str = date.format(DATE_FORMAT).to_string();

    // Cabecera: edicion + feria.
    let edition_header = load_edition_header(conn, edition_id)?
        .ok_or_else(|| AppError::NotFound(
            format!("no existe la edicion con id {}", edition_id)
        ))?;
    let fair = load_fair(conn, &edition_header.fair_id)?
        .ok_or_else(|| AppError::NotFound(
            format!("no existe la feria con id {}", edition_header.fair_id)
        ))?;

    // Query: una fila por atraccion activa de la edicion, con
    // totales agregados del dia. LEFT JOIN desde `attraction` para
    // incluir atracciones sin caja abierta en ese dia.
    let sql = format!(
        "WITH {} \
         SELECT a.id, a.name, a.color, \
                COUNT(DISTINCT s.id) AS total_sales, \
                COALESCE(SUM(s.total_amount_cents), 0) AS total_amount_cents, \
                COALESCE(SUM(COALESCE(st.total_tickets, 0)), 0) AS total_tickets \
         FROM attraction a \
         LEFT JOIN cash_session cs \
            ON cs.attraction_id = a.id AND cs.date = ?2 \
         LEFT JOIN sale s ON s.cash_session_id = cs.id \
         LEFT JOIN sale_tickets st ON st.sale_id = s.id \
         WHERE a.fair_edition_id = ?1 AND a.is_active = 1 \
         GROUP BY a.id, a.name, a.color \
         ORDER BY a.name COLLATE NOCASE ASC",
        CTE_SALE_TICKETS
    );

    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map(
        params![edition_id.to_string(), date_str],
        row_to_attraction_report,
    )?;

    let mut attractions: Vec<AttractionReport> = Vec::new();
    for r in rows {
        attractions.push(r?);
    }

    let totals = attractions
        .iter()
        .fold(empty_totals(), |acc, a| add_totals(&acc, &a.totals));

    Ok(DailyReport {
        edition_id: *edition_id,
        edition_year: edition_header.year,
        fair_id: edition_header.fair_id,
        fair_name: fair.name,
        date,
        totals,
        attractions,
    })
}

/// Informe por feria: totales agregados de una edicion sobre un
/// rango de fechas.
///
/// Dos vistas:
/// - `days`: dias operados dentro del rango, con totales por
///   atraccion. Solo aparecen dias con caja abierta.
/// - `by_attraction`: agregado por atraccion en todo el rango,
///   incluyendo las que no tuvieron ventas.
///
/// `from_date` y `to_date` son inclusivos. Si `from_date > to_date`,
/// el caller debe haberlo validado antes (los commands lo hacen).
pub fn get_feria_report(
    conn: &Connection,
    edition_id: &Uuid,
    from_date: NaiveDate,
    to_date: NaiveDate,
) -> AppResult<FeriaReport> {
    let from_str = from_date.format(DATE_FORMAT).to_string();
    let to_str = to_date.format(DATE_FORMAT).to_string();

    let edition_header = load_edition_header(conn, edition_id)?
        .ok_or_else(|| AppError::NotFound(
            format!("no existe la edicion con id {}", edition_id)
        ))?;
    let fair = load_fair(conn, &edition_header.fair_id)?
        .ok_or_else(|| AppError::NotFound(
            format!("no existe la feria con id {}", edition_header.fair_id)
        ))?;

    // Query 1: una fila por (date, attraction) con totales del dia.
    // JOIN desde `cash_session` para que `cs.date` siempre tenga
    // valor. Las atracciones sin caja abierta en ese dia no aparecen
    // (porque no hubo operacion). Las atracciones activas se
    // restringen con `a.is_active = 1`.
    let sql_days = format!(
        "WITH {} \
         SELECT cs.date AS date, a.id AS attraction_id, a.name AS attraction_name, \
                a.color AS attraction_color, \
                COUNT(DISTINCT s.id) AS total_sales, \
                COALESCE(SUM(s.total_amount_cents), 0) AS total_amount_cents, \
                COALESCE(SUM(COALESCE(st.total_tickets, 0)), 0) AS total_tickets \
         FROM cash_session cs \
         JOIN attraction a ON cs.attraction_id = a.id AND a.is_active = 1 \
         LEFT JOIN sale s ON s.cash_session_id = cs.id \
         LEFT JOIN sale_tickets st ON st.sale_id = s.id \
         WHERE a.fair_edition_id = ?1 AND cs.date BETWEEN ?2 AND ?3 \
         GROUP BY cs.date, a.id, a.name, a.color \
         ORDER BY cs.date ASC, a.name COLLATE NOCASE ASC",
        CTE_SALE_TICKETS
    );

    let mut stmt_days = conn.prepare(&sql_days)?;
    let rows_days = stmt_days.query_map(
        params![edition_id.to_string(), from_str, to_str],
        row_to_day_attraction_row,
    )?;

    // Agrupamos las filas por fecha en Rust para construir `Vec<DayReport>`.
    let mut days: Vec<DayReport> = Vec::new();
    let mut current_date: Option<NaiveDate> = None;
    let mut current_attractions: Vec<AttractionReport> = Vec::new();
    let mut current_totals: ReportTotals = empty_totals();

    for row in rows_days {
        let r = row?;
        if current_date != Some(r.date) {
            // Cambio de dia: flush del anterior si existe.
            if let Some(d) = current_date {
                days.push(DayReport {
                    date: d,
                    totals: std::mem::take(&mut current_totals),
                    attractions: std::mem::take(&mut current_attractions),
                });
            }
            current_date = Some(r.date);
            current_totals = empty_totals();
        }
        current_totals = add_totals(&current_totals, &r.attraction.totals);
        current_attractions.push(r.attraction);
    }
    // Flush del ultimo dia.
    if let Some(d) = current_date {
        days.push(DayReport {
            date: d,
            totals: current_totals,
            attractions: current_attractions,
        });
    }

    // Query 2: agregado por atraccion en todo el rango. LEFT JOIN
    // desde `attraction` para incluir atracciones sin caja abierta.
    let sql_by_attr = format!(
        "WITH {} \
         SELECT a.id, a.name, a.color, \
                COUNT(DISTINCT s.id) AS total_sales, \
                COALESCE(SUM(s.total_amount_cents), 0) AS total_amount_cents, \
                COALESCE(SUM(COALESCE(st.total_tickets, 0)), 0) AS total_tickets \
         FROM attraction a \
         LEFT JOIN cash_session cs \
            ON cs.attraction_id = a.id AND cs.date BETWEEN ?2 AND ?3 \
         LEFT JOIN sale s ON s.cash_session_id = cs.id \
         LEFT JOIN sale_tickets st ON st.sale_id = s.id \
         WHERE a.fair_edition_id = ?1 AND a.is_active = 1 \
         GROUP BY a.id, a.name, a.color \
         ORDER BY a.name COLLATE NOCASE ASC",
        CTE_SALE_TICKETS
    );

    let mut stmt_by_attr = conn.prepare(&sql_by_attr)?;
    let rows_by_attr = stmt_by_attr.query_map(
        params![edition_id.to_string(), from_str, to_str],
        row_to_attraction_report,
    )?;

    let mut by_attraction: Vec<AttractionReport> = Vec::new();
    for r in rows_by_attr {
        by_attraction.push(r?);
    }

    // Totales generales del informe = suma de los totales por dia.
    let totals = days
        .iter()
        .fold(empty_totals(), |acc, d| add_totals(&acc, &d.totals));

    Ok(FeriaReport {
        edition_id: *edition_id,
        edition_year: edition_header.year,
        fair_id: edition_header.fair_id,
        fair_name: fair.name,
        from_date,
        to_date,
        totals,
        days,
        by_attraction,
    })
}

/// Comparativa interanual: todas las ediciones de una feria,
/// agrupadas por ano, con totales y promedio diario.
///
/// Una fila por edicion (`FairEdition`). Las ediciones sin
/// atracciones activas o sin ventas aparecen con totales a 0 y
/// `days_count = 0`.
pub fn get_comparative_report(
    conn: &Connection,
    fair_id: &Uuid,
) -> AppResult<ComparativeReport> {
    let fair = load_fair(conn, fair_id)?
        .ok_or_else(|| AppError::NotFound(
            format!("no existe la feria con id {}", fair_id)
        ))?;

    // Query: una fila por edicion. LEFT JOIN desde `fair_edition`
    // para que ediciones sin ventas aparezcan. `attraction.is_active
    // = 1` se respeta (atracciones borradas no cuentan). La CTE
    // `sale_tickets` evita el cross-product del JOIN con `sale_line`.
    //
    // `days_count` cuenta dias unicos con caja abierta para
    // atracciones activas. `avg_daily_amount_cents` se calcula en
    // SQL solo si hay dias; si no, COALESCE a 0 (division por cero
    // segura).
    let sql = format!(
        "WITH {} \
         SELECT fe.id, fe.year, fe.start_date, fe.end_date, \
                COALESCE(sa.total_sales, 0) AS total_sales, \
                COALESCE(sa.total_amount_cents, 0) AS total_amount_cents, \
                COALESCE(ti.total_tickets, 0) AS total_tickets, \
                COALESCE(da.days_count, 0) AS days_count \
         FROM fair_edition fe \
         LEFT JOIN ( \
            SELECT a.fair_edition_id AS edition_id, \
                   COUNT(DISTINCT s.id) AS total_sales, \
                   SUM(s.total_amount_cents) AS total_amount_cents \
            FROM attraction a \
            LEFT JOIN cash_session cs ON cs.attraction_id = a.id \
            LEFT JOIN sale s ON s.cash_session_id = cs.id \
            WHERE a.is_active = 1 \
            GROUP BY a.fair_edition_id \
         ) sa ON sa.edition_id = fe.id \
         LEFT JOIN ( \
            SELECT a.fair_edition_id AS edition_id, \
                   SUM(st.total_tickets) AS total_tickets \
            FROM attraction a \
            LEFT JOIN cash_session cs ON cs.attraction_id = a.id \
            LEFT JOIN sale s ON s.cash_session_id = cs.id \
            LEFT JOIN sale_tickets st ON st.sale_id = s.id \
            WHERE a.is_active = 1 \
            GROUP BY a.fair_edition_id \
         ) ti ON ti.edition_id = fe.id \
         LEFT JOIN ( \
            SELECT a.fair_edition_id AS edition_id, \
                   COUNT(DISTINCT cs.date) AS days_count \
            FROM attraction a \
            LEFT JOIN cash_session cs ON cs.attraction_id = a.id \
            WHERE a.is_active = 1 \
            GROUP BY a.fair_edition_id \
         ) da ON da.edition_id = fe.id \
         WHERE fe.fair_id = ?1 \
         ORDER BY fe.year ASC",
        CTE_SALE_TICKETS
    );

    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map(params![fair_id.to_string()], row_to_comparative_edition)?;

    let mut editions: Vec<ComparativeEdition> = Vec::new();
    for r in rows {
        let mut e = r?;
        // Promedio diario: division segura. Si days_count = 0,
        // promedio es 0 (no se opera division por cero).
        e.avg_daily_amount_cents = if e.days_count > 0 {
            e.totals.total_amount_cents / (e.days_count as i64)
        } else {
            0
        };
        editions.push(e);
    }

    Ok(ComparativeReport {
        fair_id: *fair_id,
        fair_name: fair.name,
        editions,
    })
}

// ============================================================
// Row mappers
// ============================================================

/// Row materializada de un JOIN (date, attraction) del informe por
/// feria. Usada para construir `DayReport` agrupando en Rust.
struct DayAttractionRow {
    date: NaiveDate,
    attraction: AttractionReport,
}

fn row_to_attraction_report(row: &Row<'_>) -> rusqlite::Result<AttractionReport> {
    let id_str: String = row.get(0)?;
    let name: String = row.get(1)?;
    let color: String = row.get(2)?;
    let total_sales: Option<i64> = row.get(3)?;
    let total_amount: Option<i64> = row.get(4)?;
    let total_tickets: Option<i64> = row.get(5)?;

    Ok(AttractionReport {
        attraction_id: parse_uuid_text(&id_str, 0)?,
        attraction_name: name,
        attraction_color: color,
        totals: totals_from(total_sales, total_tickets, total_amount),
    })
}

fn row_to_day_attraction_row(row: &Row<'_>) -> rusqlite::Result<DayAttractionRow> {
    let date_str: String = row.get(0)?;
    let id_str: String = row.get(1)?;
    let name: String = row.get(2)?;
    let color: String = row.get(3)?;
    let total_sales: Option<i64> = row.get(4)?;
    let total_amount: Option<i64> = row.get(5)?;
    let total_tickets: Option<i64> = row.get(6)?;

    Ok(DayAttractionRow {
        date: parse_date_str(&date_str)?,
        attraction: AttractionReport {
            attraction_id: parse_uuid_text(&id_str, 1)?,
            attraction_name: name,
            attraction_color: color,
            totals: totals_from(total_sales, total_tickets, total_amount),
        },
    })
}

fn row_to_comparative_edition(row: &Row<'_>) -> rusqlite::Result<ComparativeEdition> {
    let id_str: String = row.get(0)?;
    let year: i32 = row.get(1)?;
    let start_date_str: String = row.get(2)?;
    let end_date_str: String = row.get(3)?;
    let total_sales: Option<i64> = row.get(4)?;
    let total_amount: Option<i64> = row.get(5)?;
    let total_tickets: Option<i64> = row.get(6)?;
    let days_count: Option<i64> = row.get(7)?;

    Ok(ComparativeEdition {
        edition_id: parse_uuid_text(&id_str, 0)?,
        year,
        start_date: parse_date_str(&start_date_str)?,
        end_date: parse_date_str(&end_date_str)?,
        totals: totals_from(total_sales, total_tickets, total_amount),
        days_count: parse_u32_opt(days_count),
        // Se recalcula en la funcion publica para mantener division
        // segura centralizada.
        avg_daily_amount_cents: 0,
    })
}

// ============================================================
// Tests de integracion
// ============================================================

#[cfg(test)]
mod tests {
    //! Tests de las queries agregadas sobre una BD in-memory con
    //! las migraciones reales aplicadas.
    //!
    //! Estrategia: cada test abre su propia `Connection::open_in_memory`,
    //! aplica V001-V003, y siembra los datos minimos necesarios para
    //! el caso. No se usa `DbPool` para evitar acoplar los tests al
    //! runtime Tauri.

    use super::*;
    use crate::db::migrations::MIGRATIONS;
    use crate::db::repository::{
        attractions as repo_attractions, cash_sessions as repo_cash,
        editions as repo_editions, fairs as repo_fairs, sales as repo_sales,
    };
    use crate::db::repository::sales::{CreateSaleInput, CreateSaleLineInput};
    use crate::domain::FairEditionStatus;

    use rusqlite_migration::{Migrations, M};

    /// Abre BD in-memory con todas las migraciones aplicadas.
    fn open_test_db() -> Connection {
        let mut conn = Connection::open_in_memory().expect("open_in_memory");
        let migrations = Migrations::from_iter(MIGRATIONS.iter().map(|sql| M::up(*sql)));
        migrations
            .to_latest(&mut conn)
            .expect("aplicar migraciones");
        conn
    }

    /// Crea la cascada minima: Fair -> FairEdition -> 2 Attractions.
    /// Devuelve (fair_id, edition_id, attraction_a_id, attraction_b_id).
    fn seed_fair_edition_attractions(conn: &Connection) -> (Uuid, Uuid, Uuid, Uuid) {
        let fair = repo_fairs::create_fair(conn, "Feria de Pruebas", None).unwrap();
        let edition = repo_editions::create_edition(
            conn,
            &fair.id,
            2026,
            "2026-06-01",
            "2026-06-15",
            FairEditionStatus::Active,
        )
        .unwrap();
        let a = repo_attractions::create_attraction(
            &conn,
            &edition.id,
            "Camas elasticas",
            "#FF8800",
            300,
        )
        .unwrap();
        let b = repo_attractions::create_attraction(
            &conn,
            &edition.id,
            "Tren fantasma",
            "#00AAFF",
            400,
        )
        .unwrap();
        (fair.id, edition.id, a.id, b.id)
    }

    /// Vende 2 tickets de la atraccion A en una caja del `date`.
    fn sell_two_tickets(
        conn: &mut Connection,
        attraction_id: Uuid,
        date: &str,
        unit_price_cents: i64,
    ) {
        let cs = repo_cash::open_cash_session(conn, &attraction_id, date, 0).unwrap();
        let input = CreateSaleInput {
            cash_session_id: cs.id,
            offer_id: None,
            lines: vec![CreateSaleLineInput {
                quantity: 2,
                unit_price_cents,
            }],
        };
        repo_sales::create_sale(conn, &input).unwrap();
        repo_cash::close_cash_session(conn, &cs.id, 0).unwrap();
    }

    #[test]
    fn daily_report_no_sales_returns_zero_totals() {
        let conn = open_test_db();
        let (_fair, edition, _a, _b) = seed_fair_edition_attractions(&conn);
        let date = NaiveDate::from_ymd_opt(2026, 6, 1).unwrap();

        let report = get_daily_report(&conn, &edition, date).unwrap();

        assert_eq!(report.edition_id, edition);
        assert_eq!(report.edition_year, 2026);
        assert_eq!(report.date, date);
        assert_eq!(report.totals.total_sales, 0);
        assert_eq!(report.totals.total_tickets, 0);
        assert_eq!(report.totals.total_amount_cents, 0);
        // Ambas atracciones activas aparecen con totales a 0.
        assert_eq!(report.attractions.len(), 2);
        assert!(
            report.attractions.iter().all(|a| a.totals.total_amount_cents == 0)
        );
    }

    #[test]
    fn daily_report_with_sales_returns_correct_totals() {
        let mut conn = open_test_db();
        let (_fair, edition, a, b) = seed_fair_edition_attractions(&conn);
        let date = NaiveDate::from_ymd_opt(2026, 6, 1).unwrap();
        let date_str = date.format(DATE_FORMAT).to_string();

        // A vende 2 tickets a 3.00 EUR cada uno -> 6.00 EUR.
        sell_two_tickets(&mut conn, a, &date_str, 300);
        // B vende 2 tickets a 4.00 EUR cada uno -> 8.00 EUR.
        sell_two_tickets(&mut conn, b, &date_str, 400);

        let report = get_daily_report(&conn, &edition, date).unwrap();

        // Totales generales: 2 ventas, 4 tickets, 14.00 EUR = 1400 centimos.
        assert_eq!(report.totals.total_sales, 2);
        assert_eq!(report.totals.total_tickets, 4);
        assert_eq!(report.totals.total_amount_cents, 1400);

        // Por atraccion.
        let ar_a = report
            .attractions
            .iter()
            .find(|r| r.attraction_id == a)
            .unwrap();
        assert_eq!(ar_a.totals.total_sales, 1);
        assert_eq!(ar_a.totals.total_tickets, 2);
        assert_eq!(ar_a.totals.total_amount_cents, 600);

        let ar_b = report
            .attractions
            .iter()
            .find(|r| r.attraction_id == b)
            .unwrap();
        assert_eq!(ar_b.totals.total_sales, 1);
        assert_eq!(ar_b.totals.total_tickets, 2);
        assert_eq!(ar_b.totals.total_amount_cents, 800);
    }

    #[test]
    fn daily_report_excludes_soft_deleted_attractions() {
        let mut conn = open_test_db();
        let (_fair, edition, a, b) = seed_fair_edition_attractions(&conn);
        let date = NaiveDate::from_ymd_opt(2026, 6, 1).unwrap();
        let date_str = date.format(DATE_FORMAT).to_string();

        // Soft-delete de la atraccion B antes de vender.
        repo_attractions::soft_delete_attraction(&conn, &b).unwrap();
        // Solo A vende.
        sell_two_tickets(&mut conn, a, &date_str, 300);

        let report = get_daily_report(&conn, &edition, date).unwrap();

        // Solo aparece la atraccion A.
        assert_eq!(report.attractions.len(), 1);
        assert_eq!(report.attractions[0].attraction_id, a);
        // Los totales del informe son solo de A.
        assert_eq!(report.totals.total_amount_cents, 600);
    }

    #[test]
    fn feria_report_empty_range_returns_zero_totals() {
        let conn = open_test_db();
        let (_fair, edition, _a, _b) = seed_fair_edition_attractions(&conn);
        let from = NaiveDate::from_ymd_opt(2026, 6, 1).unwrap();
        let to = NaiveDate::from_ymd_opt(2026, 6, 15).unwrap();

        let report = get_feria_report(&conn, &edition, from, to).unwrap();

        // Sin ventas, ningun dia aparece (no hubo caja abierta).
        assert_eq!(report.days.len(), 0);
        // Pero `by_attraction` lista ambas atracciones con totales 0.
        assert_eq!(report.by_attraction.len(), 2);
        assert!(report.by_attraction.iter().all(|a| a.totals.total_amount_cents == 0));
        assert_eq!(report.totals.total_amount_cents, 0);
    }

    #[test]
    fn feria_report_aggregates_across_days() {
        let mut conn = open_test_db();
        let (_fair, edition, a, b) = seed_fair_edition_attractions(&conn);

        // Dia 1: A vende 2x300, B vende 1x400.
        let cs_a = repo_cash::open_cash_session(&conn, &a, "2026-06-01", 0).unwrap();
        repo_sales::create_sale(
            &mut conn,
            &CreateSaleInput {
                cash_session_id: cs_a.id,
                offer_id: None,
                lines: vec![CreateSaleLineInput { quantity: 2, unit_price_cents: 300 }],
            },
        )
        .unwrap();
        repo_cash::close_cash_session(&mut conn, &cs_a.id, 0).unwrap();

        let cs_b = repo_cash::open_cash_session(&conn, &b, "2026-06-01", 0).unwrap();
        repo_sales::create_sale(
            &mut conn,
            &CreateSaleInput {
                cash_session_id: cs_b.id,
                offer_id: None,
                lines: vec![CreateSaleLineInput { quantity: 1, unit_price_cents: 400 }],
            },
        )
        .unwrap();
        repo_cash::close_cash_session(&mut conn, &cs_b.id, 0).unwrap();

        // Dia 2: A vende 3x300.
        let cs_a2 = repo_cash::open_cash_session(&conn, &a, "2026-06-02", 0).unwrap();
        repo_sales::create_sale(
            &mut conn,
            &CreateSaleInput {
                cash_session_id: cs_a2.id,
                offer_id: None,
                lines: vec![CreateSaleLineInput { quantity: 3, unit_price_cents: 300 }],
            },
        )
        .unwrap();
        repo_cash::close_cash_session(&mut conn, &cs_a2.id, 0).unwrap();

        let report = get_feria_report(
            &conn,
            &edition,
            NaiveDate::from_ymd_opt(2026, 6, 1).unwrap(),
            NaiveDate::from_ymd_opt(2026, 6, 15).unwrap(),
        )
        .unwrap();

        // 2 dias operados.
        assert_eq!(report.days.len(), 2);
        // Totales generales: 3 ventas, 6 tickets, 1900 centimos.
        assert_eq!(report.totals.total_sales, 3);
        assert_eq!(report.totals.total_tickets, 6);
        assert_eq!(report.totals.total_amount_cents, 1900);

        // by_attraction: A=1500, B=400.
        let ar_a = report
            .by_attraction
            .iter()
            .find(|r| r.attraction_id == a)
            .unwrap();
        assert_eq!(ar_a.totals.total_amount_cents, 1500);
        assert_eq!(ar_a.totals.total_tickets, 5);
        let ar_b = report
            .by_attraction
            .iter()
            .find(|r| r.attraction_id == b)
            .unwrap();
        assert_eq!(ar_b.totals.total_amount_cents, 400);
        assert_eq!(ar_b.totals.total_tickets, 1);

        // Verificacion del dia 1: A=600, B=400.
        let day1 = &report.days[0];
        assert_eq!(day1.date, NaiveDate::from_ymd_opt(2026, 6, 1).unwrap());
        assert_eq!(day1.totals.total_amount_cents, 1000);
        // Verificacion del dia 2: solo A=900.
        let day2 = &report.days[1];
        assert_eq!(day2.date, NaiveDate::from_ymd_opt(2026, 6, 2).unwrap());
        assert_eq!(day2.totals.total_amount_cents, 900);
        assert_eq!(day2.attractions.len(), 1);
    }

    #[test]
    fn comparative_report_single_edition_returns_one_row() {
        let mut conn = open_test_db();
        let (_fair, edition, a, _b) = seed_fair_edition_attractions(&conn);
        // Una sola venta.
        sell_two_tickets(
            &mut conn,
            a,
            "2026-06-01",
            300,
        );

        let report = get_comparative_report(&conn, &_fair).unwrap();

        assert_eq!(report.fair_id, _fair);
        assert_eq!(report.editions.len(), 1);
        let e = &report.editions[0];
        assert_eq!(e.edition_id, edition);
        assert_eq!(e.year, 2026);
        assert_eq!(e.totals.total_amount_cents, 600);
        assert_eq!(e.days_count, 1);
        // 600 centimos / 1 dia = 600.
        assert_eq!(e.avg_daily_amount_cents, 600);
    }

    #[test]
    fn comparative_report_multiple_editions_returns_n_rows() {
        let mut conn = open_test_db();
        let (fair, edition_2026, a, _b) = seed_fair_edition_attractions(&conn);

        // Segunda edicion 2027 con sus propias atracciones y ventas.
        let edition_2027 = repo_editions::create_edition(
            &conn,
            &fair,
            2027,
            "2027-06-01",
            "2027-06-10",
            FairEditionStatus::Planned,
        )
        .unwrap();
        let a_2027 = repo_attractions::create_attraction(
            &conn,
            &edition_2027.id,
            "Camas elasticas",
            "#FF8800",
            350,
        )
        .unwrap();
        let _b_2027 = repo_attractions::create_attraction(
            &conn,
            &edition_2027.id,
            "Tren fantasma",
            "#00AAFF",
            450,
        )
        .unwrap();

        // Ventas 2026: A=600, B=0.
        sell_two_tickets(&mut conn, a, "2026-06-01", 300);
        // Ventas 2027: A_2027 vende 3x350.
        let cs = repo_cash::open_cash_session(&conn, &a_2027.id, "2027-06-01", 0).unwrap();
        repo_sales::create_sale(
            &mut conn,
            &CreateSaleInput {
                cash_session_id: cs.id,
                offer_id: None,
                lines: vec![CreateSaleLineInput { quantity: 3, unit_price_cents: 350 }],
            },
        )
        .unwrap();
        repo_cash::close_cash_session(&mut conn, &cs.id, 0).unwrap();

        let report = get_comparative_report(&conn, &fair).unwrap();

        // 2 ediciones, ordenadas por year asc.
        assert_eq!(report.editions.len(), 2);
        assert_eq!(report.editions[0].year, 2026);
        assert_eq!(report.editions[1].year, 2027);

        // 2026: 600 centimos, 1 dia, avg=600.
        let e2026 = &report.editions[0];
        assert_eq!(e2026.edition_id, edition_2026);
        assert_eq!(e2026.totals.total_amount_cents, 600);
        assert_eq!(e2026.days_count, 1);
        assert_eq!(e2026.avg_daily_amount_cents, 600);

        // 2027: 1050 centimos, 1 dia, avg=1050.
        let e2027 = &report.editions[1];
        assert_eq!(e2027.totals.total_amount_cents, 1050);
        assert_eq!(e2027.days_count, 1);
        assert_eq!(e2027.avg_daily_amount_cents, 1050);
    }

    #[test]
    fn comparative_report_edition_without_sales_returns_zero() {
        let conn = open_test_db();
        let (fair, _edition, _a, _b) = seed_fair_edition_attractions(&conn);
        // Sin ventas.

        let report = get_comparative_report(&conn, &fair).unwrap();

        assert_eq!(report.editions.len(), 1);
        let e = &report.editions[0];
        assert_eq!(e.totals.total_sales, 0);
        assert_eq!(e.totals.total_tickets, 0);
        assert_eq!(e.totals.total_amount_cents, 0);
        assert_eq!(e.days_count, 0);
        // Sin dias operados, promedio 0 (division segura).
        assert_eq!(e.avg_daily_amount_cents, 0);
    }

    #[test]
    fn get_daily_report_unknown_edition_returns_not_found() {
        let conn = open_test_db();
        let date = NaiveDate::from_ymd_opt(2026, 6, 1).unwrap();
        let bogus = Uuid::new_v4();
        let result = get_daily_report(&conn, &bogus, date);
        assert!(matches!(result, Err(AppError::NotFound(_))));
    }

    #[test]
    fn get_comparative_report_unknown_fair_returns_not_found() {
        let conn = open_test_db();
        let bogus = Uuid::new_v4();
        let result = get_comparative_report(&conn, &bogus);
        assert!(matches!(result, Err(AppError::NotFound(_))));
    }
}