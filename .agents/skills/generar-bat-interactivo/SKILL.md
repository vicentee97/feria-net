---
name: generar-bat-interactivo
description: "Usar cuando necesites un .bat interactivo para Windows que cubra desarrollo, build, test, limpieza y diagnostico, generado a partir del proyecto real y sin asumir tecnologias no confirmadas. Crea dev.bat nuevo O normaliza uno existente contra el estandar canonico. TRIGGERS: bat, script interactivo, herramienta CLI, script de desarrollo, .bat, menu de desarrollo, dev.bat, punto de entrada, arrancar el server, levantar el proyecto, menu de dev, modo dev."
---

# Generar bat interactivo

# Objetivo

Producir un punto de entrada `.bat` para Windows que se adapte al stack realmente detectado en el proyecto y se pueda usar como herramienta diaria de desarrollo, sin inventar herramientas y sin dejar al usuario bloqueado con errores triviales de shell.

La skill construye el `.bat` a partir de contexto real (estructura, scripts, `package.json`, `*.sln`, `pyproject.toml`, documentacion, SSOT) y nunca a partir de defaults de memoria.

# Frontera de la skill: GENERADORA Y REFACTORADORA (LEER PRIMERO)

Esta skill hace las dos cosas y el gate de cierre cubre ambos casos:

- **GENERADORA**: crea `.scripts/dev.bat` nuevo cuando el proyecto no lo tiene y el stack se beneficia de un menu interactivo (Node, Next, Vite, .NET, Python con venv, stack full-stack...).
- **REFACTORADORA**: normaliza un `dev.bat` existente que no cumple el estandar canonico, preservando comandos utiles y reemplazando solo lo que rompe el contrato.

- **NEVER** crea `.bat` para stacks que no se benefician de un menu (libreria sin runtime, binario Go, script Python suelto); declara la omision en `docs/SSOT.md`.
- **NEVER** inventa nombres equivalentes (`start.bat`, `run.bat`, `menu.bat`, `wrapper.bat`, `start-dev.bat` + `stop-dev.bat`...): el archivo se llama `dev.bat` y vive en `.scripts/`.
- **NEVER** hace commit/push del `.bat` generado; eso va por `configurar-github`.

El contrato completo del estandar (nombre, cabecera, helpers, prefijos, mensaje de bienvenida, orden del menu, diagnostico) vive en [estandar-dev-bat.md](estandar-dev-bat.md). Esta skillcita ese archivo; no lo duplica.

# Anti-patrones y su correccion

Cada sesgo fuerte del entrenamiento base necesita su par MAL -> BIEN -> EJEMPLO. Reconocer el anti-patron no basta para vencerlo.

- **Inventar nombres equivalentes:** MAL crear `start.bat`, `run.bat`, `menu.bat`, `wrapper.bat`, `iniciar.bat` o partir el flujo en `start-dev.bat` + `stop-dev.bat`. BIEN generar siempre `.scripts/dev.bat` como menu unico donde iniciar/detener/reiniciar son opciones del mismo menu. EJEMPLO un Next.js queda en `.scripts/dev.bat` con opciones 1 dev / 2 build / 3 stop, nunca como dos archivos paralelos.
- **Asumir tecnologia:** MAL poner "Ejecutar Vite" sin `vite` en `package.json`, "dotnet watch" sin `*.sln` o "pytest" sin Python. BIEN inspeccionar `package.json`/`*.sln`/`pyproject.toml`/`Makefile` antes de anyadir cualquier opcion; si no hay evidencia, omitirla. EJEMPLO un proyecto Python con `manage.py` -> option `python manage.py runserver`; sin `manage.py` -> omitir la opcion de dev.
- **Hardcoded paths:** MAL rutas absolutas (`C:\Users\...`). BIEN `%~dp0` + deteccion de la raiz del proyecto. EJEMPLO `if exist "%~dp0package.json" (set "PROJECT_ROOT=%~dp0") else (set "PROJECT_ROOT=%~dp0..")`.
- **Bootstrap amplio:** MAL crear `.bat` para cualquier proyecto por reflejo. BIEN decidir si el stack se beneficia de un menu interactivo; si no, omitir y registrar la decision en SSOT. EJEMPLO una libreria npm de tipos -> omitir `dev.bat` y anotar "`dev.bat` omitido: libreria sin dev server; comandos directos en package.json scripts".
- **Copias espejo multi-IDE:** MAL generar versiones distintas para Codex, OpenCode o Windsurf. BIEN un unico `.scripts/dev.bat` agnostico. EJEMPLO el `.bat` vive en `.scripts/dev.bat` y lo invocan por igual cualquier IDE y el usuario desde cmd.
- **taskkill por nombre:** MAL `taskkill /F /IM node.exe` (mata todos los Node del sistema, incluidos los ajenos al proyecto). BIEN atribuir PID por puerto y matar SOLO ese PID tras confirmacion explicita del usuario. EJEMPLO `netstat -ano | findstr :3000` -> PID 12345 -> `[INFO] PID 12345 ocupa el puerto 3000` -> `set /p CONFIRM=...` -> `taskkill /F /PID 12345`.

# Alcance y limites

- Aplica a proyectos Windows que necesitan un punto de entrada de desarrollo.
- Crea `.bat` nuevo o normaliza uno existente (frontera dual).
- Respeta el idioma visible dominante del proyecto; por defecto del hub, espanol del UI con prefijos `[INFO]`/`[OK]`/`[WARN]`/`[ERROR]`.
- No sustituye a `configurar-entorno`; lee lo que esa skill dejo definido antes de improvisar comandos.
- No redefine arquitectura ni stack; si el stack no encaja en `.bat`, escalar a `@arquitecto`.

# Inputs / contexto obligatorio

- `docs/SSOT.md` y reglas del proyecto.
- `package.json`, `*.sln`, `pyproject.toml`, `Makefile`, `pom.xml`, `build.gradle`, `requirements.txt`, `docker-compose.yml`, `Dockerfile` (los que existan).
- Scripts existentes en el proyecto (`scripts/`, `.scripts/`).
- Documentacion de setup y lo que haya dejado `configurar-entorno`.
- `dev.bat.template` de esta skill como esqueleto base (adaptar, no copiar literal).

# Comportamiento esperado

Flujo: **detectar -> mapear -> generar/normalizar -> validar**.

1. **Detectar** el stack real y la existencia de `.scripts/dev.bat`. Si existe, auditarlo contra [estandar-dev-bat.md](estandar-dev-bat.md); si cumple, dejarlo; si no, normalizarlo. Si no existe, decidir si el stack se beneficia de un menu interactivo.
2. **Mapear** cada opcion del menu a un comando real detectado (script existente, binario invocable, operacion generica segura o accion informativa). Si una opcion no mapea, omitirla. Es mejor 4 opciones reales que 10 inventadas.
3. **Generar/normalizar** aplicando el contrato de [estandar-dev-bat.md](estandar-dev-bat.md): cabecera canonica (`@echo off` / `chcp 65001 >nul` / `setlocal EnableExtensions EnableDelayedExpansion` / `title`), mensaje de bienvenida con `Stack: | Puerto dev: | Gestor: |`, menu en orden dev/build/stop, helpers canonicos, prefijos obligatorios y confirmaciones antes de acciones destructivas.
4. **Validar** que el comando base de cada opcion critica (dev, build, tests, docker) realmente existe o es invocable; revisar quoting, rutas con espacios y `EnableDelayedExpansion`. El archivo "parece correcto" no es evidencia suficiente.

## Reglas de robustez Windows (verificables)

- Cualquier ruta o ejecutable con espacios va entre comillas: `call "%VARIABLE%" ...`.
- `EnableDelayedExpansion` activado; dentro de bloques `if`/`for` revisar que va con `!VAR!` y no `%VAR%`.
- Dev servers comprueban el puerto antes de arrancar; atribuyen el PID al proyecto antes de proponer matarlo y piden confirmacion por PID.
- Errores de shell se traducen a mensajes accionables (`[INFO]`/`[WARN]`/`[ERROR]`), no se devuelven crudos al usuario.

## Validacion real antes de cerrar (GATE MUST)

Si el `.bat` incluye opciones criticas (`dev`, `build`, `tests`, Docker, migraciones), la IA MUST validar de forma proporcional:

- comprobar que el comando base existe o es invocable;
- ejecutar al menos la parte minima del flujo o validar el binario subyacente;
- confirmar que no falla por quoting, rutas con espacios o errores triviales;
- si no puede validar la interaccion completa, validar por separado la orden que esa opcion ejecutara.

# Cierre OBLIGATORIO: gate de auto-cita

Antes de declarar el `.bat` listo, declarar (auto-cita con evidencia, no auto-evaluacion). Maximo 7 items:

- [ ] **Declaro** que inspeccione el proyecto real (`package.json`/`*.sln`/`pyproject.toml`/scripts) antes de generar o normalizar, y que cada opcion del menu mapea a un comando/script real (no inventado).
- [ ] **Declaro** que el archivo es `.scripts/dev.bat`, UTF-8 sin BOM, con cabecera canonica (`@echo off` / `chcp 65001 >nul` / `setlocal` / `title <Proyecto> - Punto de entrada para desarrollo`).
- [ ] **Declaro** que el menu abre en orden dev/build/stop y que el mensaje de bienvenida sigue el formato `Stack: | Puerto dev: | Gestor: |`.
- [ ] **Declaro** que implemente los helpers canonicos aplicables (`:confirm`, `:kill_port`, `:require_node`, `:diagnose`, etc.) con los nombres exactos del estandar, sin variantes tipo `:kill_port_dev`.
- [ ] **Declaro** que las acciones destructivas (matar procesos, borrar `node_modules`/`.next`/`dist`, reinstalar, `docker system prune`) piden confirmacion y matan solo por PID concreto; NEVER `taskkill /IM <imagen>`.
- [ ] **Declaro** que no hardcodee credenciales ni secretos; toda credencial se lee de `.env` o variable de entorno, y la ausencia se reporta con `[ERROR]` apuntando a `.env.example`.
- [ ] **Declaro** el resultado del gate de segunda IA (ver abajo).

## Gate de segunda IA (OBLIGATORIO, no sugerencia)

El agente que genera el `.bat` no es el que lo califica. El `.bat` se ejecuta en Windows con opciones de kill/borrado; el riesgo de auto-engano es alto.

- Si el `.bat` tiene **opciones criticas** (procesos, puertos, borrado de caches, reinstalacion, `docker system prune`) -> delegar OBLIGATORIAMENTE a **@qa-validador** con evidencia de que cada opcion critica ejecuta sin romper por quoting/rutas.
- Si la skill **normaliza un `dev.bat` existente** -> delegar OBLIGATORIAMENTE a **@revisor** para revision de riesgo (no perder comandos utiles del original, no introducir regresiones).
- Si el `.bat` **lee o gestiona credenciales, variables sensibles, tokens o `.env`** -> escalar OBLIGATORIAMENTE a **@especialista-seguridad** antes de cerrar.

# Flujo recomendado

- [ ] Leer SSOT, reglas y documentacion del proyecto + lo que dejo `configurar-entorno`.
- [ ] Detectar stack real y existencia de `.scripts/dev.bat`; decidir crear nuevo o normalizar existente.
- [ ] Mapear opciones del menu a comandos reales; recortar las que no mapeen.
- [ ] Generar/normalizar aplicando [estandar-dev-bat.md](estandar-dev-bat.md) (cabecera, menu dev/build/stop, helpers, prefijos, confirmaciones).
- [ ] Revisar quoting, rutas con espacios y `EnableDelayedExpansion` antes de cerrar.
- [ ] Validar de forma real las opciones criticas (GATE MUST).
- [ ] Resolver el gate de auto-cita y el gate de segunda IA.

# Criterio de resultado bueno

Cierre valido cuando el gate de auto-cita de arriba se cumple con evidencia observable y el gate de segunda IA esta resuelto segun la tipificacion de esta skill. Esta seccion no anyade reglas: es el mirror declarativo del gate, repetido aqui solo porque `validate-hub-skills.ps1` exige el header.

# Mejora proactiva de la skill

Si un fallo corregido durante una generacion o normalizacion revela una laguna reusable del estandar (nuevo helper, nueva regla de robustez Windows, nuevo caso de anti-patron), actualizar [estandar-dev-bat.md](estandar-dev-bat.md) o este archivo. Proactividad solo para reglas reusables, no para ajustes puntuales de un proyecto.

## Triggers
- **Keywords:** bat, .bat, dev.bat, script interactivo, script de desarrollo, herramienta CLI, herramienta de desarrollo, menu de desarrollo, menu de dev, modo dev, modo desarrollo, abrir el server, arrancar el proyecto, levantar el server, punto de entrada, iniciar el entorno, puesta en marcha local, wrapper de desarrollo.
- **Patrones de usuario:** "genera un bat", "crea un menu de desarrollo", "script interactivo para el proyecto", "necesito arrancar el proyecto", "como levanto el server en local", "normaliza mi dev.bat contra el estandar".
- **Encadenamiento:** despues de `configurar-entorno` para reutilizar comandos ya definidos; se activa durante `arrancar-proyecto` cuando el bootstrap siembra el punto de entrada; antes de `validar-calidad` o @qa-validador cuando el `.bat` tenga opciones criticas; si toca credenciales, escalar a @especialista-seguridad.

# Ejemplos de activacion

- "Genera un `.bat` interactivo para este proyecto, analizando primero el contexto y sin asumir herramientas no confirmadas."
- "Tengo un `dev.bat` viejo que no sigue el estandar; normalizalo conservando lo que ya funciona."
- "Crea un menu de desarrollo con dev, build y stop, y validacion de puerto antes de arrancar."
