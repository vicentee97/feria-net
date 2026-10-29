# Estandar canonico de dev.bat (referencia de generar-bat-interactivo)

El nucleo del metodo (frontera GENERADORA Y REFACTORADORA, anti-patrones, gate de auto-cita, gate de segunda IA) vive en [SKILL.md](SKILL.md). Este archivo fija el contrato operativo del `.bat` generado o normalizado: se cita cuando se esta escribiendo o auditando un `dev.bat` concreto, no se lee de punta a cabo por rutina.

Cada regla es dura (MUST/NEVER) salvo que diga "preferir". Las excepciones se documentan explicitamente en `docs/SSOT.md` del proyecto, no se dejan a la libre interpretacion.

## Nombre y ubicacion

- Nombre fijo del archivo: `dev.bat`. NEVER variantes (`start.bat`, `run.bat`, `menu.bat`, `wrapper.bat`, `iniciar.bat`, `start-dev.bat` + `stop-dev.bat`...).
- Ubicacion fija: `.scripts/dev.bat`. La convencion del hub es `.scripts/` para todo lo de tooling.
- Excepcion justificada unica (rara): monorepo donde el entrypoint vive en un subdirectorio que no debe llenarse de scripts, o proyecto cuya convencion interna exige raiz. La raiz NEVER es la opcion por defecto; si se usa, justificar en `docs/SSOT.md`.

## Encoding y cabecera canonica

Encoding UTF-8 sin BOM, CRLF (Windows). La cabecera va en este orden y posicion exactos, sin bloque de comentarios intercalado:

- Linea 1: `@echo off`
- Linea 2: `chcp 65001 >nul` (primera linea no comentada, sin excepciones)
- Linea 3: `setlocal EnableExtensions EnableDelayedExpansion`
- Linea 4: `title <NombreProyecto> - Punto de entrada para desarrollo`

Los comentarios de cabecera (descripcion, autor, fecha) van DESPUES de la linea 4, no antes. Excepcion: un bloque entre `@echo off` y `chcp 65001 >nul` SOLO si documenta una condicion critica (ej. "este bat no se ejecuta en produccion").

## Idioma y prefijos

- Idioma visible del UI: espanol por defecto del hub; respetar el idioma dominante del proyecto si esta claro en SSOT.
- Prefijos obligatorios: `[INFO]`, `[OK]`, `[WARN]`, `[ERROR]`.
- NEVER mezclar con prefijos en ingles (`INFO`, `OK`, `WARN`, `ERROR` sin corchetes) salvo cuando una herramienta externa los reemita.
- NEVER emojis en titulos, mensajes, opciones de menu o prompts.
- Preferir ASCII sin tildes en los mensajes criticos del UI para maxima portabilidad entre consolas Windows; los comentarios del codigo pueden tener tildes.

## Mensaje de bienvenida

Al abrir el menu (antes del primer `echo` de opciones), el `dev.bat` MUST mostrar:

```
========================================
  <NombreProyecto> - Punto de entrada para desarrollo
========================================
  Stack: <Stack detectado> | Puerto dev: <PORT> | Gestor: <PKG_MANAGER>
========================================
```

`<NombreProyecto>` coincide con el `title`. Si un dato no aplica (proyecto sin gestor de paquetes), usar `n/a`.

## Estructura y orden del menu

- Un unico archivo con menu interactivo. Iniciar/detener/reiniciar un mismo servicio son opciones del mismo menu, NEVER scripts separados.
- Primeras 3 opciones en este orden (ergonomia: las 3 mas usadas primero):
  1. Iniciar dev server (con apertura automatica de navegador salvo excepcion documentada).
  2. Compilar / Build.
  3. Detener dev server del puerto (o equivalente).
- Las opciones siguientes pueden variar (lint, test, clean, diagnostico...) segun el stack.
- `0 - Salir` siempre la ultima opcion. Numerar del 1 al N.
- El menu MUST incluir al menos: opcion de dev, opcion de diagnostico y opcion de salida limpia.

## Apertura automatica del navegador al iniciar dev

Cuando el stack tiene dev server web (Next, Vite, CRA, Angular dev server...), la opcion de dev MUST:

1. Iniciar el dev server.
2. `timeout /t 3 /nobreak >nul` para que arranque.
3. `start "" "http://localhost:<PORT>"`.

Excepciones (documentar con `[INFO]` claro): stack no web (.NET WinForms, scripts Python puros, APIs backend sin UI), proyecto que usa tunel externo como flujo principal (Cloudflare tunnel) y la UI se accede por la URL del tunel, o el usuario configuro en SSOT que no quiere apertura automatica.

## Helpers canonicos (nombres y firmas exactos)

Cualquier `dev.bat` del hub MUST usar estos nombres cuando implemente un helper con ese proposito. Las variaciones (`:kill_port_dev`, `:confirm_action`...) estan prohibidas salvo justificacion documentada en el `.bat` y en la SSOT del proyecto.

| Helper | Firma | Proposito |
|---|---|---|
| `:print_section` | `<texto>` | Imprime titulo/seccion con formato `[INFO]`. |
| `:ensure_project` | (sin args) | Valida que estamos en la raiz del proyecto (existe `package.json`, `*.sln`, `pyproject.toml` o equivalente). |
| `:check_port` | `<puerto>` | Devuelve `PORT_PID` global si el puerto esta ocupado, vacio si libre. Implementacion con `netstat -ano`. |
| `:confirm` | `<mensaje>` | Pregunta S/N con `choice /c SN /n /m`. Devuelve `CONFIRM_ANSWER` (`0` Si, `1` No). |
| `:kill_port` | `<puerto>` | Atribuye proceso al puerto, pide confirmacion, mata SOLO el PID concreto. NEVER mata por nombre de imagen. |
| `:detect_package_manager` | (sin args) | Detecta gestor (npm, bun, pnpm, yarn). Devuelve `PKG_MANAGER`. |
| `:require_node` | (sin args) | Aborta con `[ERROR]` claro si Node no esta en PATH. Usar en proyectos Node. |
| `:diagnose` | (sin args) | Imprime diagnostico del entorno (runtimes, gestor, puerto, archivos, variables). Salida con `[OK]/[WARN]/[ERROR]`. |

## Confirmaciones obligatorias

Antes de cualquiera de estas acciones, confirmacion explicita via `:confirm` o `choice /c SN /n /m`:

- Matar cualquier proceso (incluso si parece seguro), identificando el PID.
- Eliminar `node_modules/`, `.next/`, `dist/`, `build/`, caches o artefactos.
- Reinstalar dependencias desde cero (doble confirmacion: borrar + reinstalar).
- Tocar puertos ocupados por terceros (identificar proceso y PID).
- `docker system prune`, `npm cache clean --force` o equivalente destructivo.
- `git push`, `git reset`, etc. (raro en un `dev.bat`; si lo hay, doble confirmacion).

NEVER usar `taskkill /IM <imagen>` que mate por nombre de imagen (ej. `taskkill /F /IM node.exe`). ALWAYS matar por PID concreto.

## Verificacion de puerto y dev servers

- Antes de iniciar un dev server, la opcion de dev MUST comprobar si el puerto esperado esta libre (helper `:check_port`).
- Si esta ocupado, intentar atribuir el proceso al proyecto actual (por nombre de imagen, ruta de trabajo o argumentos de linea de comando). Si la atribucion es razonable, pedir confirmacion para terminar SOLO ese PID.
- Si la atribucion no es clara, informar del PID y dejar la decision al usuario; NEVER matar automaticamente.
- La limpieza se basa en el estado final real, no en un error intermedio de `taskkill`.

## Credenciales y secretos

- NEVER hardcodear credenciales, secretos, API keys, contrasenas, tokens, connection strings o cualquier dato sensible dentro del `.bat`.
- Toda credencial se lee de `.env` o de variable de entorno ya definida.
- NEVER leer credenciales desde archivos versionados distintos de `.env.example`.
- Si el proyecto requiere credenciales para arrancar, el script detecta la ausencia de la variable y muestra `[ERROR]` claro apuntando a `.env.example`.

## Diagnostico estandar

La opcion de diagnostico (en el orden que sea) MUST listar al menos:

- Version del runtime (`node --version`, `dotnet --version`, `python --version`).
- Gestor de paquetes y su version (`npm --version`, `bun --version`...).
- Puerto dev: estado (LIBRE / OCUPADO por PID X).
- Archivos criticos: `[OK] / [FALTA]` para `package.json`, `node_modules/`, `.env.local`, `.next/` o equivalente.
- Variables de entorno: deteccion dinamica desde `.env.example`, NEVER hardcoded.

## Salida del menu

- `0 - Salir` siempre la ultima opcion.
- Al salir: `endlocal` y `exit /b 0`.
- Si hay procesos iniciados por el `dev.bat` que siguen vivos al salir, advertir con `[WARN]` y listar los PIDs.

## Compatibilidad hacia atras y migracion

Este estandar es retroactivo: aplica a cualquier `dev.bat` que se cree o modifique a partir de su inclusion. Los `dev.bat` ya publicados pueden tener desviaciones y se normalizan en una pasada posterior contra la lista de auditoria de abajo.

## Lista de auditoria para dev.bat existentes

Cualquier agente que normalice un `dev.bat` contra este estandar MUST verificar:

- [ ] Cabecera canonica en posicion exacta (lineas 1-4).
- [ ] Apertura automatica de navegador al iniciar dev (o excepcion documentada).
- [ ] Helpers con nombre canonico (sin variaciones).
- [ ] Prefijos en espanol consistentes (`[INFO]`/`[OK]`/`[WARN]`/`[ERROR]`).
- [ ] Mensaje de bienvenida en formato estandar (`Stack: | Puerto dev: | Gestor: |`).
- [ ] Primeras 3 opciones en orden: dev, build, stop.
- [ ] Diagnostico con version de runtime, gestor, puerto, archivos y variables.
- [ ] Confirmaciones antes de acciones destructivas.
- [ ] Encoding UTF-8 sin BOM, CRLF.
- [ ] Sin emojis.
- [ ] Sin credenciales hardcoded; lectura desde `.env`/variables.
- [ ] Sin `taskkill /IM` por nombre de imagen; siempre por PID.
