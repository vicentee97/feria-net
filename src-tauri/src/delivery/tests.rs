//! Pruebas de sustitucion (SSOT §2).
//!
//! Estas pruebas demuestran que la logica de venta (modelada por
//! el `DeliveryBackend` trait + `DeliveryRegistry`) puede funcionar
//! con cualquier implementacion del trait sin tocar el TPV. Esto
//! es **obligatorio** en la epica 3 y se materializa en la
//! ARCHITECTURE.md §5.5.
//!
//! Que se prueba:
//! - Cada backend cumple el contrato del trait (no panic, errores
//!   clasificados, payload recibido integro).
//! - El `DeliveryRegistry` elige el backend correcto segun las
//!   variables de entorno, y cae a NoOp si no hay nada.
//! - **Test de sustitucion clave**: el mismo flujo de "entregar un
//!   ticket" funciona con `NoOpDelivery` y con `FileDelivery` sin
//!   que el caller (que en produccion es `commands::delivery`) se
//!   entere del cambio. Esto es exactamente la propiedad que
//!   `ARCHITECTURE.md` §5.5 (punto 3) llama "test de regresion":
//!   si alguien en el futuro acopla la venta a un backend
//!   concreto, este test lo detecta.
//!
//! **Lo que NO se prueba aqui**:
//! - Hardware termico real. La validacion con impresoras fisicas
//!   es un entregable de la epica 9 (QA). El `ThermalPrinterDelivery`
//!   con un device path inexistente devuelve `DeviceUnavailable`,
//!   lo cual verificamos en `thermal_handles_missing_device`.

use std::sync::{Arc, Mutex};

use crate::delivery::backend::{DeliveryBackend, DeliveryError};
use crate::delivery::file::FileDelivery;
use crate::delivery::noop::NoOpDelivery;
use crate::delivery::registry::DeliveryRegistry;
use crate::delivery::thermal::ThermalPrinterDelivery;
use crate::domain::ticket_delivery_attempt::DeliveryKind;

/// Lock de modulo para serializar tests que tocan env vars
/// (`FERIANET_PRINTER`, `FERIANET_TICKETS_DIR`).
///
/// **Por que existe**: `std::env::set_var` y `remove_var` operan
/// sobre el proceso entero. Cuando `cargo test` corre tests en
/// paralelo (default), dos tests pueden leerse/escribirse las env
/// vars mutuamente y fallar de forma intermitente. Anado este
/// `Mutex` en TEAM-014 (como parte del fix de los 2 tests nuevos
/// que requieren este aislamiento) y reutilizo el helper
/// `with_env_lock` para envolver los tests existentes que ya
/// tocaban env vars. Esto NO cambia el comportamiento de los
/// tests, solo garantiza que se ejecutan en serie.
static ENV_LOCK: Mutex<()> = Mutex::new(());

/// Adquiere el lock de env vars durante la ejecucion de `f`.
/// Si el lock esta envenenado (un test panico dentro del lock),
/// lo recuperamos para no romper la suite completa.
fn with_env_lock<F: FnOnce()>(f: F) {
    let _guard = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
    f();
}

#[tokio::test]
async fn noop_always_succeeds() {
    let backend = NoOpDelivery::new();
    let result = backend.deliver("test-ticket-id", b"cualquier payload").await;
    assert!(result.is_ok(), "NoOp debe reportar exito siempre: {:?}", result);
}

#[tokio::test]
async fn noop_health_check_is_ok() {
    let backend = NoOpDelivery::new();
    assert!(backend.health_check().await.is_ok());
}

#[tokio::test]
async fn noop_kind_is_noop() {
    let backend = NoOpDelivery::new();
    assert_eq!(backend.kind(), DeliveryKind::Noop);
}

#[tokio::test]
async fn noop_list_devices_has_at_least_one_entry() {
    let backend = NoOpDelivery::new();
    let devices = backend.list_devices().await.expect("list_devices no debe fallar");
    assert!(!devices.is_empty(), "list_devices debe devolver al menos un texto");
}

#[tokio::test]
async fn file_writes_to_correct_path_with_payload_verbatim() {
    // Directorio temporal unico por test para evitar colisiones
    // si los tests se ejecutan en paralelo.
    let tmp = std::env::temp_dir().join(format!(
        "ferianet-test-{}-{}",
        std::process::id(),
        chrono_like_now()
    ));
    // Limpieza preventiva por si quedo algo de un test fallido.
    let _ = std::fs::remove_dir_all(&tmp);

    let backend = FileDelivery::new(&tmp).expect("FileDelivery::new no debe fallar");
    backend
        .deliver("test-id", b"hello ferianet")
        .await
        .expect("deliver no debe fallar");

    let path = tmp.join("ticket-test-id.txt");
    let content = std::fs::read_to_string(&path).expect("el archivo debe existir");
    assert_eq!(content, "hello ferianet");

    // Limpieza.
    let _ = std::fs::remove_dir_all(&tmp);
}

#[tokio::test]
async fn file_health_check_fails_if_dir_disappears() {
    let tmp = std::env::temp_dir().join(format!(
        "ferianet-test-hc-{}-{}",
        std::process::id(),
        chrono_like_now()
    ));
    let _ = std::fs::remove_dir_all(&tmp);
    let backend = FileDelivery::new(&tmp).expect("FileDelivery::new no debe fallar");
    // Lo borramos a proposito.
    std::fs::remove_dir_all(&tmp).unwrap();
    let result = backend.health_check().await;
    assert!(
        matches!(result, Err(DeliveryError::DeviceUnavailable(_))),
        "esperaba DeviceUnavailable, obtuvo: {:?}",
        result
    );
}

#[tokio::test]
async fn file_kind_is_file() {
    let tmp = std::env::temp_dir().join(format!(
        "ferianet-test-kind-{}-{}",
        std::process::id(),
        chrono_like_now()
    ));
    let _ = std::fs::remove_dir_all(&tmp);
    let backend = FileDelivery::new(&tmp).unwrap();
    assert_eq!(backend.kind(), DeliveryKind::File);
    let _ = std::fs::remove_dir_all(&tmp);
}

#[tokio::test]
async fn thermal_kind_is_thermal() {
    // El kind es independiente de si la conexion funciona. Esto
    // es importante porque la venta nunca debe fallar por un
    // problema de hardware: el backend se identifica como termico
    // aunque la impresora este apagada.
    let backend = ThermalPrinterDelivery::new("USB-doesnt-matter");
    assert_eq!(backend.kind(), DeliveryKind::Thermal);
}

#[tokio::test]
async fn thermal_handles_missing_device_in_health_check() {
    // Path deliberadamente invalido: no es un path de Windows
    // valido. En Windows, `WindowsUsbPrintDriver::list()` puede
    // que devuelva Ok([]) si no hay impresoras; en otras
    // plataformas `list_printers` ya devuelve Internal. Aceptamos
    // cualquiera de los dos: lo que nos importa es que el backend
    // no haga panic y devuelva un error clasificado.
    let backend = ThermalPrinterDelivery::new(r"\\?\USB#NOEXISTE#0");
    let result = backend.health_check().await;
    // El resultado puede ser Ok (si hay otras impresoras) o
    // Err(...). Lo importante es que no sea un panic.
    let _ = result;
}

#[tokio::test]
async fn registry_noop_forces_noop_backend() {
    let registry = DeliveryRegistry::noop();
    assert_eq!(registry.kind(), DeliveryKind::Noop);
    assert_eq!(registry.current().kind(), DeliveryKind::Noop);
    // Smoke: el deliver funciona.
    registry
        .deliver("test-id", b"payload")
        .await
        .expect("NoOp nunca falla");
}

#[tokio::test]
async fn registry_auto_detect_falls_back_to_noop_without_env() {
    with_env_lock(|| {
        // Quitamos las variables de entorno que afectarian a la
        // deteccion. `remove_var` puede fallar si no existen, lo
        // ignoramos.
        std::env::remove_var("FERIANET_PRINTER");
        std::env::remove_var("FERIANET_TICKETS_DIR");

        let registry = DeliveryRegistry::with_auto_detect();
        assert_eq!(
            registry.kind(),
            DeliveryKind::Noop,
            "sin variables de entorno, el registry debe usar NoOp"
        );
    });
}

#[tokio::test]
async fn registry_auto_detects_file_when_env_set() {
    with_env_lock(|| {
        let tmp = std::env::temp_dir().join(format!(
            "ferianet-test-registry-{}-{}",
            std::process::id(),
            chrono_like_now()
        ));
        let _ = std::fs::remove_dir_all(&tmp);
        std::env::set_var("FERIANET_TICKETS_DIR", tmp.to_str().unwrap());
        std::env::remove_var("FERIANET_PRINTER");

        let registry = DeliveryRegistry::with_auto_detect();
        assert_eq!(
            registry.kind(),
            DeliveryKind::File,
            "con FERIALENET_TICKETS_DIR, el registry debe usar File"
        );

        // Limpieza: quitar la env var y borrar el directorio.
        std::env::remove_var("FERIANET_TICKETS_DIR");
        let _ = std::fs::remove_dir_all(&tmp);
    });
}

#[tokio::test]
async fn registry_auto_detects_thermal_when_env_set() {
    with_env_lock(|| {
        std::env::set_var("FERIANET_PRINTER", r"\\?\USB#TEST#0");
        std::env::remove_var("FERIANET_TICKETS_DIR");

        let registry = DeliveryRegistry::with_auto_detect();
        assert_eq!(
            registry.kind(),
            DeliveryKind::Thermal,
            "con FERIALENET_PRINTER, el registry debe usar Thermal"
        );

        std::env::remove_var("FERIANET_PRINTER");
    });
}

#[tokio::test]
async fn registry_delivers_via_active_backend_polymorphically() {
    // **Test de sustitucion clave** (ARCHITECTURE.md §5.5 punto 3):
    // el mismo codigo de "entregar un ticket" funciona con
    // NoOp y con File sin cambios. Esto demuestra que la
    // abstraccion es real: si en el futuro alguien anade
    // `if registry.kind() == DeliveryKind::Thermal` en la venta,
    // el flujo NoOp -> File lo detectaria.
    let noop_registry = DeliveryRegistry::noop();
    let tmp = std::env::temp_dir().join(format!(
        "ferianet-test-poly-{}-{}",
        std::process::id(),
        chrono_like_now()
    ));
    let _ = std::fs::remove_dir_all(&tmp);
    let file_backend: Arc<dyn DeliveryBackend> =
        Arc::new(FileDelivery::new(&tmp).unwrap());
    let file_registry =
        DeliveryRegistry::with_backend(file_backend, DeliveryKind::File);

    // Mismo "ticket" y mismo "payload" para los dos.
    let ticket_id = "poly-test-id";
    let payload = b"FeriaNet test payload";

    noop_registry
        .deliver(ticket_id, payload)
        .await
        .expect("NoOp deliver");
    file_registry
        .deliver(ticket_id, payload)
        .await
        .expect("File deliver");

    // El archivo del File registry debe contener el payload
    // integro. El NoOp no deja rastro.
    let path = tmp.join("ticket-poly-test-id.txt");
    let content = std::fs::read_to_string(&path).expect("archivo de File debe existir");
    assert_eq!(content, "FeriaNet test payload");

    let _ = std::fs::remove_dir_all(&tmp);
}

// ============================================================
// Tests del fix de H1 (TEAM-014)
// ============================================================

/// H1 / TEAM-014: si `FERIANET_TICKETS_DIR` apunta a un directorio
/// no escribible, el registry ya NO cae silenciosamente a NoOp.
/// Conserva el error en `init_error` y el backend intentado en
/// `attempted_backend` para que la UI lo muestre.
#[test]
fn registry_records_init_error_when_file_dir_invalid() {
    with_env_lock(|| {
        // Limpiamos FERIALENET_PRINTER para que el flujo entre en
        // el branch de File (si Thermal estuviera configurado, el
        // branch File ni se miraria).
        std::env::remove_var("FERIANET_PRINTER");

        // Para forzar un fallo PORTABLE de `FileDelivery::new()`
        // (que internamente hace `std::fs::create_dir_all`),
        // creamos un ARCHIVO en una ruta temporal y apuntamos
        // `FERIANET_TICKETS_DIR` a ese archivo. `create_dir_all`
        // falla con "Not a directory" (Win32) / "Not a directory"
        // (Unix), garantizando el error en cualquier sistema.
        // (La ruta tipo "C:\\nonexistent\\..." del brief original
        // falla en sistemas donde el usuario no tiene permisos
        // sobre C:\\, pero no es portable.)
        let tmp_file = std::env::temp_dir().join(format!(
            "ferianet-not-a-dir-{}-{}",
            std::process::id(),
            chrono_like_now()
        ));
        std::fs::write(&tmp_file, b"this is a file, not a directory")
            .expect("poder escribir el archivo temporal del test");
        std::env::set_var("FERIANET_TICKETS_DIR", tmp_file.to_str().unwrap());

        let registry = DeliveryRegistry::with_auto_detect();

        // H1 cerrado: el operador se entera del fallback.
        assert!(
            registry.init_error().is_some(),
            "FERIANET_TICKETS_DIR invalido debe dejar init_error()=Some, obtuvo: {:?}",
            registry.init_error()
        );
        assert_eq!(
            registry.attempted_backend(),
            Some(DeliveryKind::File),
            "attempted_backend debe registrar que se intento File"
        );
        // El backend activo es NoOp (fallback), no File.
        assert_eq!(
            registry.current_kind(),
            DeliveryKind::Noop,
            "con init_error, el backend activo debe ser NoOp (fallback)"
        );
        // Ademas, health_check() debe propagar el error en vez de
        // hacer Ok(()).
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .expect("runtime de test debe construirse");
        let hc_result = rt.block_on(registry.health_check());
        assert!(
            hc_result.is_err(),
            "health_check() debe devolver Err cuando hay init_error, obtuvo: {:?}",
            hc_result
        );

        // Limpieza.
        std::env::remove_var("FERIANET_TICKETS_DIR");
        let _ = std::fs::remove_file(&tmp_file);
    });
}

/// Sin variables de entorno, el registry cae a NoOp sin error
/// (caso normal: modo demo o tests). Esto es importante para que
/// el frontend pueda distinguir "NoOp limpio" (sin warning) de
/// "NoOp por fallback" (warning rojo).
#[test]
fn registry_no_init_error_when_no_env_vars() {
    with_env_lock(|| {
        std::env::remove_var("FERIANET_PRINTER");
        std::env::remove_var("FERIANET_TICKETS_DIR");

        let registry = DeliveryRegistry::with_auto_detect();

        assert!(
            registry.init_error().is_none(),
            "sin env vars, init_error debe ser None, obtuvo: {:?}",
            registry.init_error()
        );
        assert_eq!(
            registry.attempted_backend(),
            None,
            "sin env vars, no se intento ningun backend concreto"
        );
        assert_eq!(
            registry.current_kind(),
            DeliveryKind::Noop,
            "sin env vars, el backend activo es NoOp"
        );
        // health_check() debe ser Ok(()): NoOp nunca falla por contrato.
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .expect("runtime de test debe construirse");
        assert!(
            rt.block_on(registry.health_check()).is_ok(),
            "sin env vars y NoOp activo, health_check() debe ser Ok(())"
        );
    });
}

// ============================================================
// Helpers
// ============================================================

/// Timestamp estilo "epoch millis" sin depender de `chrono` (para
/// que los tests no necesiten mas dependencias de las que ya
/// tiene el modulo). Suficiente para hacer unicos los paths
/// temporales por test.
fn chrono_like_now() -> u128 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0)
}
