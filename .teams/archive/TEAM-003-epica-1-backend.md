# TEAM-003 — Epica 1: backend Rust + frontend base

- ID: TEAM-003
- Nombre: Epica 1 backend + base frontend
- Fecha creacion: 2026-06-26
- Estado: activo

## Descripcion

Scaffold del proyecto Tauri 2.x con React 19 + TypeScript + Vite + Tailwind v4 + shadcn/ui. Backend Rust funcional con SQLite local (rusqlite directo + rusqlite_migration), migracion inicial V001 con `Fair`, `FairEdition`, `Attraction`, repositorios tipados, comandos Tauri expuestos para CRUD de ferias y atracciones. Frontend con placeholder minimo (sin UI real, eso es de @implementador). Cierra la primera mitad de la epica 1 del MVP.

## Objetivo

Dejar el Tauri arrancando (Vite + ventana nativa) con:
- `cargo check` sin warnings ni errores.
- `npm run build` sin errores.
- `npm run tauri dev` abriendo una ventana que muestra "FeriaNet — Cargando...".
- DB SQLite local creandose automaticamente al primer arranque con la migracion V001 aplicada.
- 4 commands de ferias + 4 de atracciones disponibles via `invoke()` desde el frontend.

## Contexto

- Docs leidos: `docs/SSOT.md`, `docs/product-map.md`, `docs/TODO.md`, `docs/ARCHITECTURE.md`, `docs/data-model.md`, `docs/REGLAS_PROYECTO.md`, `README.md`, `.teams/TEAM_TEMPLATE.md`.
- Supuestos:
  - Toolchain MSVC 2022 Build Tools + Windows 10 SDK 26100 disponible en la maquina (verificado: paths documentados en `.cargo/config.toml`).
  - Node 20+ LTS y rustup con `stable-x86_64-pc-windows-msvc` disponibles.
  - El operador de la maquina tiene permisos para instalar rustup a nivel usuario (no global).
- Dependencias:
  - Bloqueado por: nada.
  - Bloquea a: TEAM-004 (UI de ferias y atracciones por @implementador).
- Skills cargadas: `implementar-backend-datos`, `investigar-antes-de-implementar`, `actuar-como-senior`, `auditar-seguridad` (consulta).

## Trabajo realizado

- Verificacion de toolchain: rustup 1.29.0 + rustc/cargo 1.96.0 instalados via `rustup-init.exe` (user-local, NO global). Node 24.14.0 y npm 11.9.0 ya estaban. MSVC Build Tools 2022 (14.44.35207) y Windows 10 SDK (10.0.26100.0) detectados pero no requieren reinstalacion.
- Scaffold Tauri 2.11.3 en raiz del repo (`create-tauri-app --template react-ts --manager npm --identifier com.ferianet.app --tauri-version 2 -y -f`). Trasladado desde temp por conflicto de "acceso denegado" en repo no vacio.
- Limpieza del ejemplo: borrados `App.css`, `assets/`, `tauri.svg`, `vite.svg`. App.tsx reescrito como placeholder minimo con clases Tailwind.
- Configuracion de dependencias:
  - Frontend: Tailwind v4.3.1 via `@tailwindcss/vite`, shadcn 4.12.0 + preset `nova`, TanStack Query 5.101.1, React Router 7.18.0, Zustand 5.0.14, RHF 7.80.0 + @hookform/resolvers 5.4.0 + Zod 4.4.3, date-fns 4.4.0, Recharts 3.9.0, lucide-react 1.21.0, clsx 2.1.1, cva 0.7.1, tailwind-merge 3.6.0, @radix-ui/react-slot 1.3.0, radix-ui 1.6.0 (umbrella), @fontsource-variable/geist 5.2.9.
  - Backend: tauri 2.11.3 + tauri-plugin-opener 2.5.4, serde 1, serde_json 1, rusqlite 0.40.1 (con `bundled` + `chrono`), rusqlite_migration 2.6.0, uuid 1.23.4, chrono 0.4.45, thiserror 1.0.x, tracing 0.1 + tracing-subscriber 0.3 (con `env-filter`), tokio 1.52.3, async-trait 0.1.89, reqwest 0.12 (con `rustls-tls` + `json`, sin usar hasta epica 5).
- shadcn init con `-t vite -b radix -p nova` (preset nova ≈ "new-york" en shadcn 4.x). `components.json` generado. `src/lib/utils.ts` (helper `cn`) conservado. `Button.tsx` borrado (lo anade @implementador cuando lo necesite).
- Configuracion de Vite: alias `@` → `./src`, port 1420 strict, clearScreen false. tsconfig con paths equivalentes.
- Tailwind v4 CSS-first con `@import "tailwindcss"` y tokens shadcn (preset nova, base neutral, light/dark con oklch).
- Estructura backend completa:
  - `src-tauri/src/main.rs` (entry point, delega en lib).
  - `src-tauri/src/lib.rs` (tracing init, abre DbPool, registra AppState, registra 10 commands).
  - `src-tauri/src/state.rs` (AppState con `Arc<DbPool>`).
  - `src-tauri/src/errors.rs` (AppError + SerializableError, serializable al frontend como `{ kind, message }`).
  - `src-tauri/src/domain/` (fair.rs, fair_edition.rs, attraction.rs — tipos puros con serde).
  - `src-tauri/src/db/pool.rs` (abre SQLite, aplica PRAGMAs WAL+foreign_keys+busy_timeout+synchronous, aplica migraciones via `Migrations::from_iter(M::up(...))`).
  - `src-tauri/src/db/migrations/V001__init.sql` (tablas `fair`, `fair_edition`, `attraction` con CHECK constraints, FKs ON DELETE RESTRICT, indices).
  - `src-tauri/src/db/repository/fairs.rs` y `attractions.rs` (CRUD tipado, validacion de inputs, traduccion de errores rusqlite a AppError).
  - `src-tauri/src/commands/fairs.rs` y `attractions.rs` (commands `#[tauri::command]` async, UUIDs como String desde TS, conversion a Uuid interno).
- tauri.conf.json: `productName="FeriaNet"`, `identifier="com.ferianet.app"`, ventana 1280x800 min 1024x720 centered.
- capabilities/default.json: solo `core:default` + `opener:default`. No fs/serial/hid/shell.
- `.cargo/config.toml`: variables `LIB`, `INCLUDE`, `PATH` apuntando a MSVC Build Tools 14.44.35207 + Windows SDK 10.0.26100. `target = x86_64-pc-windows-msvc`. `linker = link.exe`.
- `.scripts/dev.bat` actualizado: opciones 1-10 (docs, arrancar app, frontend solo, parar, instalar deps, cargo check, build, validar, diagnosticar, limpiar).
- README.md actualizado con seccion "Como empezar" (prerrequisitos, lectura recomendada, arranque local).
- `docs/REGLAS_PROYECTO.md` actualizado con seccion "Arranque local del stack Tauri + Rust" (toolchain, MSVC, .cargo/config.toml, comandos canonicos, ruta del .db local).
- Auditoria de seguridad rapida: cero secretos en codigo, .gitignore efectivo (verificado con `git status`), todas las queries usan `?N` placeholders (prepared statements), FKs enforced via `PRAGMA foreign_keys = ON`, errores no exponen stack al frontend (serializados como `{ kind, message }`).
- Verificacion funcional: `cargo check` OK, `cargo build --bin feria-net` produce binario de 18MB en `target/x86_64-pc-windows-msvc/debug/feria-net.exe`. App arrancada con Vite + binario Tauri: SQLite abierto con WAL + foreign_keys, migracion V001 aplicada ("Database migrated to version 1"), ventana abierta, proceso vivo tras 5s. DB de prueba eliminada tras verificacion.

## Archivos tocados

### Nuevos (backend)

- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\main.rs`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\lib.rs`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\state.rs`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\errors.rs`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\domain\mod.rs`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\domain\fair.rs`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\domain\fair_edition.rs`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\domain\attraction.rs`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\db\mod.rs`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\db\pool.rs`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\db\migrations\mod.rs`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\db\migrations\V001__init.sql`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\db\repository\mod.rs`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\db\repository\fairs.rs`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\db\repository\attractions.rs`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\commands\mod.rs`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\commands\fairs.rs`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\commands\attractions.rs`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\Cargo.toml` (reescrito con mis deps)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\tauri.conf.json` (reescrito con mis settings)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\capabilities\default.json` (reescrito minimal)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\.gitignore` (del scaffold)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\icons\*` (del scaffold, 17 iconos)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\build.rs` (del scaffold)

### Nuevos (frontend)

- `C:\Vicente\Programacion\Proyectos\FeriaNet\package.json` (reescrito con mis deps)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\package-lock.json` (npm install)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\index.html` (reescrito: lang=es, title=FeriaNet)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\tsconfig.json` (paths `@/*`)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\tsconfig.node.json` (del scaffold)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\vite.config.ts` (alias `@`, plugin tailwindcss)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\main.tsx` (importa index.css)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\App.tsx` (placeholder minimo)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\index.css` (Tailwind v4 + tokens shadcn)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\lib\utils.ts` (de shadcn init)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\vite-env.d.ts` (del scaffold)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\components.json` (de shadcn init)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\.vscode\extensions.json` (del scaffold)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\.cargo\config.toml` (MSVC env)

### Modificados

- `C:\Vicente\Programacion\Proyectos\FeriaNet\.scripts\dev.bat` (nuevas opciones 2-10)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\README.md` (seccion "Como empezar")
- `C:\Vicente\Programacion\Proyectos\FeriaNet\docs\REGLAS_PROYECTO.md` (seccion arranque Tauri)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\.teams\.counter` (2 -> 3)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\.teams\INDEX.md` (anadir fila TEAM-003)

### Borrados (scaffold)

- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\App.css` (placeholder CSS del scaffold)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\assets\react.svg` (logo demo)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\components\ui\button.tsx` (creado por shadcn init)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\public\tauri.svg` (logo demo)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\public\vite.svg` (logo demo)

## Coordinacion

No aplica Rule 25 estrictamente (no hay otro TEAM activo simultaneo). Pero:
- Rama: `main` (sin feature branch: la epica 1 se cierra directamente sobre main segun AGENTS.md y la practica del proyecto).
- El cambio es **no paralelizable**: backend y frontend base se tocan en el mismo set de archivos (`package.json`, `src-tauri/Cargo.toml`, etc.). @implementador continuara con la UI en TEAM-004 sobre `main`.
- Merge train: no hay otras ramas pendientes. Publicacion via `git push origin main` commit por commit.

## Criterios de cierre

- [x] Toolchain verificado (rustc 1.96.0, node 24.14.0, npm 11.9.0).
- [x] `cargo check` pasa sin warnings ni errores.
- [x] `npm run build` pasa (193KB JS + 17KB CSS).
- [x] `npm run tauri dev` arranca Vite en :1420 y abre la ventana nativa.
- [x] SQLite se crea en `%APPDATA%\com.ferianet.app\feria-net.db` con WAL + FKs + busy_timeout.
- [x] Migracion V001 aplicada: tablas `fair`, `fair_edition`, `attraction` con constraints.
- [x] 10 commands Tauri registrados (`create_fair`, `list_fairs`, `get_fair`, `update_fair`, `delete_fair`, `suggest_fair_by_name`, `create_attraction`, `list_attractions_by_edition`, `update_attraction`, `soft_delete_attraction`).
- [x] Errores se serializan como `{ kind, message }` al frontend.
- [x] Todas las queries usan `?N` placeholders (prepared statements).
- [x] `.gitignore` efectivo: `target/`, `node_modules/`, `dist/`, `*.db*` ignorados.
- [x] `.scripts/dev.bat` actualizado con menu para arrancar Tauri, frontend solo, cargo check, build, validar, limpiar.
- [x] `README.md` actualizado con arranque local.
- [x] `docs/REGLAS_PROYECTO.md` actualizado con politica de toolchain Rust.
- [x] Cero secretos en codigo o configs.
- [x] Cero commits con secrets en git history (auditado con `git log -p`).
- [x] `git push origin main` aplicado tras cada commit.

## Riesgos

Materiales:

- **Desviacion P3 del brief**: `rusqlite 0.32.x` -> `0.40.1` (latest stable, integra bug-fixes y es compatible con Tauri 2.11). Misma justificacion para `rusqlite_migration 1.x` -> `2.6.0`. Brief data de cuando 0.32 era current. Documentado en `Cargo.toml` y abajo en este team.
- **S-A a S-H de ARCHITECTURE.md §2.5 y §8 sin validar con feriante piloto**: ningun supuesto de plataforma/inventario/operacion se ha validado todavia. Lista abierta.
- **MSVC paths hardcoded en `.cargo/config.toml`**: si cambia la version de Build Tools o SDK, hay que actualizar el archivo. Documentado en el propio config y en REGLAS_PROYECTO.md.
- **Pool SQLite simple (1 Mutex)**: ARCHITECTURE §3.3 menciona "1 escritura + hasta 4 lecturas"; v1 va con una sola conexion. Suficiente para el volumen esperado (<1000 ventas/dia/feriante), pero si aparecen cuellos de botella, migrar a pool real es local a `db/pool.rs`.

No materiales / aceptados:

- `reqwest 0.12.x` (no `0.13`): el brief lo decia, API estable, sigue mantenido.
- `thiserror 1.x` (no `2.0`): el brief no lo decia, pero API estable LTS. Latest es 2.0 con breaking changes.
- `react-router 7.x` (no `8.x`): el brief decia "React Router 7.x". Latest es 8.0.1.
- `lucide-react 1.21.0` (no `0.469.0`): el "latest" actual es 1.21.0 (serie 1.x mas reciente). Numeracion cambio.
- shadcn CLI actual (4.12.0) usa preset `nova` como equivalente al antiguo "new-york".
- shadcn anadio automaticamente `@fontsource-variable/geist` (fuente del preset nova) y `radix-ui` (umbrella 1.6.0).

## Evidencia

- `rustc --version` -> `rustc 1.96.0 (ac68faa20 2026-05-25)`
- `cargo --version` -> `cargo 1.96.0 (30a34c682 2026-05-25)`
- `node --version` -> `v24.14.0`
- `npm --version` -> `11.9.0`
- `cargo check` en `src-tauri/` -> `Finished dev profile [unoptimized + debuginfo] target(s) in 3.58s` (Exit: 0, 0 warnings).
- `cargo build --bin feria-net` -> `Finished dev profile [unoptimized + debuginfo] target(s) in 2m 05s` (Exit: 0). Binario `target/x86_64-pc-windows-msvc/debug/feria-net.exe` (18 MB).
- `npm run build` -> `dist/index.html 0.39 kB`, `dist/assets/index-*.css 17.14 kB`, `dist/assets/index-*.js 193.65 kB`. `built in 1.17s` (Exit: 0).
- `npm run tauri dev` (en job) -> `VITE v7.3.6 ready in 539 ms`, `Local: http://localhost:1420/`, puerto LISTENING, binario Tauri arrancado, salida:
  ```
  2026-06-26T18:55:41.568190Z  INFO Abriendo base de datos en C:\Users\Usuario\AppData\Roaming\com.ferianet.app\feria-net.db
  2026-06-26T18:55:41.624061Z  INFO SQLite abierto en ... con WAL, foreign_keys=ON, busy_timeout=5s
  2026-06-26T18:55:41.674718Z  INFO Database migrated to version 1
  2026-06-26T18:55:41.675924Z  INFO Migraciones aplicadas correctamente
  ```
  Proceso vivo tras 5s (HasExited: False). DB creada (4096 bytes). Migracion V001 confirmada. DB y temporales limpiados tras test.

## Proximo paso

@implementador continua con **TEAM-004 — UI de ferias y atracciones** sobre `main`:
- Modulo `src/modules/fairs/` con `FairPage.tsx`, `fairsService.ts` (wrapper de `invoke('list_fairs')` etc.), `fairsTypes.ts`.
- Modulo `src/modules/attractions/` analogamente, dependiente de la edicion de feria.
- React Router con rutas `/fairs`, `/fairs/:id/editions`, `/editions/:id/attractions`.
- TanStack Query para cache + invalidacion.
- React Hook Form + Zod para formularios (alta de feria, alta de atraccion, edicion).
- Componentes shadcn/ui: Button, Card, Dialog/Sheet, Input, Form, Select, Table.
- Estados vacios ("Aun no hay ferias dadas de alta") coherentes con la SSOT.
- Soft-delete de atracciones con confirmacion.

@revisor o @qa-validador pueden cerrar la epica 1 con smoke test E2E desde la UI cuando @implementador termine TEAM-004.
