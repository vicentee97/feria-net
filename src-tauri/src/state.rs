//! Estado compartido de la aplicacion Tauri.
//!
//! Contiene el pool SQLite y el `DeliveryRegistry`. Se inyecta a
//! los commands via `tauri::State<AppState>`.

use std::sync::Arc;

use crate::db::DbPool;
use crate::delivery::DeliveryRegistry;

/// Estado global de la aplicacion.
///
/// Se construye una vez al arrancar Tauri y se comparte via
/// `app.manage(AppState { ... })`. Los commands lo reciben con
/// `tauri::State<AppState>`.
pub struct AppState {
    /// Pool de conexiones SQLite (1 escritor + lectores).
    pub db: Arc<DbPool>,

    /// Registry del modulo `ticket-delivery`. Comparte el backend
    /// activo entre los commands de delivery y la UI. El backend
    /// concreto (termica / file / noop) se elige en arranque por
    /// auto-deteccion (ver `delivery::registry`).
    pub delivery: Arc<DeliveryRegistry>,
}

impl AppState {
    /// Constructor util para tests / scripts. En el flujo normal
    /// de Tauri el estado se construye inline en `lib.rs::run`.
    #[allow(dead_code)] // Reservado para tests / scripts futuros.
    pub fn new(db: DbPool, delivery: Arc<DeliveryRegistry>) -> Self {
        Self {
            db: Arc::new(db),
            delivery,
        }
    }
}
