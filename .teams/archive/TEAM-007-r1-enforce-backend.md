# TEAM-007 — R1 enforcement: índice UNIQUE parcial para "una sola edición active por feria"

- ID: TEAM-007
- Nombre: R1 enforcement (UNIQUE parcial V002)
- Fecha creacion: 2026-06-26
- Estado: cerrado

## Descripcion

Cierra el riesgo material R1 documentado por `@revisor` y `@qa-validador` al cierre de la épica 1. Añade un índice UNIQUE parcial sobre `fair_edition(fair_id) WHERE status = 'active'` que hace estructural la invariante `docs/data-model.md` §5.10 ("una sola edición por feria puede estar active"). Antes de V002 la regla solo estaba protegida por la UI (ActivateEditionDialog) y la secuencia "cerrar otra + activar" no era transaccional; ahora SQLite aborta cualquier intento de doble-activación de forma atómica, declarativa y robusta contra race conditions.

## Objetivo

Garantizar que el backend rechaza de forma atómica cualquier intento de tener dos ediciones `active` para la misma `fair_id`, y que el error se traduce a `AppError::UniqueViolation` con el mensaje canónico para que la UI lo muestre de forma útil.

Criterios verificables:

- `cargo check` pasa sin warnings ni errores.
- `cargo build --bin feria-net` produce el binario sin warnings.
- La migración V002 se aplica sobre una BD existente en V001 al siguiente arranque (verificado con example temporal).
- `sqlite_master` contiene el índice `idx_fair_edition_one_active_per_fair` con el SQL exacto: `CREATE UNIQUE INDEX idx_fair_edition_one_active_per_fair ON fair_edition (fair_id) WHERE status = 'active'`.
- Intentar dejar dos ediciones `active` en la misma feria falla con `UNIQUE constraint failed: fair_edition.fair_id` y `classify_db_err` lo traduce a `AppError::UniqueViolation("Ya existe una edición activa para esta feria. Cierra la edición activa actual antes de activar otra.")`.
- Tener dos ediciones `active` en ferias DISTINTAS sigue siendo válido (no es regla global, es per-feria).
- Cerrar la active de una feria y crear otra active en la misma feria sigue siendo válido.
- Ningún archivo de frontend modificado.
- Ningún doc canónico modificado.

## Contexto

- Docs leídos: `docs/data-model.md` §2.2 y §5.10, `docs/REGLAS_PROYECTO.md` §"Convenciones de commits", `docs/SSOT.md`, `.teams/TEAM_TEMPLATE.md`, `.teams/archive/TEAM-005-epica-1-editions-backend.md`, `.teams/archive/TEAM-006-epica-1-editions-frontend.md`, `docs/qa/epica-1/review-epica-1-00062bf.md` (R1), `docs/qa/epica-1/qa-validation-report.md` (R1 confirmado en paso 7 del smoke).
- Archivos del proyecto inspeccionados antes de tocar nada: `src-tauri/src/db/migrations/V001__init.sql`, `src-tauri/src/db/migrations/mod.rs`, `src-tauri/src/db/pool.rs`, `src-tauri/src/db/repository/editions.rs`, `src-tauri/src/errors.rs`, `src-tauri/Cargo.toml`.
- Crate fuente de `rusqlite_migration` 2.6.0 inspeccionada en `%USERPROFILE%\.cargo\registry\src\index.crates.io-1949cf8c6b5b557f\rusqlite_migration-2.6.0\src\lib.rs:636` (ver `tx.execute_batch(m.up)`) y `:817-832` (ver `to_latest`).
- Fuente de SQLite 3.x inspeccionada en `%USERPROFILE%\.cargo\registry\src\index.crates.io-1949cf8c6b5b557f\libsqlite3-sys-0.38.1\sqlite3\sqlite3.c:131872-131902` (ver formato del mensaje de UNIQUE constraint failed).
- Skills cargadas: `implementar-backend-datos`, `investigar-antes-de-implementar`, `actuar-como-senior`, `auditar-seguridad` (consulta breve).
- Estado Git al abrir: rama `main`, working tree limpio salvo `docs/qa/` (untracked, del revisor/QA), último commit `00062bf` (cierre TEAM-006).
- Estado `.teams/`: `.counter` en `6`. Ningún TEAM activo. INDEX con 6 filas cerradas.
- Sin `scripts/ai_coordination.py` en el proyecto (no aplica concurrencia runtime); soy el único trabajando aquí ahora.
- Toolchain verificado: `rustc 1.96.0` + `cargo 1.96.0` (rustup user-local en `%USERPROFILE%\.cargo\bin`).
- DB local pre-existente: `%APPDATA%\com.ferianet.app\feria-net.db` con V001 aplicada, 0 filas (dejada limpia por el smoke de QA).

## Investigación previa

- **Tema verificado**: sintaxis de índices parciales en SQLite + soporte en `rusqlite_migration`.
- **Fuentes**:
  1. Documentación oficial SQLite: `https://www.sqlite.org/partialindex.html` y `https://www.sqlite.org/lang_createindex.html`.
  2. Crate `rusqlite_migration` 2.6.0: `%USERPROFILE%\.cargo\registry\src\index.crates.io-1949cf8c6b5b557f\rusqlite_migration-2.6.0\src\lib.rs:629-654` (mecanismo de aplicación).
  3. Fuente SQLite C: `%USERPROFILE%\.cargo\registry\src\index.crates.io-1949cf8c6b5b557f\libsqlite3-sys-0.38.1\sqlite3\sqlite3.c:131872-131902` (formato del mensaje de error de UNIQUE).
- **Versión verificada**: SQLite ≥ 3.8.0 (vía `rusqlite` 0.40.1 con feature `bundled`), `rusqlite_migration` 2.6.0.
- **Hallazgos clave**:
  - SQLite soporta `CREATE UNIQUE INDEX ... ON table (cols) WHERE expr` desde 3.8.0 (2013-08-26). Nuestro `rusqlite` embebe SQLite estático reciente.
  - `rusqlite_migration` no parsea SQL; pasa la cadena tal cual a SQLite vía `tx.execute_batch(m.up)`. No hay restricción que bloquee `WHERE`.
  - El formato del mensaje de UNIQUE constraint failed para un índice de columnas sin expresiones es `UNIQUE constraint failed: <table>.<col1>[, <table>.<col2>, ...]`. Permite diferenciar el índice parcial nuevo (1 columna) del `UNIQUE (fair_id, year)` existente (2 columnas).
- **Riesgos o dudas**: ninguno. No se necesita plan B.

## Decisiones materiales

1. **Índice UNIQUE parcial con `WHERE` (no índice con expresión CASE)**: el brief prescribe la sintaxis `WHERE status = 'active'`. La alternativa con `CREATE UNIQUE INDEX ... ON fair_edition (CASE WHEN status='active' THEN fair_id END)` también funciona y haría que SQLite incluyera el nombre del índice en el mensaje de error (útil para diferenciación), pero introduce una columna calculada sin beneficio operativo. Se mantiene la forma `WHERE` por coherencia con la SSOT y porque la diferenciación por número de columnas en el mensaje es robusta.
2. **`AppError::UniqueViolation` (no nueva variante)**: el error es semánticamente una violación de unicidad. Crear `ActiveEditionConflict` añadiría una variante que solo se usa en un sitio y duplicaría `kind` en el `SerializableError` del frontend. Se reutiliza `unique_violation` y se diferencia por el mensaje.
3. **Diferenciación por formato de columnas, no por nombre del índice**: SQLite incluye el nombre del índice en el mensaje solo cuando es un índice de expresiones; para índices de columnas emite `<table>.<col>, ...`. Se opta por `msg.starts_with("UNIQUE constraint failed: fair_edition.fair_id") && !msg.contains("year")` que es exacto y robusto a cambios futuros en V001 (mientras no se añadan más UNIQUE de 1 columna sobre `fair_edition.fair_id`).
4. **Mensaje del error**: exacto del brief, en español, imperativo. Coherente con `ActivateEditionDialog` y con el resto de mensajes del repo.
5. **No permanente test**: el brief instruye borrar el example de verificación tras usarla. La verificación queda registrada en este TEAM-007 (sección Evidencia). Tests automatizados son ticket aparte (ya documentado como M-2 en `qa-validation-report.md`).

## Trabajo realizado

- Investigación previa: verificado el formato del mensaje de error SQLite leyendo el código C fuente, y el soporte de `WHERE` en `rusqlite_migration` leyendo el código del crate. Conclusión: el approach del brief funciona tal cual, sin plan B.
- Creada `src-tauri/src/db/migrations/V002__one_active_edition_per_fair.sql` con el índice UNIQUE parcial y comentarios extensos sobre atomicidad, soporte SQLite y formato del mensaje de error.
- Registrada V002 en `src-tauri/src/db/migrations/mod.rs` (constante `V002__ONE_ACTIVE_EDITION_PER_FAIR_SQL` y array `MIGRATIONS` actualizado para que `rusqlite_migration` la aplique tras V001).
- Actualizado el comentario de módulo de `db/repository/editions.rs`: la regla §5.10 ahora aparece como "**enforced en backend** desde V002" en lugar de "queda como riesgo abierto".
- Modificada `classify_db_err` en `editions.rs`:
  - Constante `ACTIVE_EDITION_CONFLICT_MSG` con el mensaje canónico (coherente con el brief).
  - Nueva rama de detección al inicio: si el mensaje empieza por `UNIQUE constraint failed: fair_edition.fair_id` y NO contiene `year`, devuelve `AppError::UniqueViolation(ACTIVE_EDITION_CONFLICT_MSG)`.
  - Rama existente de `UNIQUE (fair_id, year)` mantenida intacta para no romper el comportamiento previo.
- Verificación local con example temporal (creado y borrado):
  - `cargo run --example verify_v002` aplicó V001+V002 sobre la BD real en `%APPDATA%\com.ferianet.app\feria-net.db` (3.49 s compilación inicial, 2.60 s ejecución).
  - Output: índice presente, SQL del índice exactamente el esperado, 3/3 casos pasan.
- Verificación de `cargo check` (3.49 s) y `cargo build --bin feria-net` (17.33 s) sin warnings ni errores.
- Creado TEAM-007 activo (este archivo). Al cierre: mover a `.teams/archive/`, incrementar `.counter` a `7`, actualizar `.teams/INDEX.md`.

## Archivos tocados

### Nuevos

- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\db\migrations\V002__one_active_edition_per_fair.sql`.
- `C:\Vicente\Programacion\Proyectos\FeriaNet\.teams\active\TEAM-007-r1-enforce-backend.md` (este archivo).

### Modificados

- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\db\migrations\mod.rs` — añadida constante `V002__ONE_ACTIVE_EDITION_PER_FAIR_SQL` y entrada en `MIGRATIONS`.
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\db\repository\editions.rs` — comentario de módulo actualizado + nueva rama en `classify_db_err` + constante `ACTIVE_EDITION_CONFLICT_MSG`.
- `C:\Vicente\Programacion\Proyectos\FeriaNet\.teams\.counter` — incremento de `6` a `7` al cerrar.
- `C:\Vicente\Programacion\Proyectos\FeriaNet\.teams\INDEX.md` — fila nueva para TEAM-007 en "cerrados / archivados" al cerrar.

### Borrados

- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\examples\verify_v002.rs` — example temporal de verificación (borrado tras validar V002 + traducción de errores).

## Coordinacion

No aplica Rule 25 estrictamente (ningún otro TEAM activo simultáneo). Confirmaciones:

- Rama: `main` (sigo la práctica del proyecto de cerrar épicas directamente sobre `main`).
- Sin worktree separado: trabajo aislado, no compite por superficies compartidas.
- Sin `ai_coordination.py` en el proyecto: aplico fallback manual verificando `git status` y `git log` antes de cada commit.
- Merge train: no hay otras ramas pendientes. `git push origin main` commit por commit.
- Lease conceptual propio: estoy tocando superficies reservables (`migrations/`, `repository/`) pero no hay otra IA activa; el riesgo de colisión es nulo.

## Criterios de cierre

- [ ] `src-tauri/src/db/migrations/V002__one_active_edition_per_fair.sql` creado con el SQL del índice.
- [ ] `src-tauri/src/db/migrations/mod.rs` registra `V002` en el array `MIGRATIONS`.
- [ ] `src-tauri/src/db/repository/editions.rs` traduce la violación del índice parcial a `AppError::UniqueViolation` con el mensaje canónico.
- [ ] `cargo check` pasa sin warnings ni errores.
- [ ] `cargo build --bin feria-net` pasa sin warnings ni errores.
- [ ] Example temporal de verificación ejecutado, 3/3 casos pasan, example borrado antes del commit.
- [ ] DB local con V002 aplicada; índice `idx_fair_edition_one_active_per_fair` presente; comportamiento ante doble-active confirmado.
- [ ] Ningún archivo de frontend modificado.
- [ ] Ningún doc canónico modificado.
- [ ] Ninguna dependencia nueva introducida.
- [ ] Sin `--force`, sin rebase.
- [ ] 3 commits atómicos (migración, traducción, cierre TEAM-007) con push por commit.
- [ ] TEAM-007 cerrado, en `.teams/archive/`, con `.counter` en `7` e `INDEX.md` con fila TEAM-007.

## Riesgos

Materiales: **ninguno material**.

Cerrados por este TEAM:

- **R1 — "una sola edición active por feria" no enforced en backend**: ahora enforced atómicamente por el índice UNIQUE parcial V002. Un intento de doble-activación (INSERT o UPDATE) falla con `UNIQUE constraint failed` y se traduce a `AppError::UniqueViolation("Ya existe una edición activa para esta feria. Cierra la edición activa actual antes de activar otra.")`.

No materiales / aceptados:

- Hub drift 1.03.00 → 1.04.00: no impacta a este team (ya anotado en TEAM-005).
- Sin tests automatizados permanentes: el brief instruye verificación temporal. Pendiente post-MVP el setup de `cargo test` (M-2 en `qa-validation-report.md`).

## Evidencia

### Investigación

- Confirmación de soporte parcial en SQLite (3.8.0+): `%USERPROFILE%\.cargo\registry\src\index.crates.io-1949cf8c6b5b557f\libsqlite3-sys-0.38.1\sqlite3\sqlite3.c:131872-131902` (función `sqlite3UniqueConstraint` con formato `<table>.<col>` para índices de columnas sin expresiones).
- Confirmación de `rusqlite_migration` sin parsing SQL: `%USERPROFILE%\.cargo\registry\src\index.crates.io-1949cf8c6b5b557f\rusqlite_migration-2.6.0\src\lib.rs:636` (`tx.execute_batch(m.up)`).

### Compilación

- `cargo check` (sobre `src-tauri/`):
  ```
      Checking feria-net v0.1.0 (C:\...\src-tauri)
      Finished `dev` profile [unoptimized + debuginfo] target(s) in 3.49s
  ```
  Sin warnings ni errores.
- `cargo build --bin feria-net` (sobre `src-tauri/`):
  ```
     Compiling feria-net v0.1.0 (C:\...\src-tauri)
      Finished `dev` profile [unoptimized + debuginfo] target(s) in 17.33s
  ```
  Sin warnings. Binario `src-tauri/target/x86_64-pc-windows-msvc/debug/feria-net.exe`.
- `cargo check` final tras borrar example: `Finished in 1.19s`. `cargo build --bin feria-net` final: `Finished in 1.16s` (caché).

### Verificación de V002 en DB real (example temporal, ya borrado)

`cargo run --example verify_v002 --manifest-path src-tauri/Cargo.toml`:
```
DB path: C:\Users\Usuario\AppData\Roaming\com.ferianet.app\feria-net.db
[1] indice parcial presente: OK
[1] SQL del indice: CREATE UNIQUE INDEX idx_fair_edition_one_active_per_fair
  ON fair_edition (fair_id)
  WHERE status = 'active'
[2a] dos ferias con active simultaneas: OK
[2b] conflicto (esperado): UNIQUE constraint failed: fair_edition.fair_id
[2b] formato del mensaje OK para que classify_db_err lo traduzca
[2c] transicion active->closed + nueva active: OK

VERIFICACION V002: TODOS LOS CASOS PASAN
```

Casos cubiertos:

- (a) dos ferias distintas con `active` simultáneas → OK.
- (b) segunda `active` en la misma feria → falla con `UNIQUE constraint failed: fair_edition.fair_id` (formato exacto que `classify_db_err` detecta).
- (c) cerrar la `active` de una feria y crear otra `active` en la misma feria → OK (la regla es estructural, no de transición).

### Cierre de R1

R1 documentado en:

- `.teams/archive/TEAM-005-epica-1-editions-backend.md` (sección "Riesgos", material).
- `docs/qa/epica-1/review-epica-1-00062bf.md` (líneas 67-77, "no bloqueante para cerrar épica 1, gate pre-TPV").
- `docs/qa/epica-1/qa-validation-report.md` (líneas 165, 188-198, confirmado en paso 7 del smoke).

Estado de R1 tras TEAM-007: **cerrado**. Evidencia: índice presente en la DB, fallo confirmado con el mensaje exacto que el repo traduce, 3/3 casos pasan.

## Proximo paso

`@orquestador` consolida y propone la épica 2 (caja diaria + TPV). `@implementador` puede arrancar TEAM-008 (cleanup P3 + patrón único de toast, ya detectado por `@revisor`) en paralelo si el orquestador lo decide, ya que las superficies no se solapan. R1 ya no es gate para la épica 2 ni para la 3.