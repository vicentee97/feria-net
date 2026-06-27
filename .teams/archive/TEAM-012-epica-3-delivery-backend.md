# TEAM-012 - Épica 3 backend: módulo `ticket-delivery` intercambiable

- ID: TEAM-012
- Nombre: Épica 3 backend — `ticket-delivery` intercambiable (trait + 3 impls + commands + tests de sustitución)
- Fecha creacion: 2026-06-27
- Estado: cerrado

## Descripcion

Cierra el backend de la épica 3 del MVP: el módulo `ticket-delivery` que la SSOT §2 obliga a tener intercambiable desde v1. Implementa el trait `DeliveryBackend` con tres implementaciones (NoOp, File, ThermalPrinter), un `DeliveryRegistry` con auto-detección por variables de entorno, los commands Tauri que la UI necesita (print_ticket, retry_pending_tickets, list_delivery_devices, delivery_health_check), y los **tests de sustitución** que demuestran que la venta no se acopla a ningún backend concreto (requisito de `ARCHITECTURE.md` §5.5).

Se construye sobre V003 (`ticket` + `ticket_delivery_attempt` ya con el contrato completo de `docs/data-model.md` §2.9) y el módulo `repository::sales` que ya crea placeholders. **No se modifica ninguna migración existente.**

## Objetivo

Criterios verificables de cierre:

- [x] Trait `DeliveryBackend` definido y `DeliveryError` con mapeo a `error_code` canónico (snake_case alineado con V003 CHECK).
- [x] 3 implementaciones funcionales: `NoOpDelivery`, `FileDelivery`, `ThermalPrinterDelivery` (esta última usa `escpos` 0.19 + `WindowsUsbPrintDriver`).
- [x] `DeliveryRegistry` con auto-detección por `FERIANET_PRINTER` (thermal) / `FERIANET_TICKETS_DIR` (file) / fallback a NoOp.
- [x] Formato de payload aislado en `delivery::format`: ESC/POS para térmica (init `ESC @`, centrar, contenido, corte `GS V B 0`), texto plano UTF-8 para file.
- [x] 4 commands Tauri registrados en `invoke_handler` (`print_ticket`, `retry_pending_tickets`, `list_delivery_devices`, `delivery_health_check`).
- [x] `AppState` extiende con `Arc<DeliveryRegistry>`.
- [x] Cada intento de entrega queda registrado en `ticket_delivery_attempt` con `delivery_kind`, `outcome`, `error_code`, `error_detail`, `payload` (truncado a 4 KB) y `attempted_at`.
- [x] Regla dura: `print_ticket` **nunca falla la venta**; un fallo del backend se traduce a `PrintTicketResult { success: false, ... }` y se registra el intento.
- [x] `cargo check`, `cargo build --bin feria-net` y `cargo test --lib` pasan **sin warnings ni errores**.
- [x] **Tests de sustitución ejecutados**: 19/19 PASA, incluyendo el test de polimorfismo que demuestra que el mismo flujo "entregar un ticket" funciona con NoOp y File sin tocar al caller.
- [x] Ningún archivo de frontend modificado.
- [x] Ningún doc canónico modificado.
- [x] Ninguna migration existente modificada (V001, V002, V003 intactas).
- [x] Cero secretos o paths inseguros expuestos (verificado contra checklist de `auditar-seguridad`).
- [x] Confirmación explícita de cumplimiento SSOT §2 (sección "Cumplimiento SSOT §2" abajo).
- [x] TEAM-012 archivado, `.teams/.counter = 12`, `INDEX.md` actualizado.

## Contexto

- Docs leídos: `docs/SSOT.md` §2 ("`ticket-delivery` intercambiable desde v1"), `docs/data-model.md` §2.9 (`TicketDeliveryAttempt` contrato y CHECK de V003), `docs/ARCHITECTURE.md` §3.5 (impresión) y §4 (módulos técnicos), §5 (abstracción `ticket-delivery`), `docs/REGLAS_PROYECTO.md` (convenciones de commits).
- Skills cargadas: `implementar-backend-datos` (normativa), `investigar-antes-de-implementar` (versiones de `escpos` y API `WindowsUsbPrintDriver`), `actuar-como-senior` (abstracción crítica, errores caros de revertir), `auditar-seguridad` (consulta breve: el trait no expone secretos ni paths inseguros).
- Estado Git al abrir: rama `main`, HEAD `d429d31` (cierre TEAM-011), `.teams/.counter = 11`. Sin worktrees paralelos.
- Sin `scripts/ai_coordination.py` en el proyecto (Rule 25 cae a fallback manual; sin otros trabajos en paralelo detectados).
- Toolchain: `rustc 1.96.0` + `cargo 1.96.0` (rustup user-local en `%USERPROFILE%\.cargo\bin`).
- DB local pre-existente: `%APPDATA%\com.ferianet.app\feria-net.db` con V001+V002+V003 aplicadas.

## Trabajo realizado

- Investigación: verificada versión actual de `escpos` (`0.19.0`, latest estable Mayo 2026) y la API real de `WindowsUsbPrintDriver` (en source de GitHub, no en memoria): `list() -> Vec<WindowsUsbPrintInfo>`, `open(device_path)`, `open_by_vid_pid(vid, pid)`, `lpt_status()`. La feature `usbprint` requiere `target_os = "windows"`.
- Creado módulo `src-tauri/src/delivery/` con 8 archivos: `mod.rs`, `backend.rs` (trait + error), `noop.rs`, `file.rs`, `thermal.rs`, `registry.rs`, `format.rs`, `tests.rs`.
- Añadido `escpos = { version = "0.19", default-features = false, features = ["std", "usbprint"] }` a `Cargo.toml`.
- Creado `db/repository/delivery_attempts.rs` con `create_delivery_attempt` (truncado de payload a 4KB), `count_attempts_for_ticket`, `last_attempt_for_ticket`.
- Re-exportados en `domain/mod.rs` los enums `DeliveryKind`, `DeliveryOutcome`, `DeliveryErrorCode` y el struct `TicketDeliveryAttempt` (preparados en TEAM-009 con `#[allow(dead_code)]`).
- Creados 4 commands Tauri en `src-tauri/src/commands/delivery.rs`: `print_ticket`, `retry_pending_tickets`, `list_delivery_devices`, `delivery_health_check`. Más un helper interno `deliver_one` que reutiliza el flujo de `print_ticket` para los reintentos.
- `AppState` extendido con `Arc<DeliveryRegistry>`. `AppState::new(...)` añadido como constructor helper (marcado `#[allow(dead_code)]` para futuro uso en tests/scripts).
- 4 commands añadidos al `invoke_handler` en `lib.rs`. El `DeliveryRegistry` se construye con auto-detección dentro de `lib.rs::run` durante el `setup` de Tauri.
- Tests:
  - `delivery/format.rs`: 3 tests (inicio ESC, fin con corte, contenido).
  - `delivery/tests.rs`: 14 tests (contrato de cada backend, auto-detección, polimorfismo clave).
  - `db/repository/delivery_attempts.rs`: 2 tests (truncado, persistencia de campos).

## Archivos tocados

- `src-tauri/Cargo.toml` (añadida dep `escpos`).
- `src-tauri/Cargo.lock` (regenerado por cargo).
- `src-tauri/src/lib.rs` (registro de 4 commands + construcción del `DeliveryRegistry`).
- `src-tauri/src/state.rs` (añadido `delivery: Arc<DeliveryRegistry>`).
- `src-tauri/src/commands/mod.rs` (añadido `pub mod delivery;`).
- `src-tauri/src/commands/delivery.rs` (nuevo, 440 líneas).
- `src-tauri/src/db/repository/mod.rs` (añadido `pub mod delivery_attempts;`).
- `src-tauri/src/db/repository/delivery_attempts.rs` (nuevo, 408 líneas).
- `src-tauri/src/domain/mod.rs` (re-exports de `ticket_delivery_attempt`).
- `src-tauri/src/delivery/mod.rs` (nuevo).
- `src-tauri/src/delivery/backend.rs` (nuevo, trait + error).
- `src-tauri/src/delivery/noop.rs` (nuevo).
- `src-tauri/src/delivery/file.rs` (nuevo).
- `src-tauri/src/delivery/thermal.rs` (nuevo, módulo `imp` separado para código Windows-only).
- `src-tauri/src/delivery/registry.rs` (nuevo).
- `src-tauri/src/delivery/format.rs` (nuevo, con tests inline).
- `src-tauri/src/delivery/tests.rs` (nuevo, 14 tests).
- `.teams/active/TEAM-012-epica-3-delivery-backend.md` (este archivo, movido a archive al cerrar).
- `.teams/INDEX.md` (entrada TEAM-012 añadida en "cerrados / archivados").
- `.teams/.counter` (incrementado a 12).

## Cumplimiento SSOT §2 (confirmación explícita)

La SSOT §2 dice: *"El sistema que entrega el ticket (impresora térmica hoy, RFID mañana) es un módulo reemplazable. **Ninguna parte de la lógica de venta puede acoplarse a un tipo de entrega concreto.**"*

**Confirmación**: la lógica de venta (`repository::sales::create_sale` y `commands::sales::create_sale`) sigue creando los tickets y un `ticket_delivery_attempt` placeholder (`delivery_kind='noop'`, `outcome='failure'`, `error_code='unknown'`, `error_detail='pending'`), exactamente igual que al cierre de TEAM-009. La venta **no importa** el módulo `delivery`, **no conoce** `DeliveryBackend`, **no sabe** si hay térmica, file, o nada. Solo escribe en `ticket_delivery_attempt`; el módulo `ticket-delivery` lo lee y lo actualiza después.

El **test de sustitución clave** (`registry_delivers_via_active_backend_polymorphically` en `delivery/tests.rs`) demuestra que el mismo código de "entregar un ticket" funciona con `NoOpDelivery` y con `FileDelivery` sin cambios en el caller. Si en el futuro alguien añade `if registry.kind() == DeliveryKind::Thermal` en la capa de venta, el test con NoOp y File detectaría el acoplamiento prohibido.

## Decisiones (las materiales con motivo de una línea)

- **`escpos` 0.19 + feature `usbprint`**: único driver nativo de Windows para impresoras POS, sin Zadig. Decisión alineada con `ARCHITECTURE.md` §3.5.
- **`From<DeliveryError> for AppError`**: traduce `DeliveryError` a `AppError::Internal(...)` para que la frontera IPC pueda propagar fallos de delivery. Mapeo a `Internal` (no a `NotFound`/`InvalidInput`) porque el command que imprime **nunca falla la venta**.
- **`DeliveryRegistry::kind()` cacheado**: el `kind` se guarda en el struct (no se recalcula con `current().kind()` cada vez) para evitar dispatch dinámico en `PrintTicketResult.backend_kind`.
- **`FileDelivery` sanea `ticket_id`**: aunque viene de un UUID interno, se filtran caracteres no alfanuméricos para prevenir path traversal aunque el id venga de input externo en el futuro.
- **Thermal como módulo `imp` separado**: el trait `Driver` de `escpos` se importa solo dentro del módulo `imp` (Windows-only) para que la superficie pública de `delivery::thermal` no exponga tipos internos de `escpos` ni requiera `target_os = "windows"` en los consumidores.
- **Reintento secuencial en `retry_pending_tickets`**: no paraleliza para no saturar el puerto USB ni el spooler de Windows. Se puede paralelizar con semaphore más adelante sin cambiar el contrato.

## Desviaciones del brief (P3, ejecutadas y reportadas)

- **D1 (P3)**: `device_path` real de `escpos` `WindowsUsbPrintDriver` no es "USB001" sino el path completo de Windows (`\\?\USB#VID_xxxx&PID_xxxx#...`). Sigo la API real del crate (que es la única manera de que el código compile). La UI futura deberá resolver el nombre corto al path completo antes de invocar al backend.
- **D2 (P3)**: `latency_ms` no existe como columna en V003 (el `docs/data-model.md` §2.9 no la incluye). Mido `latency_ms` en memoria y la devuelvo en `PrintTicketResult`, pero **no la persisto** (no hay columna). Documentado en el commit `feat(commands)`.
- **D3 (P3)**: `delivery_status`, `delivery_attempts`, `last_delivery_error` no existen en el schema V003 del `ticket` (la epica 2 los dejo pendientes). El estado del ticket se calcula por SQL en `list_pending_tickets_by_cash_session` (último intento con `outcome = 'failure'`). Esto ya funcionaba en TEAM-009 y se respeta.
- **D4 (P3)**: la carpeta es `src-tauri/src/delivery/` (siguiendo el brief operativo) en lugar de `src-tauri/src/ticket_delivery/` (que es lo que dice `ARCHITECTURE.md` §4). Decisión a favor del brief; el nombre sigue siendo claro y el módulo es agnóstico al "delivery" concreto.

## Riesgos abiertos

- **R1 (medio)**: el `ThermalPrinterDelivery` compila y el trait está probado, pero **no se ha ejecutado contra hardware físico real** en el entorno de desarrollo (S-B del `ARCHITECTURE.md` §2.5). El test `thermal_handles_missing_device_in_health_check` verifica que no panic, no que funcione. La validación con impresoras de feriante (58 mm / 80 mm genéricas) es un entregable de la **épica 9 (QA)**.
- **R2 (bajo)**: el `flush()` del driver es no-op (`usbprint.sys` no implementa `IRP_MJ_FLUSH_BUFFERS`), pero `escpos` lo trata como OK (verifica `ERROR_INVALID_FUNCTION` / `ERROR_NOT_SUPPORTED`). Documentado en el código.
- **R3 (bajo)**: el `cargo build` no se ha ejecutado en `release` (solo `dev` + tests). El release puede tardar más por LTO; documentar si en CI rompe por tiempo.
- **R4 (bajo)**: `Cargo.lock` se ha actualizado con muchas transitivas nuevas de `escpos` (algunas con versiones de hace 2 años, por ejemplo `rusb 0.9.4`, `serialport 4.9.0`, `windows-sys 0.61`). Son opcionales y no se compilan (la feature `usbprint` no las requiere todas), pero merecen una pasada de `auditar-proyecto-tecnico` post-MVP.

## Evidencia

- `cargo check --bin feria-net` → sin warnings, sin errores (`Finished dev profile in 4.91s`).
- `cargo build --bin feria-net` → sin warnings, sin errores (`Finished dev profile in 1m 10s` la primera vez; las siguientes segundos).
- `cargo test --lib` → `19 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.13s`.
- 9 commits atómicos en `main` (todos pushed en el push final):
  - `e98da27` chore(deps): añade escpos 0.19 al Cargo.toml
  - `d2d3ce8` feat(delivery): trait DeliveryBackend y DeliveryError
  - `b67f747` feat(delivery): NoOpDelivery y FileDelivery
  - `ee1478b` feat(delivery): ThermalPrinterDelivery con escpos + USB
  - `ba2246a` feat(delivery): DeliveryRegistry con auto-deteccion y format helpers
  - `aef825c` feat(repo): helper create_delivery_attempt y re-exports del dominio
  - `a6aeebc` feat(commands): commands Tauri print_ticket, retry_pending_tickets, list_delivery_devices, delivery_health_check
  - `45f7d30` feat(state): anade DeliveryRegistry al AppState
  - `d1e7412` chore(tauri): registra los 4 nuevos commands en invoke_handler
  - `856c1c3` test(delivery): tests de sustitucion que prueban la SSOT §2
- Versiones añadidas: `escpos = "0.19"` (default-features = false, features = `["std", "usbprint"]`). `async-trait` ya estaba en deps.
- `TEAM-012` archivado, `.teams/.counter = 12`, `INDEX.md` actualizado.

## Próximo paso

Arrancar **TEAM-013** (frontend épica 3): auto-print tras venta, retry UI desde la pantalla de tickets pendientes, indicador de salud de impresora en la cabecera, y la pantalla de configuración de impresoras. `@qa-validador` puede arrancar en paralelo el smoke test E2E de la épica 3 (incluyendo prueba de sustitución con NoOp y File). `@revisor` revisa riesgos materiales antes de que `@experto-github` proponga tag.
