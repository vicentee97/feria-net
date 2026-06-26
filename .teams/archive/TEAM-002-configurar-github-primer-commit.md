# TEAM-002 — Configurar GitHub y primer commit

- ID: TEAM-002
- Nombre: Configurar GitHub y primer commit
- Fecha creacion: 2026-06-26
- Estado: cerrado

## Descripcion
Crear el repositorio remoto en GitHub para FeriaNet, mover `dev.bat` de la raiz
a `.scripts/dev.bat` siguiendo la convencion del hub, generar el primer commit
coherente del bootstrap del proyecto y empujar la rama `main`. Es el cierre
operativo de la fase 0 (bootstrap) y deja el repo listo para que la epica 1
arranque contra remoto.

## Objetivo
- Repositorio remoto `feria-net` creado en `github.com/vicentee97` y vinculado
  a este clone como `origin`.
- `dev.bat` vive en `.scripts/dev.bat` y ningun documento canonico lo cita en
  la raiz.
- Primer commit en `main` con estructura documental + proyecciones multi-IDE,
  pusheado a `origin/main`.
- `TEAM-002` archivado y `.teams/.counter` incrementado a `2`.

## Contexto
- Docs leidos: `docs/SSOT.md`, `docs/ARCHITECTURE.md`, `docs/REGLAS_PROYECTO.md`,
  `README.md`, `AGENTS.md`, `.teams/TEAM_TEMPLATE.md`, `.gitignore`.
- Skill normativa: `configurar-github`. Skill auxiliar: `documentar-con-criterio`.
- Estado Git inicial: rama `main` creada por `git init -b main`, sin commits,
  sin remoto, 16 items untracked (incluidos 8 directorios de proyecciones
  multi-IDE y `dev.bat` en raiz).
- Auth GitHub: CLI `gh` autenticada como `vicentee97` con scopes `repo` y
  `workflow`; protocolo HTTPS; token en keyring.
- Decisiones del orquestador previas: las proyecciones multi-IDE SI se incluyen
  en el primer commit (justificacion: que el proyecto venga listo al clonar
  sin regenerar configs locales). `dev.bat` debe vivir en `.scripts/dev.bat`.
- Hub: el `AGENTS.md` declara `1.03.00` (hash `68ca1ce9...`) pero el hub real
  esta en `1.04.00` (hash `b1da9d2f...`). No existe `globalize.ps1` en este
  proyecto todavia. Ver "Riesgos".

## Trabajo realizado
- Mover `dev.bat` de raiz a `.scripts/dev.bat` (FileSystem move; nada trackeado
  todavia, `git mv` no aplica).
- Actualizar `README.md`: el bloque "Estructura del repo" pasa de listar
  `dev.bat` en raiz a `.scripts/dev.bat` dentro de `.scripts/`.
- Confirmar que `docs/REGLAS_PROYECTO.md` no menciona la ruta de `dev.bat`
  (no requiere cambio).
- Normalizar encoding de `README.md` a UTF-8 sin BOM y CRLF (estaba en LF puro,
  contravenia la regla del proyecto).
- Verificar encoding de `.scripts/dev.bat`: UTF-8 sin BOM, 275 lineas CRLF,
  0 LF-only.
- Verificar autenticacion de `gh` y capturar usuario: `vicentee97`.
- Decidir nombre del repo: `feria-net` (kebab-case, coincide con el producto,
  idiomático en GitHub). Primera opcion del brief, sin colision.
- Crear repositorio remoto `https://github.com/vicentee97/feria-net` con
  `gh repo create feria-net --public --description "..."` (sin `--source`,
  sin `--push`, sin `--add-readme`, sin `.gitignore` autogenerado, sin
  licencia; el repo queda vacio en remoto).
- Vincular remoto local con `git remote add origin <URL>` y verificar con
  `git remote -v`.
- Auditar staging antes del commit: cero `.env*`, cero archivos
  `credentials*`, cero patrones de secretos reales (todas las coincidencias
  de "secret/token/password" son terminologia de politica en docs y
  proyecciones). Conteo de proyecciones multi-IDE: 30-46 archivos por
  directorio (totales coherentes).
- `git add .` y verificar `git status --short` antes de commitear.
- Crear primer commit con mensaje `chore(bootstrap): estructura base, docs y
  primer commit` (54 caracteres, dentro del limite de 72 de
  `REGLAS_PROYECTO.md`).
- `git push -u origin main` para establecer upstream.

## Archivos tocados
- `C:\Vicente\Programacion\Proyectos\FeriaNet\dev.bat` -> movido
- `C:\Vicente\Programacion\Proyectos\FeriaNet\.scripts\dev.bat` -> creado (movido)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\README.md` -> modificado (ruta + encoding)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\.teams\active\TEAM-002-configurar-github-primer-commit.md` -> creado (este archivo)
- Repositorio remoto GitHub: `https://github.com/vicentee97/feria-net` -> creado

## Coordinacion
No aplica: trabajo secuencial en un unico PC, sin `scripts/ai_coordination.py`
en este proyecto, sin leases activos, sin otras IAs registradas en
`.teams/active/` al inicio. Rule 25 cae al fallback manual: cero ramas
remotas, unica rama local `main`, unico TEAM previo archivado (TEAM-001).
Cero riesgo de colision.

## Criterios de cierre
- [x] Repositorio remoto `feria-net` creado en cuenta `vicentee97`.
- [x] `origin` vinculado a `https://github.com/vicentee97/feria-net`.
- [x] `dev.bat` en `.scripts/dev.bat`, no en raiz.
- [x] `README.md` y `docs/REGLAS_PROYECTO.md` no mencionan `dev.bat` en raiz.
- [x] Encoding UTF-8 sin BOM y CRLF en `.scripts/dev.bat` y `README.md`.
- [x] Primer commit en `main` pusheado a `origin/main`.
- [x] `TEAM-002` archivado en `.teams/archive/`.
- [x] `.teams/.counter` = `2`.
- [x] `.teams/INDEX.md` con fila de `TEAM-002` en "cerrados / archivados".

## Decisiones que merecen quedar registradas
- **Nombre del repo**: `feria-net` (kebab-case) en lugar de `FeriaNet` literal.
  Coincide con la propuesta primaria del brief y con el patron idiomatico
  de GitHub (separador de palabras en kebab-case). Sin colision en el
  primer intento. Alternativas (`ferianet`, `feria-net-app`, `ferianet-mvp`)
  no necesarias.
- **Mensaje del commit**: `chore(bootstrap): estructura base, docs y primer
  commit` (54 chars) en lugar del propuesto por el brief que media 77
  caracteres y excedia el limite de 72 fijado por `docs/REGLAS_PROYECTO.md`.
  Mismo sentido semantico, dentro de limite.
- **Proyecciones multi-IDE trackeadas**: respeto la decision explicita del
  orquestador de incluirlas en el primer commit para que el proyecto venga
  listo al clonar.

## Riesgos
- **Riesgo amarillo (no bloqueante)**: el hub CerebroOperativoIA esta
  desincronizado respecto al `AGENTS.md` local. El hub real es `1.04.00`
  (hash `b1da9d2f...`) pero el `AGENTS.md` declara `1.03.00` (hash
  `68ca1ce9...`). Las proyecciones multi-IDE (`/.agent/`, `/.agents/`,
  `/.cerebro-operativo/`, `/.codex/`, `/.kilo/`, `/.kilocode/`,
  `/.opencode/`, `/.windsurf/`) son archivos generados del hub; en este
  proyecto estan congeladas en la version 1.03.00. Si en algun momento
  futuro se ejecuta `globalize.ps1` desde este proyecto, esas proyecciones
  se regeneraran a la version del hub activa y aparecera un diff en el
  siguiente commit. **Mitigacion recomendada**: ejecutar `globalize.ps1`
  como siguiente tarea (proximo paso de este TEAM) y aceptar el diff
  generado como commit separado `chore(hub): re-sincroniza proyecciones
  multi-IDE con hub 1.04.00`. No se ha hecho en este commit para mantener
  el bootstrap minimo, coherente y predecible.
- Riesgo material cero en este commit: no se commitean secretos (auditoria
  previa con grep confirma cero `.env*`, cero `credentials*`, cero
  patrones de claves reales), no se commitean archivos de runtime
  (`*.db`, `*.sqlite*`, `node_modules/`, `src-tauri/target/`, `.ai-work/`
  todos filtrados por `.gitignore`), el remoto se creo sin contenido
  autogenerado que pudiera entrar en conflicto con el primer commit.
- Riesgo operativo bajo: `git push -u origin main` es irreversible (sube
  contenido a remoto publico); pero el contenido es exactamente el que
  el usuario autorizo explicitamente en este brief.

## Evidencia
- `git status --short` antes del commit -> 16 entradas untracked, sin
  modificaciones sobre archivos trackeados (no habia tracked).
- `gh auth status` -> `Logged in to github.com account vicentee97 (keyring)`,
  `Active account: true`, scopes `gist, read:org, repo, workflow`.
- `gh repo create feria-net --public --description "..."` -> URL
  `https://github.com/vicentee97/feria-net`, exit code 0.
- `git remote -v` -> `origin https://github.com/vicentee97/feria-net (fetch)`
  y `(push)`.
- `git log --oneline -3` tras push -> ver salida real en la seccion
  "Resultado" del retorno a `@orquestador`.
- Hash corto del commit -> ver seccion "Resultado".
- Encoding de `.scripts/dev.bat`: 10174 bytes, sin BOM, 275 lineas CRLF,
  0 LF-only.
- Encoding de `README.md` post-cambio: sin BOM, 41 lineas CRLF, 0 LF-only.
- `gh repo view vicentee97/feria-net --json url,name` -> confirmacion
  posterior al push.

## Proximo paso
- **Inmediato tras este TEAM**: ejecutar `globalize.ps1` desde la raiz del
  proyecto (una vez disponible) para regenerar las proyecciones multi-IDE
  a la version del hub activa (`1.04.00`) y aceptar el diff en un commit
  aparte, fuera del bootstrap.
- **Siguiente bloque de trabajo**: arrancar la **epica 1** — modelo de
  ferias, ediciones de feria y atracciones. Brief ejecutivo a
  `@ingeniero-backend` (modelo de datos SQLite + primera migracion +
  seed minimo) y `@implementador` (UI de ferias y atracciones con
  shadcn/ui sobre el stack definido en `docs/ARCHITECTURE.md`).
- Coordinacion: al abrir la primera rama paralela, abrir worktree y
  registrar lease via `<hub-resuelto>/scripts/ai_coordination.py` cuando
  exista; hasta entonces, fallback manual segun Rule 25.