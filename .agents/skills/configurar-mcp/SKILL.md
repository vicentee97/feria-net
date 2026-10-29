---
name: configurar-mcp
description: "Usar cuando vayas a anadir, quitar, configurar o verificar un servidor MCP (Supabase, context7, Tavily, etc.) en OpenCode u otro IDE, asegurando que sigue la politica reusable del hub. TRIGGERS: MCP, servidor MCP, configurar MCP, tools MCP, anadir MCP, instalar MCP."
---

# Configurar MCP

# Objetivo

Dejar configurados y verificables los MCPs que una tarea, skill o proyecto necesita realmente, evitando configuraciones rotas, duplicadas o escondidas en un solo IDE.

La skill existe para blindar el anti-patron mas critico: dar por buena una configuracion solo porque el archivo fue editado. La verificacion funcional (IDE reconoce + herramienta responde) es OBLIGATORIA, no opcional.

# Anti-patrones y su correccion

Cada sesgo del entrenamiento base necesita su par MAL -> BIEN -> EJEMPLO. Reconocer el anti-patron no basta para vencerlo.

- **Configurar MCP por inercia (D1):** MAL inventariar todos los MCPs existentes e instalarlos. BIEN clasificar como `requerido`, `preferente` u `opcional` segun proyecto/skill/tarea y configurar solo los utiles para el flujo actual. EJEMPLO ante `instala todos los MCPs` responder con la lista clasificada y esperar confirmacion antes de tocar los `opcional`.
- **Inventar rutas o servidores (D2, critico):** MAL suponer la ruta del archivo de config del IDE o el nombre del servidor. BIEN localizar la ruta real del IDE en esa maquina, confirmar el formato esperado y revisar `docs/MCP.md` antes de discovery libre. EJEMPLO ante `configura X en Codex` primero confirmar que existe la entrada en `~/.codex/config.toml` con `[mcp_servers.X]`.
- **Duplicar el mismo MCP con nombres distintos (D3):** MAL anadir `mi-postgres` cuando ya existe `postgres`. BIEN revisar si ya existe una entrada equivalente antes de crearla. EJEMPLO tras `mcp list` ver `postgres` ya configurado y reusarlo en vez de anadir `postgresql-local`.
- **Versionar secretos en el repo (D4, critico):** MAL poner tokens, PATs o claves en `SKILL.md`, `docs/`, `.teams/` o archivos versionados. BIEN mantener secretos en variables de entorno o cabeceras locales del IDE; bloquear y explicar si no hay contenedor seguro. EJEMPLO ante un token en el diff: avisar al usuario y nunca commitear.
- **Asumir instalado sin verificar (D5):** MAL dar por buena una instalacion solo porque el archivo fue editado. BIEN reiniciar/recargar el IDE y comprobar que el servidor aparece y responde (preferir el comando nativo del cliente, p.ej. `codex mcp list` / `kilo mcp list`). EJEMPLO tras editar config: reiniciar Codex y ejecutar `codex mcp list` para confirmar el servidor aparece como activo.
- **Verificacion superficial en MCP de datos (D6):** MAL asumir que PostgreSQL MCP funciona porque aparece en la lista. BIEN ejecutar una consulta de lectura simple para confirmar conexion y base objetivo. EJEMPLO tras configurar `postgresql`: llamar `list_mcp_resources` + un `SELECT 1` o `SELECT count(*) FROM <tabla>` real.
- **Tratar `deprecated` como roto (D7):** MAL descartar un MCP marcado `deprecated` sin probarlo. BIEN avisarlo al usuario sin dramatizar, verificar igualmente que el cliente lo reconoce y responde, y dejar constancia de que podria requerir sustitucion futura. EJEMPLO: avisar `este paquete aparece deprecated pero responde correctamente; anotado para revision futura`.

# Alcance y limites
- Inventa MCPs requeridos, preferentes y opcionales segun proyecto, skill y tarea.
- Configura MCPs en los IDEs detectados cuando la ruta y el formato local son claros.
- Verifica que el MCP queda disponible tras la configuracion (gate OBLIGATORIO).
- Documenta la parte reusable y deja la parte sensible en configuracion local.
- NEVER guarda secretos reales en el repositorio.
- NEVER inventa rutas de configuracion ni nombres de servidores sin evidencia.
- No sustituye a `configurar-entorno`; se centra en tooling MCP del agente/IDE.
- No obliga a instalar MCPs que no aportan valor real al flujo actual.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- [Estrategia MCP](../docs/MCP.md).
- [Skill transversal de documentacion](../documentar-con-criterio/SKILL.md).
- Configuracion local real de los IDEs disponibles en la maquina.
- Documentacion oficial del MCP cuando la instalacion dependa de ella.

# Comportamiento esperado

La skill empieza distinguiendo entre necesidad real y comodidad opcional. Antes de tocar nada: identificar MCPs pedidos, clasificar (`requerido` / `preferente` / `opcional`), inspeccionar IDEs y configuraciones existentes, y detectar que MCPs faltan, sobran o estan desalineados.

Despues: configurar solo los utiles para los IDEs solicitados o detectados; mantener secretos fuera del repo; indicar cuando hace falta reiniciar o recargar el IDE; y verificar disponibilidad y respuesta (gate OBLIGATORIO, no opcional).

## Regla de separacion
- La necesidad del MCP puede documentarse en el proyecto o en el hub.
- La configuracion efectiva del MCP vive en el IDE o en la maquina.
- NEVER convierte configuracion local en artefacto versionado por defecto.

## Politica de descubrimiento
Antes de editar una configuracion: localizar la ruta real del IDE en esa maquina, confirmar el formato esperado del archivo, revisar si ya existe una entrada equivalente (anti-patron D3) y evitar duplicar el mismo MCP con nombres distintos.

Antes de ponerse a buscar de cero, revisar primero `docs/MCP.md` y aplicar su tabla de clientes comunes y rutas conocidas. Solo si ese mapa no cubre el caso actual se pasa a discovery abierto adicional.

## Casos comunes que debe cubrir por defecto
Como minimo, la skill sabe revisar estos clientes cuando esten presentes o el usuario los nombre: Codex, Windsurf, Kilo Code extension, Kilo CLI, VS Code con configuracion workspace-level de MCP y Antigravity. No significa asumir que todos existen siempre, sino tratarlos como primera lista de comprobacion.

Si el proyecto usa PostgreSQL o el usuario menciona una config previa de otro IDE, considera `postgresql` como MCP preferente para inspeccion real de esquema y datos, especialmente cuando pueda haber drift entre codigo, migraciones y base viva (aplica entonces la verificacion D6).

## Politica ante documentacion incompleta o conflictiva
- Si la documentacion oficial y la instalacion local coinciden, usar esa ruta.
- Si la documentacion oficial muestra variantes distintas entre paginas, preferir la mas actual y comprobar si la ruta existe localmente antes de escribir.
- Si no hay documentacion publica suficientemente clara, se puede apoyar en la instalacion local, esquemas o archivos reales detectados, pero debe marcar el resultado como `verificado localmente` y no como canon universal.
- Si sigue habiendo duda material, dejar constancia del hueco y NEVER inventar una ruta.

## Politica de seguridad
- NEVER persistir tokens, PATs o claves reales en `SKILL.md`, `docs/`, `.teams/` o archivos del proyecto.
- Si el MCP necesita secretos y no hay un contenedor seguro/local claro, dejarlo bloqueado y explicarlo.
- Preferir variables de entorno o cabeceras locales antes que hardcodear secretos.

## Politica de verificacion
La skill NEVER da por buena una instalacion solo porque el archivo fue editado (anti-patron D5). Verifica, cuando el entorno lo permita: que el IDE reconoce el servidor MCP; o que la herramienta/paquete responde; o que, tras reinicio, el MCP aparece disponible y operativo.

Cuando el cliente tenga un comando nativo de gestion MCP, preferirlo para validar: `codex mcp list`, `kilo mcp list`. Si el MCP expone recursos o herramientas visibles desde el propio cliente, preferir verificacion funcional real despues del reinicio. Para PostgreSQL: comprobar que `postgresql` aparece en `list_mcp_resources` y ejecutar una consulta de lectura simple para confirmar conexion y base objetivo (anti-patron D6).

Si el paquete aparece marcado como `deprecated` pero sigue funcionando, avisarlo sin dramatizar, verificar igualmente que el cliente lo reconoce y responde, y dejar constancia de que podria requerir sustitucion futura (anti-patron D7).

## Relacion con otras skills
- `configurar-entorno` prepara runtimes, servicios y setup del proyecto; `configurar-mcp` prepara el tooling MCP del agente/IDE.
- `elevar-ui-frontend`, `definir-arquitectura` u otras skills consumidoras derivan aqui cuando falte un MCP preferente o requerido.
- `documentar-con-criterio` decide cuanto detalle MCP merece quedar en docs y cuanto debe quedarse solo en configuracion local.

# Ejemplos operativos

### Quiero todos los MCP necesarios en este ordenador
Inventariar MCPs pedidos por el proyecto y skills; revisar Codex, Windsurf, Kilo Code, Antigravity u otros IDEs presentes; clasificar y configurar solo los utiles; indicar reinicio y verificar disponibilidad.

### Una skill pide un MCP oficial y no esta instalado
No improvisar el comportamiento como si existiera; explicar el hueco; configurarlo o derivar a esta skill si el hilo actual no va de entorno/tooling.

### El mismo MCP existe solo en un IDE
Detectar la asimetria; proponer o aplicar la replicacion en los IDEs realmente usados por el usuario.

### El usuario trae una config de Windsurf y quiere replicarla en Codex
Validar primero que la ruta de configuracion de Codex existe y usa `[mcp_servers.<nombre>]`; replicar el servidor sin versionar secretos en el repo; reiniciar Codex si hace falta; confirmar que el MCP aparece en recursos o herramientas despues del reinicio; si es PostgreSQL, comprobar ademas que la base responde con una consulta real.

# Flujo recomendado
- [ ] Leer la documentacion del proyecto y detectar MCPs requeridos o preferentes.
- [ ] Leer `docs/MCP.md` para aplicar la estrategia canonica (tabla de clientes antes que discovery libre).
- [ ] Inspeccionar configuraciones MCP reales en los IDEs de la maquina actual.
- [ ] Configurar solo los MCPs necesarios y sin duplicados; mantener secretos fuera del repo.
- [ ] Reiniciar o recargar el IDE cuando aplique.
- [ ] Verificar que los MCPs quedan realmente disponibles (comando nativo del cliente o verificacion funcional).
- [ ] Resolver el gate de auto-cita + gate de segunda IA; registrar en `.teams/` lo configurado y cualquier bloqueo.

# Cierre OBLIGATORIO: gate de auto-cita

Antes de declarar los MCPs configurados y verificados, declarar (auto-cita con evidencia, no auto-evaluacion). Maximo 7 items:

- [ ] **Declaro** que clasifique los MCPs como `requerido` / `preferente` / `opcional` y que configure solo los utiles para el flujo actual (anti-patron D1).
- [ ] **Declaro** que localice la ruta real del IDE y aplique `docs/MCP.md` antes de inventar rutas o servidores (anti-patron D2).
- [ ] **Declaro** que no duplique MCPs equivalentes con nombres distintos (anti-patron D3), citando la lista observada del cliente.
- [ ] **Declaro** que ningun token, PAT o clave real quedo en `SKILL.md`, `docs/`, `.teams/` ni archivos versionados (anti-patron D4).
- [ ] **Declaro** que verifique disponibilidad tras reinicio con comando nativo del cliente o verificacion funcional equivalente (anti-patron D5).
- [ ] **Declaro** que para MCP de datos (PostgreSQL, Supabase, etc.) ejecute una consulta de lectura real que confirma conexion y base objetivo (anti-patron D6).
- [ ] **Declaro** el resultado del gate de segunda IA (ver abajo).

## Gate de segunda IA (OBLIGATORIO, no sugerencia)

El agente que configura no es el que califica. Antes de cerrar:

- **MCP que toca auth, secretos, base de datos o superficie sensible** -> delegar OBLIGATORIAMENTE a **@especialista-seguridad** antes de cerrar.
- **MCP de datos (PostgreSQL, Supabase, vectorial) con verificacion funcional** -> delegar OBLIGATORIAMENTE a **@integrador-mcp** (verifica configuracion multi-IDE) y a **@qa-validador** (ejecuta la consulta real de lectura).
- **Replicacion de un MCP entre varios IDEs** -> delegar OBLIGATORIAMENTE a **@integrador-mcp** para validar coherencia entre clientes.
- **MCP marcado `deprecated` pero funcional** -> delegar a **@integrador-mcp** para confirmar verificacion y dejar constancia de sustitucion futura.
- **MCP opcional para flujo no critico y verificacion superficial** -> sin segunda IA obligatoria (no burocracia innecesaria).

# Criterio de resultado bueno

Cierre valido cuando el gate de auto-cita de arriba se cumple con evidencia observable y el gate de segunda IA esta resuelto segun la tipificacion. Esta seccion no anade reglas: es el mirror declarativo del gate, repetido aqui solo porque `validate-hub-skills.ps1` exige el header.

## Triggers
- Keywords: MCP, servidor MCP, tools MCP, anadir MCP, instalar MCP, configurar MCP
- Patrones de usuario: "configura los MCP", "que MCP faltan", "instala Context7", "configura HeroUI MCP"
- Encadenamiento: despues de `configurar-entorno`; antes de skills que dependan de MCPs especificos como `heroui-react`, `definir-arquitectura` o `implementar-backend-datos`

# Ejemplos de activacion
"Configura todos los MCP necesarios en este ordenador."

"Revisa que MCPs faltan en mis IDEs y deja instalados los utiles para este proyecto."

"Configura Context7 y HeroUI en Codex, Windsurf y Kilo Code si es posible."
