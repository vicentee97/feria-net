//! Modulo `ticket-delivery` (epica 3).
//!
//! Abstraccion intercambiable para la entrega fisica de tickets.
//! La SSOT §2 obliga a que la venta NUNCA se acople a un tipo de
//! entrega concreto; este modulo es la frontera entre la logica de
//! venta y el hardware (impresora termica, RFID futuro, depuracion).
//!
//! Pieza:
//! - `backend`: trait `DeliveryBackend` + `DeliveryError`. Contrato
//!   que toda implementacion cumple.
//! - `noop`: `NoOpDelivery` (tests, modo "sin hardware").
//! - `file`: `FileDelivery` (escribe a archivo; depuracion).
//! - `thermal`: `ThermalPrinterDelivery` (ESC/POS sobre USB nativo
//!   de Windows via `escpos::driver::WindowsUsbPrintDriver`).
//! - `registry`: `DeliveryRegistry` con auto-deteccion por variables
//!   de entorno y fallback a `NoOpDelivery`.
//! - `format`: helpers para construir el payload segun el backend
//!   (ESC/POS para termica, texto plano para file).
//! - `tests`: pruebas de sustitucion que demuestran que la logica
//!   de venta no se acopla a un backend concreto (SSOT §2).
//!
//! El modulo es **agnostico a Tauri y a la BD**: se inyecta desde
//! `state::AppState` y se consume desde `commands::delivery`. Asi
//! se puede testear de forma aislada y se puede sustituir en
//! runtime sin tocar la venta.

pub mod backend;
pub mod file;
pub mod format;
pub mod noop;
pub mod registry;
pub mod thermal;

#[cfg(test)]
mod tests;

pub use backend::{DeliveryBackend, DeliveryError};
pub use file::FileDelivery;
pub use noop::NoOpDelivery;
pub use registry::DeliveryRegistry;
pub use thermal::ThermalPrinterDelivery;
