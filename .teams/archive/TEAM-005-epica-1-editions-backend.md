# TEAM-005 — Épica 1: backend de ediciones (FairEdition)

- ID: TEAM-005
- Nombre: Épica 1 backend de ediciones (FairEdition)
- Fecha creacion: 2026-06-26
- Estado: cerrado

## Descripcion

Cierra el hueco detectado al final de TEAM-004: el backend Rust expone commands Tauri para la entidad `FairEdition` (la unidad organizativa del TPV). Hasta ahora existían el dominio (`domain/fair_edition.rs`) y la tabla (`fair_edition` en V001), pero faltaban el repositorio tipado, los commands `#[tauri::command]` y el registro en `invoke_handler`. Este team cierra los 5 commands para que TEAM-006 (UI de ediciones) y TEAM-007 (smoke E2E) puedan trabajar contra backend real.

## Objetivo

Dejar el backend con CRUD de ediciones funcional, alineado con el contrato que ya espera el frontend en `src/api/tauri.ts`:

- `list_fair_editions(fair_id)` -> `Vec<FairEdition>`.
- `create_fair_edition(fair_id, input)` -> `FairEdition`.
- `update_fair_edition(id, input)` -> `FairEdition`.
- `delete_fair_edition(id)` -> `()`.
- `change_fair_edition_status(id, status)` -> `FairEdition`.

Criterios verificables:

- `cargo check` sin warnings ni errores.
- `cargo build --bin feria-net` produce el binario sin warnings.
- Los 5 commands aparecen baked en el binario (verificado con `findstr`).
- Las firmas encajan con los stubs de `src/api/tauri.ts` (regla `Omit<FairEdition, "id"|"fair_id"|"created_at">` para input).
- `fair_id` llega como argumento separado en `create_fair_edition` (alineado con el frontend).
- Las validaciones de `year BETWEEN 1900 AND 2100`, formato ISO 8601 `YYYY-MM-DD` y `end_date >= start_date` se aplican en capa de aplicación antes de llegar a SQLite.
- `UNIQUE (fair_id, year)` se traduce a `AppError::UniqueViolation` con el año concreto en el mensaje.
- `ON DELETE RESTRICT` en FK de `attraction.fair_edition_id` se traduce a `AppError::ConstraintViolation` con mensaje claro al borrar.

## Contexto

- Docs leídos: `docs/data-model.md` §2.2 y §5.10, `docs/REGLAS_PROYECTO.md` §"Convenciones de commits", `docs/SSOT.md`, `.teams/TEAM_TEMPLATE.md`, `.teams/archive/TEAM-003-epica-1-backend.md`, `.teams/archive/TEAM-004-epica-1-frontend.md`.
- Archivos del proyecto inspeccionados antes de tocar nada: `src-tauri/src/domain/fair_edition.rs`, `src-tauri/src/commands/fairs.rs`, `src-tauri/src/commands/attractions.rs`, `src-tauri/src/db/repository/fairs.rs`, `src-tauri/src/db/repository/attractions.rs`, `src-tauri/src/db/migrations/V001__init.sql`, `src-tauri/src/lib.rs`, `src-tauri/src/state.rs`, `src-tauri/src/db/pool.rs`, `src-tauri/src/errors.rs`, `src/api/tauri.ts`, `src/types/domain.ts`, `src/hooks/queries/`.
- Skills cargadas: `implementar-backend-datos`, `actuar-como-senior`.
- Estado Git al abrir: rama `main`, working tree limpio, último commit `a660786` (cierre de TEAM-004).
- Estado `.teams/`: `.counter` en `4`. Ningún TEAM activo. INDEX con 4 filas cerradas.
- Sin `scripts/ai_coordination.py` (no aplica concurrencia runtime); soy el único trabajando aquí ahora.
- Toolchain verificado: `rustc 1.96.0` + `cargo 1.96.0` (rustup user-local en `%USERPROFILE%\.cargo\bin`). `cargo` no está en PATH por defecto, hay que prefijarlo.

## Discrepancias con el brief

- **Tipo C / P3 — firma de `create_fair_edition`**: el brief mete `fair_id` dentro de `CreateFairEditionInput`. El stub del frontend (`src/api/tauri.ts`) lo recibe como argumento separado (`createFairEdition(fairId: string, input: Omit<FairEdition, "id"|"fair_id"|"created_at">)`) y el invoke llama con `{ fairId, input }`. **Priorizo el contrato del frontend** (brief Rule 1) y la firma Rust queda `create_fair_edition(fair_id: String, input: CreateFairEditionInput)` con `CreateFairEditionInput` SIN `fair_id`. El comportamiento funcional es equivalente; TEAM-006 ya tiene el stub listo para enchufar.
- **Tipo B / P3 — invariante "una sola edición active por feria" (§5.10 de data-model)**: el brief no la pide. La validación no se aplica en backend. El frontend (TEAM-006) puede proteger el flujo visualmente; el enforcement automático queda como riesgo abierto (post-MVP, junto con la transición automática `planned -> active -> closed` por `end_date + 7 días`).
- **Tipo C / P3 — observación sobre hub drift**: el bootstrap declara hub sincronizado en `1.03.00` pero el hub real está en `1.04.00` (verificado con `Get-Content hub-path.txt` + `HUB_VERSION`). El proyecto no incluye `globalize.ps1` en raíz, por lo que no puedo re-sincronizar desde aquí. Las skills y agentes del proyecto funcionan correctamente; el desfase queda como observación para el operador, no bloquea.

## Trabajo realizado

- Repositorio `db/repository/editions.rs` (369 líneas) replicando el patrón de `fairs.rs` y `attractions.rs`:
  - `create_edition` con validación de rango de año, formato ISO 8601, orden cronológico y existencia del `fair_id` antes del INSERT.
  - `list_editions_by_fair` ordenado por `year DESC`.
  - `get_edition` con `Optional` para distinguir "no existe" de error.
  - `update_edition` con `Option` por campo, recálculo de `effective_start`/`effective_end` para validar orden comparando con el valor actual si el otro campo no se está actualizando.
  - `delete_edition` con traducción del error FK a `ConstraintViolation`.
  - `change_edition_status` como atajo sobre `update_edition(_, None, None, None, Some(status))`.
  - `classify_db_err` propia que distingue UNIQUE (con año en mensaje) de FOREIGN KEY (mensaje claro) del resto de constraints.
- Commands `commands/editions.rs` (151 líneas) replicando el patrón de `commands/fairs.rs`:
  - `CreateFairEditionInput { year, start_date, end_date, status }` (sin `fair_id`).
  - `UpdateFairEditionInput { year?, start_date?, end_date?, status? }` (mirror de `Partial<Omit<FairEdition, "id"|"fair_id"|"created_at">>`).
  - 5 commands `#[tauri::command]` async con `parse_uuid` local.
  - `change_fair_edition_status` recibe `status: String` y convierte con `FairEditionStatus::from_str` para devolver `InvalidInput` claro en lugar de error genérico de deserialización.
- Registro de los 5 commands en `lib.rs::invoke_handler` bajo sección "Ediciones (TEAM-005)".
- Verificación: `cargo check` limpio (0 warnings, 0 errores) en 2.66 s. `cargo build --bin feria-net` produce `target/x86_64-pc-windows-msvc/debug/feria-net.exe` (18.3 MB) en 14.18 s, también limpio.
- Verificación de binario: `findstr` confirma que los 15 commands están baked en el `.exe` (10 anteriores + 5 nuevos).

## Archivos tocados

### Nuevos (backend)

- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\db\repository\editions.rs` (commit `7842e17`).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\commands\editions.rs` (commit `a545538`).

### Modificados (aditivos, no comportamentales en código existente)

- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\db\repository\mod.rs` — añadida línea `pub mod editions;` (commit `7842e17`).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\commands\mod.rs` — añadida línea `pub mod editions;` (commit `a545538`).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\lib.rs` — import `editions as cmd_editions` y 5 entradas nuevas en `invoke_handler` bajo sección "Ediciones (TEAM-005)" (commit `df6cc96`).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\.teams\INDEX.md` — fila nueva para TEAM-005 en "cerrados / archivados" (commit final del team).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\.teams\.counter` — incrementado de `4` a `5` (commit final del team).

### Borrados

- Ninguno.

## Coordinacion

No aplica Rule 25 estrictamente (ningún otro TEAM activo simultáneo). Confirmaciones:

- Rama: `main` (sigo la práctica del proyecto de cerrar épicas directamente sobre `main`).
- Sin worktree separado: trabajo aislado, no compite por superficies compartidas.
- Sin `ai_coordination.py` en el proyecto: aplico fallback manual verificando `git status` y `git log` antes de cada commit.
- Merge train: no hay otras ramas pendientes. `git push origin main` commit por commit.

## Criterios de cierre

- [x] `src-tauri/src/db/repository/editions.rs` creado con `create/list/get/update/delete/change_status` + helpers.
- [x] `src-tauri/src/commands/editions.rs` creado con 5 `#[tauri::command]` async.
- [x] `src-tauri/src/db/repository/mod.rs` registra `editions`.
- [x] `src-tauri/src/commands/mod.rs` registra `editions`.
- [x] `src-tauri/src/lib.rs` registra los 5 commands nuevos en `invoke_handler`.
- [x] `cargo check` pasa sin warnings ni errores (2.66 s).
- [x] `cargo build --bin feria-net` pasa (14.18 s, binario 18.3 MB).
- [x] Los 15 commands (10 anteriores + 5 nuevos) están baked en `feria-net.exe` (verificado con `findstr`).
- [x] Contrato con frontend encajado: `fairId` como argumento separado, inputs sin `fair_id`/`id`/`created_at`, status como string en `change_fair_edition_status`.
- [x] Validaciones de aplicación: rango de año, formato ISO 8601, orden de fechas, existencia de `fair_id`.
- [x] UNIQUE `(fair_id, year)` se traduce a `UniqueViolation` con el año concreto.
- [x] ON DELETE RESTRICT se traduce a `ConstraintViolation` con mensaje claro.
- [x] Ningún secreto en código o configs.
- [x] Todos los commits siguen formato `tipo(scope):` en español (REGLAS_PROYECTO.md §"Convenciones de commits").
- [x] `git push origin main` aplicado tras cada commit (3 commits de código + 1 de cierre).
- [x] `.counter` actualizado a `5` e `INDEX.md` con fila TEAM-005.

## Riesgos

Materiales:

- **R1 — Invariante §5.10 "una sola edición active por feria" no enforced en backend**. Si el operador crea o transiciona dos ediciones a `active` para la misma feria, el backend lo permite. El frontend (TEAM-006) puede proteger visualmente; el enforcement automático queda pendiente y debe entrar antes de la épica 3 (TPV). Documentar en `docs/ARCHITECTURE.md` §2 si se confirma como deuda.

No materiales / aceptados:

- Hub drift 1.03.00 → 1.04.00: no impacta al trabajo de este team, anotado como observación.
- `domain/mod.rs` mantiene `#[allow(unused_imports)] pub use fair_edition::{...};` aunque ya se usan. Es defensivo y no genera warning tras este team. Se puede limpiar en otra pasada sin afectar al MVP.

## Evidencia

- `cargo check` (tras commit 3):
  ```
  Finished `dev` profile [unoptimized + debuginfo] target(s) in 2.66s
  ```
  Sin warnings ni errores.
- `cargo build --bin feria-net` (tras commit 3):
  ```
  Compiling feria-net v0.1.0 (C:\...\src-tauri)
  Finished `dev` profile [unoptimized + debuginfo] target(s) in 14.18s
  ```
  Sin warnings. Binario `src-tauri/target/x86_64-pc-windows-msvc/debug/feria-net.exe` (18 320 896 bytes, mtime 2026-06-26 21:30:23).
- Verificación de los 15 commands baked en el binario (`findstr /C:... feria-net.exe`):
  ```
  create_fairlist_fairsget_fairupdate_fairdelete_fairsuggest_fair_by_name
  create_attractionlist_attractions_by_editionupdate_attractionsoft_delete_attraction
  list_fair_editionscreate_fair_editionupdate_fair_editiondelete_fair_edition
  change_fair_edition_status
  ```
  Confirmados los 5 nuevos. Tauri también bakea el alias camelCase `statefairId` para la conversión de argumentos TS→Rust.
- `git log --oneline -5` (post-commit 3):
  ```
  df6cc96 chore(tauri): registra los 5 commands nuevos de ediciones en invoke_handler
  a545538 feat(commands): comandos Tauri para listar, crear, editar, borrar y cambiar estado de ediciones
  7842e17 feat(repo): repositorio para ediciones de feria con validaciones
  a660786 chore(teams): cierra TEAM-004 e incrementa .counter a 4
  1507ee2 chore(teams): abre TEAM-004 para el frontend de la epica 1
  ```
- `git push origin main` OK tras cada commit (3 pushes consecutivos, sin force).

## Proximo paso

@implementador continua con **TEAM-006 — UI de ediciones** sobre `main`:

- Reemplazar las `PendingBackendPage` de `/fairs/:id/editions`, `/editions/:id`, `/editions/:id/edit`, `/editions/new` por páginas reales.
- Reemplazar los stubs de `src/api/tauri.ts` (`listFairEditions`, `createFairEdition`, `updateFairEdition`, `deleteFairEdition`) por invocaciones reales a `invoke("list_fair_editions", { fairId })`, etc.
- Crear `src/hooks/queries/editions.ts` con hooks `useEditionsByFair`, `useCreateEdition`, `useUpdateEdition`, `useDeleteEdition`, `useChangeEditionStatus` (keys jerárquicas para invalidación).
- Formularios con RHF + Zod (`year` entero 1900-2100, fechas `YYYY-MM-DD` validadas, `end_date >= start_date`, status enum).
- Confirmación destructiva al borrar (ya existe `ConfirmDestructiveDialog` en `src/components/app/`).
- Transición de estado con un control específico (botones o dropdown que llame a `change_fair_edition_status`).
- Después de TEAM-006, @qa-validador ejecuta smoke E2E sobre la épica 1 completa (alta feria → alta edición → alta atracción → soft-delete atracción → cambio status) y @revisor revisa riesgos materiales.
