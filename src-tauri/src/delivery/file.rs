//! `FileDelivery`: backend de depuracion que escribe el payload a
//! un archivo.
//!
//! Usos:
//! - **Depuracion** en desarrollo: ver que bytes ESC/POS se
//!   generan y comprobar el formato del ticket sin hardware.
//! - **Tests de sustitucion** (ver `tests.rs`): demuestra que el
//!   formato del payload no depende del backend.
//!
//! Reglas:
//! - `output_dir` se crea si no existe al instanciar.
//! - El nombre del archivo es `ticket-<ticket_id>.txt` (el
//!   `ticket_id` se sanea de barras y caracteres de path traversal).
//! - Si el directorio desaparece entre instanciacion y entrega,
//!   `health_check` y `deliver` devuelven un error clasificado.

use std::path::{Path, PathBuf};

use async_trait::async_trait;

use crate::delivery::backend::{DeliveryBackend, DeliveryError};
use crate::domain::ticket_delivery_attempt::DeliveryKind;

/// `DeliveryBackend` que escribe el payload de cada ticket a un
/// archivo en `output_dir`. Pensado solo para depuracion.
pub struct FileDelivery {
    output_dir: PathBuf,
}

impl FileDelivery {
    /// Crea un `FileDelivery` que escribe tickets a `output_dir`.
    /// Si el directorio no existe, lo crea. Falla con
    /// `DeliveryError::Internal` si no se puede crear.
    pub fn new(output_dir: impl Into<PathBuf>) -> Result<Self, DeliveryError> {
        let dir = output_dir.into();
        std::fs::create_dir_all(&dir).map_err(|e| {
            DeliveryError::Internal(format!(
                "no se pudo crear el directorio {}: {}",
                dir.display(),
                e
            ))
        })?;
        Ok(Self { output_dir: dir })
    }

    /// Devuelve la ruta del directorio de salida. Solo para
    /// inspeccion / tests; no es parte del contrato.
    pub fn output_dir(&self) -> &Path {
        &self.output_dir
    }

    /// Construye la ruta del archivo para un `ticket_id` concreto.
    /// Logica aislada para que los tests puedan verificar el
    /// naming sin tener que entregar nada.
    fn path_for(&self, ticket_id: &str) -> PathBuf {
        // Saneamiento defensivo: aunque el `ticket_id` viene de un
        // UUID generado por nosotros, nos protegemos contra
        // caracteres que pudieran colarse si en el futuro el id
        // viene de input externo. Esto previene path traversal
        // ("../../etc/passwd") incluso en depuracion.
        let safe_id: String = ticket_id
            .chars()
            .map(|c| if c.is_ascii_alphanumeric() || c == '-' { c } else { '_' })
            .collect();
        self.output_dir.join(format!("ticket-{}.txt", safe_id))
    }
}

#[async_trait]
impl DeliveryBackend for FileDelivery {
    fn kind(&self) -> DeliveryKind {
        DeliveryKind::File
    }

    async fn list_devices(&self) -> Result<Vec<String>, DeliveryError> {
        Ok(vec![format!("Archivo: {}", self.output_dir.display())])
    }

    async fn health_check(&self) -> Result<(), DeliveryError> {
        if !self.output_dir.exists() {
            return Err(DeliveryError::DeviceUnavailable(format!(
                "el directorio de salida no existe: {}",
                self.output_dir.display()
            )));
        }
        if !self.output_dir.is_dir() {
            return Err(DeliveryError::DeviceUnavailable(format!(
                "la ruta de salida no es un directorio: {}",
                self.output_dir.display()
            )));
        }
        Ok(())
    }

    async fn deliver(&self, ticket_id: &str, payload: &[u8]) -> Result<(), DeliveryError> {
        let path = self.path_for(ticket_id);
        std::fs::write(&path, payload).map_err(|e| {
            DeliveryError::Internal(format!(
                "no se pudo escribir el ticket en {}: {}",
                path.display(),
                e
            ))
        })?;
        Ok(())
    }
}
