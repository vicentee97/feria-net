//! Tipos de dominio.
//!
//! Cada modulo contiene las entidades puras del modelo, sin
//! dependencias de Tauri ni de rusqlite. Solo `serde` + tipos
//! estandar + tipos del propio dominio (`uuid`, `chrono`).

pub mod attraction;
pub mod cash_session;
pub mod fair;
pub mod fair_edition;
pub mod offer;
pub mod report;
pub mod sale;
pub mod sale_line;
pub mod ticket;
pub mod ticket_delivery_attempt;

pub use attraction::Attraction;
pub use cash_session::CashSession;
pub use fair::Fair;
pub use fair_edition::{FairEdition, FairEditionStatus};
pub use offer::Offer;
pub use sale::Sale;
pub use sale_line::SaleLine;
pub use ticket::Ticket;
// Tipos del modulo `report` (epica 4). Re-exportados para que
// `commands::reports` y `db::repository::reports` puedan hacer
// `use crate::domain::report::{DailyReport, ...}` directamente.
pub use report::{
    AttractionReport, ComparativeEdition, ComparativeReport, DailyReport, DayReport,
    FeriaReport, ReportTotals,
};
// Enums y struct de `ticket_delivery_attempt` re-exportados
// desde la epica 3 (TEAM-012): el modulo `ticket-delivery` los
// consume directamente, y el repositorio
// `repository::delivery_attempts` los usa para mapear filas.
pub use ticket_delivery_attempt::{
    DeliveryErrorCode, DeliveryKind, DeliveryOutcome, TicketDeliveryAttempt,
};