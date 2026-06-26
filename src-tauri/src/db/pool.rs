//! Pool de conexiones SQLite.
//!
//! Decisiones de v1 (epoca 1, escala feriante):
//! - **1 conexion de escritura** + N lectores. SQLite serializa
//!   escritores de forma nativa; con WAL activo, los lectores
//!   no se bloquean entre si ni con el escritor.
//! - En esta version mantenemos **un unico `Mutex<Connection>`**
//!   que sirve tanto para lectura como escritura. Para el volumen
//!   de v1 (<1000 ventas/dia por feriante) es suficiente y elimina
//!   la complejidad de coordinar varios Mutex.
//! - WAL + foreign_keys ON + busy_timeout se aplican al abrir.
//! - Las migraciones se aplican una vez al primer arranque.
//!
//! Si en el futuro aparece un cuello de botella verosimil en
//! lectura concurrente, se sustituye por un pool real sin tocar
//! los repositorios (solo `pool.rs` cambia).

use std::path::Path;

use rusqlite::Connection;
use rusqlite_migration::{Migrations, M};
use tokio::sync::Mutex;
use tracing::info;

use crate::db::migrations::MIGRATIONS;
use crate::errors::AppResult;

/// Pool simple: una conexion compartida, protegida por Mutex.
pub struct DbPool {
    conn: Mutex<Connection>,
}

impl DbPool {
    /// Abre (o crea) la base de datos en `db_path` y aplica las
    /// migraciones pendientes.
    pub fn open(db_path: &Path) -> AppResult<Self> {
        if let Some(parent) = db_path.parent() {
            // Asegurar que el directorio existe. Si falla, el error
            // se propaga como AppError::Database desde rusqlite.
            std::fs::create_dir_all(parent).map_err(|e| {
                crate::errors::AppError::Internal(format!(
                    "no se pudo crear el directorio de la BD {}: {}",
                    parent.display(),
                    e
                ))
            })?;
        }

        let mut conn = Connection::open(db_path)?;

        // PRAGMAs criticos (orden importa).
        // - WAL: lecturas y escrituras no se bloquean entre si.
        // - foreign_keys: SQLite NO las activa por defecto; sin esto,
        //   ON DELETE RESTRICT no se enforce y la integridad se rompe.
        // - busy_timeout: 5s de espera ante un conflicto de escritura.
        conn.pragma_update(None, "journal_mode", "WAL")?;
        conn.pragma_update(None, "foreign_keys", "ON")?;
        conn.pragma_update(None, "busy_timeout", 5000)?;
        // synchronous=NORMAL es el default recomendado con WAL.
        // Lo dejamos explicito para que sea visible en el codigo.
        conn.pragma_update(None, "synchronous", "NORMAL")?;

        info!(
            "SQLite abierto en {} con WAL, foreign_keys=ON, busy_timeout=5s",
            db_path.display()
        );

        // Construir la lista de migraciones para rusqlite_migration.
        // Solo `up` en v1: el rollback es futuro (post-MVP) y la
        // SSOT no obliga a soportarlo.
        // En rusqlite_migration 2.x, M::up solo toma el SQL; la
        // libreria identifica la version por la posicion en el array
        // y la persiste via PRAGMA user_version.
        let migrations = Migrations::from_iter(
            MIGRATIONS.iter().map(|sql| M::up(*sql)),
        );

        // Aplicar migraciones. `to_latest` corre todas las pendientes
        // hasta la ultima version. En 2.x toma &mut Connection.
        migrations
            .to_latest(&mut conn)
            .map_err(|e| crate::errors::AppError::Internal(format!(
                "fallo al aplicar migraciones: {}",
                e
            )))?;

        info!("Migraciones aplicadas correctamente");

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    /// Adquiere el mutex de la conexion para lectura o escritura.
    ///
    /// Los repositorios llaman a esto; el caller es responsable de
    /// liberar el guard al salir del ambito.
    pub async fn conn(&self) -> tokio::sync::MutexGuard<'_, Connection> {
        self.conn.lock().await
    }
}
