# FeriaNet

Herramienta de gestion de ventas para feriantes que llevan atracciones a ferias: registra ferias, atracciones, cajas y tickets, vende e imprime localmente sin depender de internet. Detalle funcional en [`docs/SSOT.md`](docs/SSOT.md).

## Estado

**MVP en construccion.** Proyecto nuevo, sin codigo todavia. Estructura operativa y documentacion base asentadas; la implementacion arranca con la epica 1 (modelo de ferias y atracciones).

## Stack

Escritorio **Windows-first** con **Tauri 2.x** (Rust) + **React 19** + **Vite** + **Tailwind v4** + **shadcn/ui**. Persistencia local **SQLite**; sincronizacion opcional a **Supabase** para consulta remota sin login. Detalle arquitectonico completo en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Estructura del repo

```
docs/           # SSOT, product-map, TODO, arquitectura, modelo, reglas
.teams/         # registro operativo de trabajos (TEAM-NNN)
.questions/     # preguntas abiertas y decisiones pendientes
.scripts/       # scripts de desarrollo Windows (punto de entrada: dev.bat)
.gitignore      # base general + stack
```

## Como se trabaja aqui

- Reglas locales del proyecto: [`docs/REGLAS_PROYECTO.md`](docs/REGLAS_PROYECTO.md).
- Reglas globales del hub (multi-IA, skills, agentes): [`AGENTS.md`](AGENTS.md).
- Cualquier cambio material se abre como `TEAM-NNN` en `.teams/active/` y se archiva al cerrar.

## Como empezar

### Prerrequisitos

- **Node.js 20+ LTS** (probado con 24.14.0).
- **Rust estable** via `rustup` con toolchain `stable-x86_64-pc-windows-msvc` (probado con 1.96.0).
- **MSVC Build Tools 2022** + **Windows 10 SDK** (necesarios para compilar el binario Tauri).
- Las rutas concretas del toolchain MSVC asumidas estan documentadas en
  [`.cargo/config.toml`](.cargo/config.toml). Si tu instalacion es distinta,
  actualiza ahi los paths `LIB` / `INCLUDE` / `PATH` para `cargo`.

### Lectura recomendada

Orden sugerido antes de tocar codigo:

1. [`docs/SSOT.md`](docs/SSOT.md) — que es el producto y que no es.
2. [`docs/product-map.md`](docs/product-map.md) — capacidades de v1 y futuro.
3. [`docs/TODO.md`](docs/TODO.md) — roadmap operativo por epicas.
4. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — como se construye.
5. [`docs/data-model.md`](docs/data-model.md) — entidades y reglas de integridad.

### Arranque local

Una vez instaladas las dependencias (`npm install`), el punto de entrada
oficial en Windows es `.scripts\dev.bat` (menu interactivo). Desde ahi:

- Opcion **2**: arranca la app completa (Vite + ventana Tauri). Equivale a
  `npm run tauri dev` y abre la ventana nativa cuando termina la primera
  compilacion (~3-5 min la primera vez, segundos las siguientes).
- Opcion **3**: solo el frontend Vite en `http://localhost:1420`, sin abrir
  ventana Tauri (util para iterar UI sin recompilar Rust).
- Opcion **6**: `cargo check` para validar Rust sin link completo.
- Opcion **7**: build de produccion (`npm run tauri build`) que produce el
  instalador MSI/EXE en `src-tauri\target\release\bundle\`.

Equivalente directo desde PowerShell o cmd:

```powershell
npm install          # solo la primera vez o tras cambiar deps
npm run tauri dev    # arranca Vite + ventana Tauri
```

## Proximo paso macro

**Epica 1** — modelo de ferias, ediciones de feria y atracciones. Implementacion en manos de `@ingeniero-backend` (modelo de datos SQLite + migraciones) y `@implementador` (UI con shadcn/ui). `@experto-github` formaliza el remoto y el primer commit cuando el trabajo este listo para publicar.
