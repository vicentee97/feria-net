//! Repositorios: acceso tipado a las entidades de dominio.
//!
//! Cada modulo contiene funciones CRUD sobre una entidad concreta.
//! Las funciones reciben `&mut Connection` (no el pool) para que
//! el caller pueda controlar la transaccion cuando una operacion
//! toca mas de una tabla.

pub mod attractions;
pub mod fairs;
