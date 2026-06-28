//! Commands Tauri expuestos al frontend.
//!
//! Cada modulo agrupa los commands de una familia funcional.
//! La capa de commands es DELGADA: valida entrada minima, llama
//! al repositorio y devuelve el resultado. Logica de negocio
//! vive en los repositorios.

pub mod attractions;
pub mod cash_sessions;
pub mod delivery;
pub mod editions;
pub mod fairs;
pub mod offers;
pub mod reports;
pub mod sales;