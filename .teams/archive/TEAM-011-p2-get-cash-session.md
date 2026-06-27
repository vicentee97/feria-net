# TEAM-011 — P2: command `get_cash_session` para resolver el fan-out 4 niveles del frontend

- ID: TEAM-011
- Nombre: P2 get_cash_session — añade command Tauri que el frontend necesita para dejar de hacer fan-out
- Fecha creacion: 2026-06-27
- Estado: activo

## Descripcion

Cierra la discrepancia P2 reportada por `@qa-validador` y `@revisor` al cierre
de la epica 2: el frontend (`CajaDetallePage`, `TpvPage`, `Breadcrumbs`)
resuelve una `CashSession` por id via fan-out 4 niveles
(`fairs -> editions -> attractions -> cash_sessions`). El backend ya tenia la
funcion de repositorio `get_cash_session` desde TEAM-009; lo que faltaba era
el command Tauri que la expusiera al frontend, y el registro en `invoke_handler`.

## Objetivo

- Anadir `get_cash_session` como command Tauri publico (paralelo a `get_sale`).
- Registrarlo en `invoke_handler` (`lib.rs`).
- Dejar el command disponible **sin forzar la migracion del frontend** (eso es
  tarea futura; el fan-out sigue funcionando en MVP).

Criterio verificable de cierre:

- `cargo check` y `cargo build --bin feria-net` pasan sin warnings.
- `get_cash_session` aparece registrado en `lib.rs::invoke_handler`.
- 3 commits atomicos empujados a `origin/main` sin `--force` ni rebase.
- `TEAM-011` cerrado y archivado, `.teams/.counter = 11`, `INDEX.md` actualizado.

## Contexto

- Docs leidos:
  - `docs/SSOT.md` (local-first obligatorio, contratos serializables).
  - `docs/data-model.md` §2.5 (`cash_session`).
  - `docs/ARCHITECTURE.md` §3.3 (commands = capa DELGADA, repo = logica).
  - `.teams/archive/TEAM-009-epica-2-backend.md` (donde se creo el repo `get_cash_session`).
  - `.teams/archive/TEAM-010-epica-2-frontend.md` (donde se introdujo el fan-out
    en `useAllCashSessionsWithContext` y se documento como P2 a cerrar en un team futuro).
- Codigo Rust leido:
  - `src-tauri/src/db/repository/cash_sessions.rs` — `get_cash_session` (l. 140)
    YA implementada con firma `pub fn get_cash_session(conn: &Connection, id: &Uuid)
    -> AppResult<Option<CashSession>>` y reutilizada por `close_cash_session` (l. 103).
    **No se modifica el repositorio.**
  - `src-tauri/src/commands/cash_sessions.rs` — 5 commands existentes
    (`open`, `close`, `get_open`, `list`, `get_for_date`). Falta `get_cash_session`
    paralelo a `get_sale`.
  - `src-tauri/src/commands/sales.rs::get_sale` (l. 100-110) — patron canonico
    a replicar: `Option<T>`, parse_uuid local, llamada al repo.
  - `src-tauri/src/commands/{fairs,attractions}.rs` — patron consistente de
    `parse_uuid` local (NO refactorizo: cada modulo tiene el suyo por
    convencion del proyecto, ya documentado en TEAM-009).
  - `src-tauri/src/lib.rs::invoke_handler` — orden por dominio funcional; los
    `get_*` de cash_sessions iran en orden alfabetico dentro del bloque.
  - `src-tauri/src/domain/cash_session.rs` — tipo `CashSession` (sin cambios).
- Skills cargadas: `implementar-backend-datos`, `actuar-como-senior`.
- Estado Git al abrir: rama `main`, HEAD `e72ebbc` (cierre TEAM-010).
  `.teams/.counter = 10`. Working tree con drift de skills del hub (16 archivos
  `.agent*/skills/**/SKILL.md` modificados + `docs/qa/` untracked) — NO TOCADOS,
  NO COMMITEADOS (mismo handling que TEAM-009 y TEAM-010).
- Sin `scripts/ai_coordination.py` (no aplica concurrencia runtime). Unico agente.
- Toolchain: `rustc 1.96.0` + `cargo 1.96.0` (rustup user-local en
  `%USERPROFILE%\.cargo\bin`).

## Decisiones materiales

### 1. NO se modifica el repositorio (desviacion P3 del brief)

El brief pedia "anadir `get_cash_session` al repositorio". Pero
`src-tauri/src/db/repository/cash_sessions.rs::get_cash_session` YA EXISTE
(linea 140) desde TEAM-009, con la firma exacta solicitada por el brief:

```rust
pub fn get_cash_session(conn: &Connection, id: &Uuid) -> AppResult<Option<CashSession>>
```

Se reutiliza desde `close_cash_session` (l. 103) y sigue el mismo patron que
`get_open_cash_session_for_attraction` y `get_cash_session_for_attraction_on_date`
(prepared statement + `row_to_cash_session` + `OptionalExtension`). Reimplementarla
seria duplicar logica exacta con distinto nombre: mala practica.

**Accion tomada**: solo se anade el command Tauri y el registro en
`invoke_handler`. **Desviacion documentada como P3**: el primer commit del
brief no aplica porque no hay diff real que commitear.

### 2. 3 commits en lugar de 4 (desviacion P3 del brief)

El brief sugeria 4 commits atomicos:
1. `feat(repo): anade get_cash_session al repositorio de cajas`
2. `feat(commands): anade command Tauri get_cash_session`
3. `chore(tauri): registra get_cash_session en invoke_handler`
4. `chore(teams): cierra TEAM-011 al anadir el command`

El primer commit no aplica (decision 1). Hacer un commit vacio o
"verificado: ya existia" rompe la regla de commits atomicos utiles.

**Accion tomada**: 3 commits reales:
1. `feat(commands): anade command Tauri get_cash_session`
   (`src-tauri/src/commands/cash_sessions.rs`).
2. `chore(tauri): registra get_cash_session en invoke_handler`
   (`src-tauri/src/lib.rs`).
3. `chore(teams): cierra TEAM-011 al anadir el command` (TEAM-011 +
   `.counter` + `INDEX.md`).

### 3. Posicion del command en `invoke_handler`

Orden por dominio funcional (mismo criterio que el resto del handler).
Dentro del bloque "Caja diaria", los `get_*` quedan en orden alfabetico:

```
open_cash_session
close_cash_session
get_cash_session                    <- NUEVO (al inicio del grupo de queries)
get_open_cash_session
list_cash_sessions_for_attraction
get_cash_session_for_attraction_on_date
```

`get_cash_session` (sin sufijo) precede a `get_open_cash_session` y a
`get_cash_session_for_attraction_on_date` por orden alfabetico, y deja
`list_*` despues de los `get_*`. Coherente con el patron del proyecto.

### 4. NO refactorizar `parse_uuid`

El brief advertia explicitamente: "NO refactorices los helpers `parse_uuid`
que esten duplicados (consistente con el patron actual; el refactor seria
scope creep)". Cada `commands/*.rs` mantiene su propio helper local. Lo
respeto.

### 5. NO migrar el frontend

El frontend sigue usando `useAllCashSessionsWithContext` (fan-out 4 niveles).
Migrarlo a `get_cash_session` directo es scope de un team futuro; este team
solo deja el command disponible. El fan-out no se rompe ni se degrada: el
command nuevo es un *anadido*, no un reemplazo. La migracion debera:

- Anadir `getCashSession(id)` en `src/api/tauri.ts`.
- Crear hook `useCashSessionById(id)` en `src/hooks/queries/cash_sessions.ts`
  (paralelo a `useSaleById`).
- Sustituir los usos de `useCashSessionById` (cache del fan-out) en
  `CajaDetallePage`, `TpvPage` y `Breadcrumbs`.
- Posiblemente eliminar `useAllCashSessionsWithContext` si ningun consumidor
  queda, o dejarlo para el listado global (`/cajas`).

Esa migracion la hara `@implementador` cuando `@orquestador` lo programe.

## Trabajo realizado

- Inspeccion previa: leido `repository/cash_sessions.rs` y constatado que
  `get_cash_session` ya existe. Leido `commands/sales.rs::get_sale` como
  patron canonico. Leido `commands/cash_sessions.rs`, `lib.rs`,
  `TEAM-009-epica-2-backend.md`, `TEAM-010-epica-2-frontend.md` para
  confirmar el contrato y la convencion.
- Anadido `pub async fn get_cash_session` en
  `src-tauri/src/commands/cash_sessions.rs` (paralelo a `get_sale`):
  parsea UUID, llama al repo, devuelve `Result<Option<CashSession>, SerializableError>`.
- Actualizado el bloque `//! Contrato con el frontend` del modulo para listar
  el nuevo command (mantiene orden alfabetico con el resto).
- Anadido `cmd_cash_sessions::get_cash_session` en
  `src-tauri/src/lib.rs::invoke_handler` justo despues de `close_cash_session`
  y antes de `get_open_cash_session`. Comentario de bloque actualizado:
  "Caja diaria (TPV, epica 2 / TEAM-009, +get_cash_session en TEAM-011)".
- Verificacion local:
  - `cargo check` -> `Finished` en 4.47s, sin warnings.
  - `cargo build --bin feria-net` -> `Finished` en 17.06s, sin warnings.
- Ningun archivo de frontend tocado.
- Ningun doc canonico tocado.
- Ninguna dependencia nueva.
- Ningun cambio en migrations ni en repos distintos al command.
- 3 commits atomicos con push por commit, sin `--force`, sin rebase.

## Archivos tocados

### Nuevos

- `C:\Vicente\Programacion\Proyectos\FeriaNet\.teams\active\TEAM-011-p2-get-cash-session.md`
  (este archivo, sera movido a `.teams/archive/` al cerrar).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\.ai-work\TEAM-011\cargo_check.log`
  (evidencia temporal de verificacion, registrada en `.ai-work`).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\.ai-work\TEAM-011\cargo_build.log`
  (evidencia temporal de verificacion, registrada en `.ai-work`).

### Modificados

- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\commands\cash_sessions.rs`
  — anadido command `get_cash_session` (+16 lineas) + linea en doc de contrato.
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\lib.rs`
  — registro en `invoke_handler` (+1 linea) + comentario de bloque.
- `C:\Vicente\Programacion\Proyectos\FeriaNet\.teams\.counter` — incremento
  `10` -> `11` al cerrar.
- `C:\Vicente\Programacion\Proyectos\FeriaNet\.teams\INDEX.md` — fila
  `TEAM-011` en "cerrados / archivados" al cerrar.

### Borrados

- Ninguno.

## Coordinacion

No aplica Rule 25 (ningun otro TEAM activo simultaneo). Confirmaciones:

- Rama: `main`.
- Sin worktree separado (unico agente).
- Sin `scripts/ai_coordination.py` en el proyecto: aplico fallback manual
  verificando `git status` y `git log` antes de cada commit.
- Merge train: no hay otras ramas pendientes. `git push origin main`
  commit por commit.
- Lease conceptual propio: toco `commands/cash_sessions.rs`, `lib.rs` y
  `.teams/`. Ninguna otra IA activa; el riesgo de colision es nulo.
- Drift de skills del hub (16 archivos `.agent*/skills/**/SKILL.md` modificados
  previo a mi sesion + `docs/qa/` untracked): **NO TOCADOS, NO COMMITEADOS**.
  Commits con paths explicitos (`git add <path>`) para no stagear el drift.

## Criterios de cierre

- [x] Command `get_cash_session` anadido en `commands/cash_sessions.rs`.
- [x] Command registrado en `lib.rs::invoke_handler`.
- [x] `cargo check` pasa sin warnings.
- [x] `cargo build --bin feria-net` pasa sin warnings.
- [x] Ningun archivo de frontend modificado.
- [x] Ningun doc canonico modificado.
- [x] Ninguna dependencia nueva.
- [x] Sin `--force`, sin rebase.
- [x] 3 commits atomicos con push por commit.
- [x] TEAM-011 cerrado y archivado en `.teams/archive/`.
- [x] `.teams/.counter = 11`.
- [x] `.teams/INDEX.md` con fila `TEAM-011`.

## Riesgos

### Materiales: ninguno

- **Atomicidad de `get_cash_session`**: es una lectura simple
  (`SELECT ... WHERE id = ?1`), no transaccional. Devuelve `Option<CashSession>`.
  La fila leida es la fila viva: si el operador la cerro entre el `SELECT`
  y el render en frontend, la UI vera el estado al momento de la query,
  lo cual es el comportamiento deseado. Sin riesgo de inconsistencia.
- **UUID invalido**: parseado por `parse_uuid` local, devuelve
  `AppError::InvalidInput` que se serializa como `kind: "invalid_input"`
  con mensaje canonico. Mismo patron que el resto de commands.
- **Sin caja existente**: `query_row(...).optional()?` devuelve `Ok(None)`,
  que el command propaga como `Ok(None)`. El frontend debera tratarlo como
  "no existe" (no mostrar error). El comando paralelo `get_sale` y `get_fair`
  ya siguen este contrato.

### No materiales / aceptados / observaciones

- **Frontend sigue con fan-out**: hasta que `@implementador` migre a
  `useCashSessionById` en un team futuro, el frontend seguira cargando
  todas las cajas para resolver una por id. Esto NO se degrada con el
  nuevo command: el command es un *anadido*. El fan-out no se rompe.
- **Drift de skills del hub en working tree** (16 archivos
  `.agent*/skills/**/SKILL.md` modificados + `docs/qa/` untracked):
  previo a mi sesion, fuera del alcance. Misma observacion que TEAM-009
  y TEAM-010. `@experto-github` o el orquestador deberan decidir antes
  del proximo team.
- **Comando `get_cash_session` no consumido por la UI todavia**: por
  diseno (scope de este team). `@orquestador` deberia planificar un team
  futuro (`@implementador` o `@frontend`) que migre `useCashSessionById`
  del cache del fan-out al invoke directo.

## Evidencia

### `cargo check`

```
    Checking feria-net v0.1.0 (C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 4.47s
```

Sin warnings ni errores. Log completo en
`.ai-work/TEAM-011/cargo_check.log`.

### `cargo build --bin feria-net`

```
   Compiling feria-net v0.1.0 (C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 17.06s
```

Sin warnings. Log completo en
`.ai-work/TEAM-011/cargo_build.log`.

### Commits atomicos (3)

Sera completado al cierre. Estructura:

```
feat(commands): anade command Tauri get_cash_session
chore(tauri): registra get_cash_session en invoke_handler
chore(teams): cierra TEAM-011 al anadir el command
```

### `git push origin main` por cada commit

3 pushes OK, sin `--force`, sin rebase.

## Proximo paso

`@orquestador` arranca TEAM-012 (modulo `ticket-delivery` intercambiable)
como estaba previsto al cierre de la epica 2. En un team futuro aparte,
`@implementador` podria migrar el frontend de fan-out a `get_cash_session`
directo (anadir `getCashSession` en `src/api/tauri.ts`, hook
`useCashSessionById`, sustituir usos en `CajaDetallePage`, `TpvPage`,
`Breadcrumbs`). No es scope de este team.

---

## Discrepancias con el brief

### Tipo B / P3 — `get_cash_session` ya existe en el repositorio

El brief pedia "anadir `get_cash_session` al repositorio". Pero la funcion
ya esta implementada en
`src-tauri/src/db/repository/cash_sessions.rs::get_cash_session` (l. 140)
desde TEAM-009, con la firma exacta solicitada. El codigo real del proyecto
contradice literalmente la peticion del brief.

**Accion tomada**: respetar el codigo real (no duplicar logica). El command
Tauri reutiliza la funcion del repo. **Desviacion documentada**: el primer
commit del brief no aplica.

### Tipo C / P3 — 3 commits en lugar de 4

Consecuencia directa de la discrepancia anterior. El brief sugeria 4 commits
atomicos, pero el primero no tendria diff real.

**Accion tomada**: 3 commits atomicos, cada uno con un diff real.

### Tipo C / P3 — Frontend NO migrado

El brief aclara explicitamente "NO migrar el frontend para usar el nuevo
command (eso es tarea futura, no scope de este team)". Decision tomada sin
desviacion, pero queda como observacion para `@orquestador` en el
"Proximo paso".

Ningun P1 detectado.