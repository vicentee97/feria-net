# TEAM-001 — Bootstrap de arranque del proyecto

- ID: TEAM-001
- Nombre: Bootstrap de arranque del proyecto
- Fecha creacion: 2026-06-26
- Estado: cerrado

## Descripcion
Deja el repositorio con base operativa minima: estructura, `.teams/`, `.questions/`, `.gitignore`, `README.md`, `docs/REGLAS_PROYECTO.md`, `dev.bat` y `git init` local. Sin codigo de aplicacion, sin instalacion de dependencias, sin remoto, sin commits.

## Objetivo
Repositorio listo para empezar la epica 1 (modelo de ferias y atracciones) sin improvisar infraestructura ni depender de contexto conversacional.

## Contexto
- Docs leidos:
  - `docs/SSOT.md` — taxonomia, principios, modelo mental.
  - `docs/product-map.md` — capacidades v1 y futuro.
  - `docs/TODO.md` — roadmap por epicas (epica 0 en curso).
  - `docs/ARCHITECTURE.md` — stack cerrado (Tauri 2.x + React 19 + Rust + SQLite + Supabase).
  - `docs/data-model.md` — entidades y reglas de integridad.
  - `AGENTS.md` — bootstrap canonico, hub multi-IDE, reglas globales.
- Supuestos:
  - Stack cerrado en arquitectura, no se discute aqui.
  - Plataforma Windows-first; `dev.bat` se crea pensando en cmd.exe con UTF-8.
  - Las proyecciones del hub multi-IDE (`.agent/`, `.agents/`, `.codex/`, `.opencode/`, etc.) se dejan a `@experto-github` cuando se configure el remoto; este bootstrap no las ignora ni las versiona.
- Dependencias: ninguna.

## Trabajo realizado
- `.gitignore` base + especifico del stack (Tauri + Vite + Supabase CLI + SQLite + temporales del hub).
- `.teams/` con `TEAM_TEMPLATE.md`, `.counter`, `INDEX.md`, `active/`, `archive/`.
- `.questions/` con `QUESTION_TEMPLATE.md`.
- `README.md` breve apuntando a docs clave.
- `docs/REGLAS_PROYECTO.md` con reglas operativas locales, fuente de verdad por tema y overrides (ninguno por ahora).
- `dev.bat` con menu interactivo Windows (estandar canonico de la skill `generar-bat-interativo`).
- `git init -b main` local; rama `main` creada; sin commits, sin remoto.
- `TEAM-001` creado en `.teams/active/`, cerrado y movido a `.teams/archive/`.

## Archivos tocados
- C:\Vicente\Programacion\Proyectos\FeriaNet\.gitignore
- C:\Vicente\Programacion\Proyectos\FeriaNet\README.md
- C:\Vicente\Programacion\Proyectos\FeriaNet\dev.bat
- C:\Vicente\Programacion\Proyectos\FeriaNet\docs\REGLAS_PROYECTO.md
- C:\Vicente\Programacion\Proyectos\FeriaNet\.teams\.counter
- C:\Vicente\Programacion\Proyectos\FeriaNet\.teams\TEAM_TEMPLATE.md
- C:\Vicente\Programacion\Proyectos\FeriaNet\.teams\INDEX.md
- C:\Vicente\Programacion\Proyectos\FeriaNet\.teams\active\TEAM-001-bootstrap-arranque.md
- C:\Vicente\Programacion\Proyectos\FeriaNet\.teams\archive\TEAM-001-bootstrap-arranque.md
- C:\Vicente\Programacion\Proyectos\FeriaNet\.questions\QUESTION_TEMPLATE.md
- C:\Vicente\Programacion\Proyectos\FeriaNet\.git\ (directorio git, inicializado)

## Coordinacion
No aplica: bootstrap secuencial sin concurrencia. La regla Rule 25 (worktree + lease) entra cuando dos o mas IAs editen superficies compartidas; aqui solo `@documentador` con brief cerrado.

## Criterios de cierre
- [x] Estructura objetivo completa (`.teams/`, `.questions/`, `.gitignore`, `README.md`, `docs/REGLAS_PROYECTO.md`, `dev.bat`).
- [x] `git init -b main` ejecutado; rama `main` activa; sin commits.
- [x] Cinco docs existentes intactos (SSOT, product-map, TODO, ARCHITECTURE, data-model).
- [x] Plantillas reutilizables (`.teams/TEAM_TEMPLATE.md`, `.questions/QUESTION_TEMPLATE.md`).
- [x] `dev.bat` validado: arranca sin errores de parseo, banner correcto, exit 0 con opcion 0.
- [x] `TEAM-001` archivado; `.counter` en `1`.

## Riesgos
- **Desviacion de ruta del estandar del hub**: la skill `generar-bat-interactivo` fija la convencion en `.scripts/dev.bat`. El brief explicito del `@orquestador` situa `dev.bat` en la raiz del proyecto. Se sigue el brief y se documenta como decision material; `@experto-github` puede normalizar a `.scripts/dev.bat` al configurar el remoto si lo considera necesario.
- **Proyecciones multi-IDE no ignoradas**: directorios `.agent/`, `.agents/`, `.codex/`, `.kilo/`, `.kilocode/`, `.opencode/`, `.windsurf/` aparecen como no trackeados. Esto es deliberado: su politica de inclusion/exclusion la decide `@experto-github` con el contexto completo del remoto.
- **Ningun riesgo material sobre la base documental**: los cinco docs canónicos se leyeron pero no se tocaron.

## Evidencia
- `Test-Path` previo a la escritura confirma que ninguno de los archivos a crear existia.
- Salida de `git init -b main` -> `Initialized empty Git repository in .../.git/`, rama `main`.
- Salida de `git status --short` tras la creacion -> muestra archivos untracked coherentes (los del proyecto y los del hub multi-IDE; ninguno que `.gitignore` deberia haber ignorado y no ignora).
- Salida de `dev.bat` validada -> banner correcto, `[OK] Saliendo`, exit code 0, STDERR vacio.
- Encoding verificado en todos los archivos: UTF-8 sin BOM. CRLF en `.bat` y `.gitignore`; LF en markdown y `.counter`.
- `.teams/.counter` = `1` tras el alta de TEAM-001.
- `TEAM-001` presente en `.teams/archive/`, ausente en `.teams/active/`.

## Proximo paso
- Epica 1 (modelo de ferias, ediciones, atracciones, persistencia local): `@ingeniero-backend` (modelo SQLite + migraciones) y `@implementador` (UI con shadcn/ui).
- `@experto-github` formaliza el remoto y el primer commit con la skill `configurar-github` cuando el trabajo este listo para publicar.
- `@auditor-cumplimiento` puede auditar este bootstrap contra las reglas globales y locales.
