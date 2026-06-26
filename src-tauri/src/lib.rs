// ============================================================
// lib.rs — runtime Tauri de FeriaNet.
// ============================================================
// Composicion del builder:
//   1. tracing-subscriber (logs estructurados).
//   2. Apertura del pool SQLite (WAL + foreign_keys + migraciones).
//   3. Registro de AppState.
//   4. Registro de commands por modulo.
//   5. Plugin opener (incluido por el scaffold; util para abrir
//      docs externos desde la app si la UI lo necesita).
// ============================================================

mod commands;
mod db;
mod domain;
mod errors;
mod state;

use std::path::PathBuf;
use std::sync::Arc;

use tauri::Manager;
use tracing_subscriber::{fmt, EnvFilter};

use crate::commands::{attractions as cmd_attractions, fairs as cmd_fairs};
use crate::db::DbPool;
use crate::state::AppState;

/// Resuelve la ruta del archivo SQLite local.
///
/// Por defecto: `<app_data_dir>/feria-net.db`. El directorio
/// `app_data_dir` lo asigna Tauri segun SO:
/// - Windows: `%APPDATA%\com.ferianet.app\`
/// - macOS:   `~/Library/Application Support/com.ferianet.app/`
/// - Linux:   `~/.local/share/com.ferianet.app/`
fn resolve_db_path(app: &tauri::AppHandle) -> PathBuf {
    let base = app
        .path()
        .app_data_dir()
        .expect("app_data_dir deberia estar disponible en runtime");
    base.join("feria-net.db")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 1. Tracing. Nivel por defecto `info`; se puede subir con
    //    `RUST_LOG=feria_net_lib=debug` en el entorno.
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info,feria_net_lib=debug"));
    fmt().with_env_filter(filter).with_target(false).init();

    // 2-5. Builder.
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // 2. Abrir la BD.
            let db_path = resolve_db_path(&app.handle());
            tracing::info!("Abriendo base de datos en {}", db_path.display());
            let pool = DbPool::open(&db_path).map_err(|e| {
                tracing::error!("Fallo al abrir la base de datos: {}", e);
                e
            })?;

            // 3. Registrar AppState.
            app.manage(AppState { db: Arc::new(pool) });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Ferias
            cmd_fairs::create_fair,
            cmd_fairs::list_fairs,
            cmd_fairs::get_fair,
            cmd_fairs::update_fair,
            cmd_fairs::delete_fair,
            cmd_fairs::suggest_fair_by_name,
            // Atracciones
            cmd_attractions::create_attraction,
            cmd_attractions::list_attractions_by_edition,
            cmd_attractions::update_attraction,
            cmd_attractions::soft_delete_attraction,
        ])
        .run(tauri::generate_context!())
        .expect("error al ejecutar la aplicacion Tauri");
}
