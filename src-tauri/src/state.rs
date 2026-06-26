//! Estado compartido de la aplicacion Tauri.
//!
//! Contiene el pool SQLite y se inyecta a los commands via
//! `tauri::State<AppState>`.

use std::sync::Arc;

use crate::db::DbPool;

/// Estado global de la aplicacion.
///
/// Se construye una vez al arrancar Tauri y se comparte via
/// `app.manage(AppState { ... })`. Los commands lo reciben con
/// `tauri::State<AppState>`.
pub struct AppState {
    /// Pool de conexiones SQLite (1 escritor + lectores).
    pub db: Arc<DbPool>,
}
