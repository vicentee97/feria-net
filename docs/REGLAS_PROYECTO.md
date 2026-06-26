# Reglas del proyecto — FeriaNet

Reglas operativas **locales** de FeriaNet. No sustituyen las reglas globales del hub
definidas en `AGENTS.md`; las complementan con convenciones especificas del proyecto.

## Naming canonico

Toda la documentacion, codigo, UI y mensajes usan la taxonomia cerrada en
[`docs/SSOT.md` seccion "Taxonomia canonica"](SSOT.md). Resumen operativo:

- `FeriaNet` (producto) / `Feria` (evento generico) / `Edicion de feria` (instancia anual).
- `Atraccion` (no "ride", no "puesto") / `Caja` / `Ticket` (no "recibo", no "entrada") / `Oferta` / `TPV` / `Feriante`.

## Fuente de verdad por tema

| Tema | Documento canonico |
|---|---|
| Identidad de producto y taxonomia | `docs/SSOT.md` |
| Capacidades y roadmap | `docs/product-map.md` + `docs/TODO.md` |
| Decisiones tecnicas | `docs/ARCHITECTURE.md` |
| Modelo de datos | `docs/data-model.md` |
| Reglas locales del proyecto | `docs/REGLAS_PROYECTO.md` (este doc) |
| Coordinacion y equipos | `.teams/` |
| Preguntas abiertas | `.questions/` |

Si dos documentos contradicen un mismo punto, gana el de la fila superior. Si la
contradiccion no se resuelve, se abre una `QUESTION-NNN`.

## Convenciones de commits

Mensajes en espanol, imperativo, primera linea de **maximo 72 caracteres**.
Formato sugerido:

```
tipo(scope): descripcion corta
```

Tipos aceptados (alineados con Conventional Commits, en espanol):

- `feat`: capacidad nueva visible para el usuario.
- `fix`: correccion de bug.
- `chore`: tarea interna sin cambio funcional (deps, tooling, CI).
- `docs`: solo documentacion.
- `refactor`: cambio interno sin cambio funcional.
- `test`: anadir o corregir tests.
- `style`: formato, sin cambio logico.
- `perf`: mejora de rendimiento.

**Scopes habituales en FeriaNet** (no exhaustivo): `tauri`, `deps`, `db`,
`domain`, `repo`, `commands`, `frontend`, `ui`, `docs`, `teams`.

Las reglas finas de commit, rama, PR y release las formaliza `@experto-github`
con la skill `configurar-github`. Esta seccion es el acuerdo minimo de partida.

## Arranque local del stack Tauri + Rust

Reglas operativas acordadas al cerrar la epica 1:

- **Toolchain Rust**: instalar via `rustup` con toolchain por defecto
  `stable-x86_64-pc-windows-msvc`. **No usar** `cargo install` global; las
  dependencias Rust se instalan por proyecto via `cargo build`.
- **MSVC Build Tools 2022 + Windows 10 SDK** son prerequisito para compilar
  el binario Tauri en Windows. Sin ellos, `cargo build` falla con
  `LNK1104: no se puede abrir el archivo 'msvcrt.lib'`.
- **`.cargo/config.toml`** del repo fija `target`, `LIB`, `INCLUDE` y `PATH`
  al toolchain detectado en esta maquina. Si cambias de maquina o version
  de MSVC/SDK, actualiza ahi los paths antes de compilar.
- **Primera compilacion**: `cargo build` desde `src-tauri/` tarda 3-5 min
  (descarga ~500 crates y compila webview2-com, ring, rusqlite-sys con
  SQLite embebido). Las siguientes son segundos.
- **Comandos canonicos** (definidos en `.scripts/dev.bat`):
  - `npm run tauri dev` — Vite + ventana Tauri en modo desarrollo.
  - `npm run build` — TypeScript + Vite, genera `dist/`.
  - `npm run tauri build` — produce instalador MSI/EXE en
    `src-tauri/target/release/bundle/`.
- **DB local** se crea automaticamente al primer arranque en
  `%APPDATA%\com.ferianet.app\feria-net.db` (Windows). El archivo esta
  en `.gitignore` (`*.db`, `*.db-wal`, `*.db-shm`).

## Prohibido versionar

- Secretos, claves, tokens, `.env`, `.env.local`, `*.pem`, `*.key`.
- `node_modules/`, artefactos compilados (`dist/`, `build/`, `.vite/`).
- `src-tauri/target/`, `src-tauri/gen/`, `*.pdb`.
- Bases de datos locales (`*.db`, `*.db-wal`, `*.db-shm`, `*.sqlite*`).
- Temporales del hub y de IA: `.ai-work/`, `*.tmp`, `*.bak`, `*.restore_*`, `.restore/`.
- Logs (`*.log`, `npm-debug.log*`).

El detalle completo esta en `.gitignore` (raiz del proyecto).

## Overrides sobre el hub

**Ninguno por ahora.** Este proyecto respeta todas las reglas globales del hub.
Si en algun momento una regla local entra en conflicto con una regla global,
se documenta aqui con:

- la regla del hub afectada,
- la regla local que la matiza,
- el motivo,
- y desde que fecha aplica.
