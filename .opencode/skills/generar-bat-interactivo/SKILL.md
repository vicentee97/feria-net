---
name: generar-bat-interactivo
description: "Analiza el proyecto actual y genera un .bat interactivo util para desarrollo, build, test, limpieza y diagnostico sin asumir tecnologias no confirmadas por el contexto. TRIGGERS: bat, script interactivo, herramienta CLI, script de desarrollo, .bat, menu de desarrollo."
---

# Objetivo
Crear un `.bat` interactivo para el proyecto actual, útil para el desarrollo diario y **adaptado al stack realmente detectado en el proyecto**, evitando asumir herramientas que no existan.

La IA debe construir el `.bat` a partir del contexto real del proyecto: estructura, scripts, comandos existentes, documentación, SSOT, archivos de configuración y herramientas detectadas.

# Alcance y límites
- Aplica a la generación de `.bat` para proyectos Windows.
- No inventa herramientas o comandos ausentes en el contexto.
- Si faltan datos críticos, debe reducir el menú a opciones confirmadas.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md) y reglas específicas asociadas.
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- Documentación del proyecto.
- Archivos de configuración detectables (package.json, .sln, Makefile, etc.).

Si existe una definición previa del entorno local, comandos base o setup del proyecto, la IA debe leerla antes de generar el `.bat`. En particular, debe apoyarse en lo que haya dejado `configurar-entorno` para no inventar comandos ni omitir requisitos importantes.

# Comportamiento esperado

Antes de detallar opciones, inventaría scripts, comandos y herramientas reales del proyecto para evitar suposiciones. Cuando el stack esté claramente identificado (por ejemplo, dotnet, npm, Maven), usa esas utilidades en el menú; si no están presentes, omite esas opciones.

## 1. Analizar antes de generar
Antes de escribir el `.bat`, la IA debe inspeccionar el proyecto y localizar, si existen:

- `package.json`
- `*.sln`, `*.csproj`
- `Makefile`
- `pom.xml`, `build.gradle`, `gradlew`
- `cargo.toml`
- `requirements.txt`, `pyproject.toml`
- `docker-compose.yml`, `Dockerfile`
- scripts existentes
- documentación del proyecto
- SSOT y reglas del proyecto

Si durante esta inspección detecta que faltan comandos base, setup documentado o definición mínima del entorno, debe recomendar ejecutar primero `configurar-entorno` en lugar de improvisar un `.bat` incompleto.

La IA debe usar esa información como fuente para decidir qué opciones incluir en el menú.

## 2. No asumir tecnología
La IA **sí debe** aprovechar las tecnologías detectadas (por ejemplo, comandos `dotnet`, `npm`, `gradlew`), pero **no** debe añadir opciones específicas cuando el proyecto no provee evidencias de esa herramienta.

Ejemplos de mal enfoque:

- poner "Ejecutar Vite" sin haber detectado Vite
- poner "dotnet watch" sin haber detectado un proyecto .NET
- poner "pytest" sin haber detectado Python y tests asociados

Si una tecnología no está respaldada por el contexto, la IA debe evitarla.

## 3. Priorizar opciones genéricas y útiles
El `.bat` debe incluir opciones que suelen tener valor en muchos proyectos, siempre traducidas al contexto real detectado.

Opciones candidatas:

- `1 - Modo desarrollo`
- `2 - Compilar`
- `3 - Ejecutar tests`
- `4 - Limpiar artefactos temporales`
- `5 - Reinstalar dependencias o restaurar paquetes`
- `6 - Diagnóstico del proyecto`
- `7 - Abrir documentación o SSOT relevante`
- `8 - Salir`

La IA puede añadir, quitar o renumerar opciones según el proyecto.

## 4. Mapear cada opción a algo real
Cada entrada del menú debe corresponder a uno de estos casos:

- un comando ya existente en el proyecto
- un script detectado
- una operación genérica segura y razonable
- una acción informativa útil para el desarrollador

Si una opción no puede mapearse a algo real, debe omitirse.

## 5. Diseñar el `.bat` para uso humano
El archivo generado debe ser cómodo para una persona:

- menú claro
- títulos legibles
- mensajes de error útiles
- vuelta al menú tras completar una acción cuando tenga sentido
- opción de salir
- manejo básico de entradas inválidas
- uso de `set /p`, `if`, `goto`, `call` y `pause` cuando proceda

Además:

- debe respetar el idioma visible dominante del proyecto o del usuario si está claro en SSOT, documentación o petición directa;
- no debe obligar al usuario a interpretar problemas internos del entorno si el script puede traducirlos a una decisión simple;
- las opciones importantes deben explicar brevemente qué van a ejecutar antes de lanzar un comando largo o persistente.

## 6. Robustez específica de Windows
En `.bat`, la IA debe asumir que Windows es sensible a quoting, expansión de variables y procesos colgados. Por tanto:

- cualquier ejecutable o ruta con espacios debe invocarse entre comillas;
- si una variable puede contener una ruta a ejecutable, debe usarse como `call "%VARIABLE%" ...` y no sin comillas;
- no debe dar por hecho que un comando fallido mostrará un error entendible para el usuario;
- si usa `EnableDelayedExpansion`, debe revisar con cuidado qué variables se expanden con `%...%` y cuáles con `!...!` dentro de bloques;
- debe preferir lógica sencilla y observable frente a bloques demasiado ingeniosos o frágiles.

## 7. Opciones críticas: validación real antes de dar por buena la tarea
Si el `.bat` incluye una opción crítica como `dev`, `build`, `tests`, Docker o migraciones, la IA no debe conformarse con que el archivo "parezca correcto".

Debe hacer una validación proporcional:

- comprobar que el comando base realmente existe o es invocable;
- ejecutar al menos la parte mínima razonable del flujo o validar el binario/comando subyacente;
- confirmar que la opción no falla por quoting, rutas con espacios o errores triviales de shell;
- si no puede validar la interacción completa del menú, debe al menos validar por separado la orden que esa opción ejecutará.

## 8. Dev servers, locks y procesos persistentes
Si el `.bat` incluye opciones para arrancar servidores de desarrollo, watchers o procesos persistentes, la IA debe prever estados reales de uso diario:

- puertos ocupados;
- locks o archivos temporales de una ejecución anterior;
- procesos colgados del mismo proyecto;
- múltiples procesos hijos de una misma ejecución.

La skill debe favorecer que el `.bat`:

- detecte y explique qué proceso relevante está ocupando el puerto si es posible;
- intente atribuirlo al proyecto actual antes de proponer cerrarlo;
- pida confirmación clara antes de matar procesos;
- no ofrezca opciones engañosas si seguir no resuelve realmente el problema;
- base el éxito de la limpieza en el estado final real, no en un error intermedio de `taskkill` u otra orden similar.

# Reglas de calidad

## 1. Preferir inspección sobre suposición
Si el proyecto ya define scripts o comandos, la IA debe reutilizarlos en vez de reinventarlos.

## 2. Preferir genericidad sobre falsa precisión
Si no está claro cómo compilar o lanzar el proyecto, la IA puede:

- dejar la opción preparada con un texto claro
- proponer una versión mínima y segura
- o reducir el menú a opciones confirmadas por el contexto

## 3. Mantener utilidad real
No se trata de crear un menú largo, sino uno útil. Es mejor tener 4 opciones reales que 10 inventadas.

## 4. Mantener autonomía razonable
La IA debe decidir por sí misma la estructura del menú cuando el contexto sea suficiente.
Solo debe preguntar al usuario si falta una definición crítica o si hay varias alternativas con impacto real y ninguna destaca claramente.

## 5. Traducir problemas técnicos a decisiones operativas
Un buen `.bat` no solo ejecuta comandos: reduce fricción para la persona que lo usa.

Si detecta un problema conocido del flujo, debe preferir mensajes del tipo:

- qué ha detectado;
- por qué importa;
- qué opciones seguras tiene el usuario;
- cuál parece la opción correcta en ese contexto.

Es peor devolver un error crudo de shell que ofrecer una decisión breve y accionable.

# Estandar canonico obligatorio

La inspeccion y la genericidad del menu siguen siendo validas, pero ademas toda generacion o normalizacion de un punto de entrada de desarrollo en Windows debe cumplir estas reglas duras. No son sugerencias: son contrato de calidad del hub.

## Nombre y ubicacion
- Nombre fijo del archivo: `dev.bat`.
- Ubicacion fija: `.scripts/dev.bat`.
- Excepcion justificada unica: si `.scripts/dev.bat` no encaja (raro, por ejemplo monorepo donde el entrypoint vive en un subdirectorio que no debe llenarse de scripts, o proyectos donde la convencion del proyecto exige raiz), entonces raiz con justificacion explicita en `docs/SSOT.md` del proyecto. La raiz NUNCA es la opcion por defecto: la convencion del hub es `.scripts/` para todo lo de tooling.
- Prohibido inventar nombres equivalentes: nada de `start.bat`, `run.bat`, `iniciar.bat`, `arrancar.bat`, `menu.bat`, `herramienta.bat`, `wrapper.bat`, `iniciar-servidor.bat`, `start-dev.bat`, `stop-dev.bat`, etc.

## Encoding y cabecera
- Encoding obligatorio: UTF-8 sin BOM.
- Primera linea no comentada: `chcp 65001 >nul` para forzar codepage UTF-8 en consola.
- Segunda linea no comentada: `setlocal EnableExtensions EnableDelayedExpansion`.
- Tercera linea no comentada: `title <NombreProyecto> - <subtitulo opcional>`.

## Idioma y mensajes
- Idioma visible del UI: espanol.
- Mensajes deben usar los prefijos obligatorios: `[INFO]`, `[OK]`, `[WARN]`, `[ERROR]`.
- Prohibido mezclar prefijos en ingles (`INFO`, `OK`, `WARN`, `ERROR`) salvo cuando el bat los reemitiera explicitamente desde una herramienta externa.
- Prohibidos emojis en titulos, mensajes, opciones de menu o prompts.

## Confirmaciones obligatorias
- Antes de matar procesos: confirmacion explicita via `choice` o `set /p`.
- Antes de eliminar `node_modules`, `.next`, `dist`, `build`, caches o artefactos: confirmacion obligatoria.
- Antes de tocar puertos ocupados por terceros: confirmacion obligatoria con identificacion del proceso y PID.
- Antes de invocar `docker system prune`, `npm cache clean --force` o equivalente destructivo: confirmacion obligatoria.

## Verificacion de puerto
- Antes de iniciar un dev server, la opcion de dev debe comprobar si el puerto esperado esta libre.
- Si esta ocupado, el script debe intentar atribuir el proceso al proyecto actual (por nombre de imagen, ruta de trabajo o argumentos) y, solo si la atribucion es razonable, pedir confirmacion para terminarlo.
- Si la atribucion no es clara, el script debe informar al usuario del PID y dejar la decision en sus manos, sin matar automaticamente.

## Credenciales y secretos
- Prohibido hardcodear credenciales, secretos, API keys, contrasenas, tokens, connection strings o cualquier dato sensible dentro del `.bat`.
- Toda credencial debe leerse de `.env` o de variable de entorno ya definida.
- Prohibido leer credenciales desde archivos versionados distintos de `.env.example`.
- Si el proyecto requiere credenciales para arrancar, el script debe detectar la ausencia de la variable correspondiente y mostrar un `[ERROR]` claro apuntando a `.env.example`.

## Estructura del menu
- El `.bat` debe ser un unico archivo con menu interactivo.
- Iniciar, detener y reiniciar un mismo servicio son opciones del mismo menu, no scripts separados.
- Prohibido crear `iniciar-servidor.bat` + `detener-servidor.bat` o `start-dev.bat` + `stop-dev.bat` como archivos paralelos: ambos rompen el contrato y dificultan la auditoria.
- El menu debe incluir al menos: una opcion para arrancar el modo dev, una opcion de diagnostico del entorno y una opcion de salida limpia.

# Flujo recomendado

- [ ] Leer SSOT, reglas y documentación relevante del proyecto.
- [ ] Inspeccionar archivos y herramientas detectables.
- [ ] Identificar qué acciones son reales y cuáles no.
- [ ] Identificar idioma visible, comandos persistentes, puertos esperados y posibles locks del stack detectado.
- [ ] Diseñar un menú corto, claro y útil.
- [ ] Revisar quoting, rutas con espacios y llamadas a ejecutables variables antes de cerrar el `.bat`.
- [ ] Generar el `.bat` con navegación básica e instrucciones legibles.
- [ ] Validar de forma realista al menos las opciones críticas o sus comandos subyacentes.
- [ ] Explicar brevemente qué opciones se incluyeron y por qué.

# Criterio de resultado bueno
La skill está bien aplicada si el `.bat` final:

- se adapta al proyecto real
- no inventa comandos
- ofrece acciones de desarrollo útiles
- es entendible para el usuario
- resiste casos normales de Windows como rutas con espacios y procesos previos del mismo proyecto
- no deja al usuario bloqueado con errores técnicos evitables cuando el script puede guiar la decisión
- y puede usarse como punto de entrada diario del proyecto

# Checklist de creacion proactiva

Al iniciar trabajo sobre un proyecto, antes de generar codigo de aplicacion, la IA debe recorrer esta lista:

1. Inspeccionar el proyecto: detectar stack real, scripts existentes (`package.json`, `*.sln`, `Makefile`, `pyproject.toml`, etc.), archivos de configuracion y comandos ya definidos.
2. Verificar si existe `.scripts/dev.bat` en el proyecto.
   - Si existe: auditarlo contra el `# Estandar canonico obligatorio` de esta skill.
     - Si cumple: dejarlo y registrar brevemente el estado.
     - Si no cumple: normalizarlo siguiendo este contrato, preservando comandos utiles y reemplazando solo lo que rompa el estandar.
   - Si no existe: continuar al paso 3.
3. Decidir si el stack detectado se beneficia de un menu interactivo:
   - Si se beneficia (Node, Next, Vite, .NET, Python con venv, stack full-stack, etc.): crear `dev.bat` aplicando el `# Estandar canonico obligatorio`.
   - Si NO se beneficia (script Python de un solo archivo, binario Go, libreria sin runtime, etc.): NO crear `dev.bat` y continuar al paso 4.
4. Documentar la decision en `docs/SSOT.md` del proyecto:
   - Si se creo: anadir una entrada breve "`dev.bat` presente en `.scripts/`, conforme al estandar del hub".
   - Si se omitio: anadir una entrada breve "`dev.bat` omitido justificadamente: <stack> no requiere menu interactivo; comandos directos en <ruta o README>".
5. Reportar al usuario al cierre de la tarea que se hizo, que se omitio y por que, sin inflar el mensaje.

Este checklist aplica tambien a sesiones de mantenimiento: si la IA detecta un proyecto consumidor del hub sin `dev.bat` o con uno fuera de estandar mientras trabaja en otra cosa, debe registrar la observacion en el `.teams/active/` correspondiente en lugar de tocar el archivo sin orden explicita.

## Estandar de elementos comunes cross-proyecto

Ademas del `# Estandar canonico obligatorio` (que define el contrato minimo), existe un segundo nivel: la consistencia entre proyectos del mismo hub. Cuando un usuario tiene varios proyectos consumidores del hub, todos los `dev.bat` deben **sentirse el mismo tipo de herramienta** dentro de lo que cada stack permita.

Este bloque define los elementos que DEBEN ser identicos entre proyectos. Las excepciones se documentan explicitamente en este mismo bloque, no se dejan a la libre interpretacion.

### Posicion exacta de la cabecera canonica

La cabecera canonica debe ir **en este orden y posicion exactos**, sin bloque de comentarios intercalado:

- Linea 1: `@echo off`
- Linea 2: `chcp 65001 >nul` (PRIMERA linea no comentada, sin excepciones)
- Linea 3: `setlocal EnableExtensions EnableDelayedExpansion`
- Linea 4: `title <NombreProyecto> - Punto de entrada`

Los comentarios de cabecera (descripcion del script, autor, fecha) van **despues** de la linea 4, no antes. Esto es regla dura, no sugerencia.

**Excepcion**: el bloque de comentarios al inicio puede ir entre `@echo off` y `chcp 65001 >nul` SOLO si documenta una condicion critica (ej. "este bat no se debe ejecutar en produccion"). Aun asi, `chcp 65001 >nul` debe ser la primera linea no comentada.

### Apertura automatica del navegador al iniciar dev

Cuando un `dev.bat` ofrece la opcion de iniciar un dev server (Next, Vite, etc.), esa opcion DEBE:
1. Iniciar el dev server.
2. Esperar un delay de 2-3 segundos (`timeout /t 3 /nobreak >nul`) para que el server arranque.
3. Abrir el navegador en `http://localhost:<PORT>` con `start "" "http://localhost:<PORT>"`.

Esto aplica cuando:
- El stack tiene dev server web (Next, Vite, CRA, Angular dev server, etc.).
- El proyecto es full-stack o frontend con UI que se previsualiza en navegador.

**Excepciones** (documentar en el `.bat` con un `[INFO]` claro):
- El stack no es un dev server web (ej. .NET WinForms, scripts Python puros, APIs backend sin UI).
- El proyecto usa un tunel externo como flujo principal (ej. Cloudflare tunnel) y la UI se accede por la URL del tunel, no por localhost.
- El usuario ha configurado explicitamente en SSOT que no quiere apertura automatica.

### Helpers canonicos con nombre y firma exactos

Estos son los nombres **obligatorios** de los helpers que cualquier `dev.bat` del hub debe implementar cuando aplique:

| Helper | Firma | Proposito |
|---|---|---|
| `:print_section` | `<texto>` | Imprime titulo/seccion con formato `[INFO]`. |
| `:ensure_project` | (sin args) | Valida que estamos en la raiz del proyecto (debe existir `package.json`, `*.sln`, `pyproject.toml` o equivalente). |
| `:check_port` | `<puerto>` | Devuelve `PORT_PID` global si el puerto esta ocupado, vacio si libre. Implementacion con `netstat -ano`. |
| `:confirm` | `<mensaje>` | Pregunta S/N con `choice /c SN /n /m`. Devuelve `CONFIRM_ANSWER` (`0` para Si, `1` para No). |
| `:kill_port` | `<puerto>` | Atribuye proceso al puerto, pide confirmacion, mata SOLO el PID concreto. NUNCA mata por nombre de imagen. |
| `:detect_package_manager` | (sin args) | Detecta gestor de paquetes (npm, bun, pnpm, yarn). Devuelve `PKG_MANAGER`. Usar cuando el proyecto pueda usar varios. |
| `:require_node` | (sin args) | Aborta con `[ERROR]` claro si Node no esta en PATH. Usar en proyectos Node. |
| `:diagnose` | (sin args) | Imprime el diagnostico del entorno (runtimes, gestor, puerto, archivos, variables). Salida con `[OK]/[WARN]/[ERROR]`. |

Si un `dev.bat` implementa un helper que coincide con uno de estos en proposito, **debe** usar el nombre canonico. Variaciones (`:kill_port_dev`, `:confirm_action`, etc.) estan prohibidas salvo justificacion documentada en el `.bat` y en la SSOT del proyecto.

### Prefijos exactos

- `[INFO]` mensajes informativos.
- `[OK]` resultados exitosos.
- `[WARN]` advertencias.
- `[ERROR]` errores.
- **Prohibido** mezclar con prefijos en ingles (`INFO`, `OK`, `WARN`, `ERROR` sin corchetes) salvo en contextos donde la herramienta externa los emite asi.
- **Prohibido** cualquier emoji en titulos, mensajes, opciones de menu o prompts.

### Mensaje de bienvenida estandar

Al abrir el menu (antes del primer `echo` de opciones), el `dev.bat` debe mostrar:

```
========================================
  <NombreProyecto> - Punto de entrada
========================================
  Stack: <Stack detectado> | Puerto dev: <PORT> | Gestor: <PKG_MANAGER>
========================================
```

El `<NombreProyecto>` debe coincidir con el `title`. El `Stack detectado` y `Puerto dev` se derivan de la inspeccion inicial del proyecto. El `Gestor` es el package manager detectado. Si algun dato no aplica (ej. proyecto sin gestor de paquetes), usar `n/a`.

### Opciones del menu: orden recomendado

Las primeras 3 opciones del menu deben ser (en este orden):
1. Iniciar dev server (con apertura de navegador automatica, salvo excepcion documentada).
2. Compilar / Build.
3. Detener dev server del puerto (o equivalente).

Esto es por ergonomia: las 3 acciones mas usadas son las 3 primeras. Las opciones siguientes pueden variar (lint, test, clean, etc.) segun lo que el stack soporte. La opcion `0 - Salir` siempre la ultima.

### Diagnostico estandar

La opcion de diagnostico (en el orden que sea) debe listar al menos:
- `node --version` (o runtime equivalente: `dotnet --version`, `python --version`).
- Gestor de paquetes y su version (`npm --version`, `bun --version`).
- Puerto dev: estado (LIBRE / OCUPADO por PID X).
- Archivos criticos: `[OK] / [FALTA]` para `package.json`, `node_modules/`, `.env.local`, `.next/` o equivalente.
- Variables de entorno: deteccion dinamica desde `.env.example` (NO hardcoded).

### Numeracion de opciones

Numerar del 1 al N, con 0 reservado para "Salir". Las letras (L, R, D) para acciones destructivas son aceptables como alias pero no obligatorias.

### Confirmaciones obligatorias

Antes de:
- Matar cualquier proceso (incluso si parece seguro): `choice /c SN /n /m` con identificacion del PID.
- Eliminar `node_modules/`: confirmacion explicita.
- Eliminar `.next/`, `dist/`, `build/`: confirmacion explicita.
- Reinstalar dependencias desde cero: doble confirmacion (borrar + reinstalar).
- Cualquier operacion `git push`, `git reset`, etc. (raro en un `dev.bat`, pero si lo hay, doble confirmacion).

**Nunca** usar `taskkill /im node.exe` o equivalente que mate por nombre de imagen. **Siempre** matar por PID.

### Salida del menu

- `0 - Salir` siempre la ultima opcion.
- Al elegir salir: limpiar variables (`endlocal`) y `exit /b 0`.
- Si hay procesos iniciados por el `dev.bat` que siguen vivos al salir, **advertir** al usuario con `[WARN]` y listar los PIDs.

### Encoding y firma visible

- UTF-8 sin BOM.
- CRLF (Windows).
- Primera linea no comentada: `chcp 65001 >nul`.
- Sin tildes en los prefijos y mensajes criticos del UI (mejor ASCII para maxima portabilidad entre consolas Windows), aunque los comentarios del codigo pueden tener tildes.

## Compatibilidad hacia atras y migracion

Este bloque es **retroactivo**: aplica a cualquier `dev.bat` que se cree o modifique a partir de la fecha de inclusion. Los `dev.bat` ya publicados pueden tener desviaciones y deben normalizarse en una pasada posterior contra `## Lista de chequeo para auditoria de dev.bat existentes` abajo.

## Lista de chequeo para auditoria de dev.bat existentes

Cualquier agente que audite un `dev.bat` contra este estandar debe verificar:

- [ ] Cabecera canonica en posicion exacta (lineas 1-4 como se describe arriba).
- [ ] Apertura automatica de navegador al iniciar dev (o excepcion documentada).
- [ ] Helpers con nombre canonico (sin variaciones).
- [ ] Prefijos en espanol consistentes.
- [ ] Mensaje de bienvenida en formato estandar.
- [ ] Primeras 3 opciones en orden: dev, build, stop.
- [ ] Diagnostico con version de runtime, gestor, puerto, archivos, variables.
- [ ] Confirmaciones antes de acciones destructivas.
- [ ] Encoding UTF-8 sin BOM, CRLF.
- [ ] Sin emojis.
- [ ] Sin credenciales hardcoded.
- [ ] Sin `taskkill /im` por nombre de imagen.

## Triggers
- Keywords: bat, .bat, script interactivo, script de desarrollo, herramienta CLI, herramienta de desarrollo, menu de desarrollo, menu de dev, modo dev, modo desarrollo, abrir el server, abrir el servidor, arrancar el proyecto, arrancar el server, arrancar en local, levantar el proyecto, levantar el server, lanzar el dev, lanzar el server, punto de entrada, iniciar el entorno, puesta en marcha local, wrapper de desarrollo
- Patrones de usuario: "genera un bat", "crea un menu de desarrollo", "script interactivo para el proyecto", "herramienta CLI", "crea un script para abrir el modo dev", "necesito arrancar el proyecto", "como levanto el server en local"
- Encadenamiento: despues de `configurar-entorno` para reutilizar comandos ya definidos; tambien se activa durante `arrancar-proyecto` cuando el bootstrap del proyecto nuevo siembra el punto de entrada de desarrollo

# Ejemplos de activación
"Utiliza esta skill para generar un `.bat` interactivo para este proyecto, analizando primero el contexto y sin asumir herramientas no confirmadas."

