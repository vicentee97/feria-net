//! Tipos de dominio para informes (epica 4).
//!
//! Los informes son proyecciones de solo lectura sobre los datos ya
//! persistidos en el TPV local (ferias, ediciones, atracciones,
//! cajas, ventas, lineas, tickets). Este modulo define las
//! estructuras que se devuelven al frontend desde los commands
//! Tauri de la capa `commands::reports`.
//!
//! Decisiones de diseno:
//! - **Totales siempre en centimos (`i64`).** Mismo criterio que el
//!   resto del dominio (V001/V003). La conversion a euros ocurre en
//!   la capa de presentacion.
//! - **Fechas como `NaiveDate`** (no `DateTime<Utc>`). Los informes
//!   se indexan por dia local del operador, no por timestamp.
//! - **Atracciones soft-deleted (`is_active = 0`) NO aparecen.**
//!   Coherente con el resto de listados operativos del proyecto.
//!   Si el operador reactiva una atraccion, vuelve a aparecer.
//! - **Estructuras `Serialize`** para que Tauri las pueda enviar al
//!   frontend sin conversion adicional.
//!
//! Ver `docs/TODO.md` epica 4 (Informes v1).

use chrono::NaiveDate;
use serde::Serialize;
use uuid::Uuid;

/// Totales agregados compartidos por todas las proyecciones de informe.
///
/// Una atraccion, un dia o una feria exponen este mismo trio:
/// ventas registradas, tickets vendidos e importe total cobrado.
#[derive(Debug, Clone, Default, Serialize, PartialEq, Eq)]
pub struct ReportTotals {
    /// Numero de ventas registradas.
    pub total_sales: u32,
    /// Numero de tickets vendidos (suma de `sale_line.quantity`).
    pub total_tickets: u32,
    /// Importe total cobrado en centimos. Con oferta aplicada
    /// coincide con `offer.bundle_price_cents` por venta.
    pub total_amount_cents: i64,
}

/// Una atraccion dentro de un informe, con sus totales.
///
/// Es el mismo struct tanto para `DailyReport.attractions` como para
/// `FeriaReport.by_attraction`: la "fila" de atraccion es la misma.
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct AttractionReport {
    pub attraction_id: Uuid,
    pub attraction_name: String,
    /// Color identificativo en formato hex `#RRGGBB`.
    pub attraction_color: String,
    pub totals: ReportTotals,
}

/// Un dia concreto dentro de un informe por feria.
///
/// `attractions` lista las atracciones operadas en ese dia, con sus
/// totales. Los totales del propio dia (`totals`) son la suma de
/// todas las atracciones operadas ese dia.
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct DayReport {
    /// Fecha local del operador (`YYYY-MM-DD`).
    pub date: NaiveDate,
    pub totals: ReportTotals,
    pub attractions: Vec<AttractionReport>,
}

/// Informe por dia: totales por atraccion + total general del dia.
///
/// Una sola fecha sobre una sola edicion. Las atracciones sin
/// ventas en ese dia aparecen con totales a 0 (no se omiten).
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct DailyReport {
    pub edition_id: Uuid,
    pub edition_year: i32,
    pub fair_id: Uuid,
    pub fair_name: String,
    pub date: NaiveDate,
    pub totals: ReportTotals,
    pub attractions: Vec<AttractionReport>,
}

/// Informe por feria: totales agregados de una edicion sobre un
/// rango de fechas.
///
/// `days` solo incluye los dias en los que hubo caja abierta
/// (es decir, donde hubo operacion). Los dias sin caja no aparecen:
/// un "informe por feria" lista dias operados, no el calendario
/// completo. `by_attraction` agrega por atraccion en todo el rango,
/// incluyendo las que no tuvieron ventas.
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct FeriaReport {
    pub edition_id: Uuid,
    pub edition_year: i32,
    pub fair_id: Uuid,
    pub fair_name: String,
    /// Inicio del rango solicitado (inclusivo). `YYYY-MM-DD`.
    pub from_date: NaiveDate,
    /// Fin del rango solicitado (inclusivo). `YYYY-MM-DD`.
    pub to_date: NaiveDate,
    pub totals: ReportTotals,
    /// Dias operados dentro del rango, ordenados cronologicamente.
    pub days: Vec<DayReport>,
    /// Agregado por atraccion en todo el rango (incluye
    /// atracciones sin ventas con totales a 0).
    pub by_attraction: Vec<AttractionReport>,
}

/// Una edicion anual dentro de un informe comparativo interanual.
///
/// `days_count` cuenta dias unicos con caja abierta en esa edicion.
/// `avg_daily_amount_cents` es el importe medio por dia operado
/// (`total_amount_cents / days_count`), o 0 si no hubo dias
/// operados (division segura).
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct ComparativeEdition {
    pub edition_id: Uuid,
    pub year: i32,
    /// Inicio del periodo operativo declarado de la edicion.
    pub start_date: NaiveDate,
    /// Fin del periodo operativo declarado de la edicion.
    pub end_date: NaiveDate,
    pub totals: ReportTotals,
    /// Numero de dias unicos en los que se abrio caja.
    pub days_count: u32,
    /// Importe medio por dia operado (centimos).
    pub avg_daily_amount_cents: i64,
}

/// Comparativa interanual: todas las ediciones de la misma feria.
///
/// La lista `editions` viene ordenada por `year` ascendente para
/// que la UI muestre la linea temporal natural.
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct ComparativeReport {
    pub fair_id: Uuid,
    pub fair_name: String,
    /// Ediciones de la feria, ordenadas por año ascendente.
    /// Una edicion sin ventas aparece con totales a 0 y
    /// `days_count = 0`.
    pub editions: Vec<ComparativeEdition>,
}