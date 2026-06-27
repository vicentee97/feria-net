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
// Los enums y struct de `ticket_delivery_attempt` se mantienen en
// el modulo pero no se re-exportan todavia: la epica 3 los
// necesitara cuando implemente el modulo de impresion. Por ahora
// la epica 2 solo escribe placeholders via SQL crudo desde el
// repositorio `sales.rs`.