---
name: configurar-mcp
description: "Inventaria, instala, configura y verifica servidores MCP necesarios o preferentes entre IDEs y maquinas, separando politica reusable del hub y configuracion local. TRIGGERS: MCP, servidor MCP, configurar MCP, tools MCP, anadir MCP, instalar MCP."
---

# Objetivo
Dejar configurados y verificables los MCPs que una tarea, skill o proyecto necesita realmente, evitando configuraciones rotas, duplicadas o escondidas en un solo IDE.

# Alcance y limites
- Si inventaria MCPs requeridos, preferentes y opcionales segun proyecto, skill y tarea.
- Si puede configurar MCPs en los IDEs detectados cuando la ruta y el formato local son claros.
- Si debe verificar que el MCP queda disponible tras la configuracion.
- Si debe documentar la parte reusable y dejar la parte sensible en configuracion local.
- No debe guardar secretos reales en el repositorio.
- No debe inventar rutas de configuracion ni nombres de servidores sin evidencia.
- No sustituye a `configurar-entorno`; se centra en tooling MCP del agente/IDE.
- No obliga a instalar MCPs que no aportan valor real al flujo actual.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- [Estrategia MCP](../docs/MCP.md).
- [Skill transversal de documentacion](../documentar-con-criterio/SKILL.md).
- Proyecto actual, skills y documentacion local relevante.
- Configuracion local real de los IDEs disponibles en la maquina.
- Documentacion oficial del MCP cuando la instalacion dependa de ella.

# Comportamiento esperado
La skill debe empezar distinguiendo entre necesidad real y comodidad opcional.

Antes de tocar nada:
1. Identificar que MCPs pide el proyecto, la skill o la tarea.
2. Clasificarlos como `requerido`, `preferente` u `opcional`.
3. Inspeccionar que IDEs y configuraciones MCP existen realmente en la maquina actual.
4. Detectar que MCPs faltan, sobran o estan desalineados.

Despues debe:
5. Configurar solo los MCPs utiles para los IDEs solicitados o detectados.
6. Mantener secretos fuera del repo y fuera de la documentacion versionada.
7. Indicar cuando hace falta reiniciar o recargar el IDE.
8. Verificar que el MCP aparece disponible y responde.

## Regla de separacion
- La necesidad del MCP puede documentarse en el proyecto o en el hub.
- La configuracion efectiva del MCP vive en el IDE o en la maquina.
- La skill no debe convertir configuracion local en artefacto versionado por defecto.

## Politica de descubrimiento
Antes de editar una configuracion, la skill debe:
- localizar la ruta real del IDE en esa maquina;
- confirmar el formato esperado del archivo de configuracion;
- revisar si ya existe una entrada equivalente;
- evitar duplicar el mismo MCP con nombres distintos sin necesidad.

Antes de ponerse a buscar de cero, debe revisar primero `docs/MCP.md` y aplicar su tabla de clientes comunes y rutas conocidas. Solo si ese mapa no cubre el caso actual debe pasar a descubrimiento abierto adicional.

## Casos comunes que debe cubrir por defecto
Como minimo, la skill debe saber revisar estos clientes cuando esten presentes o el usuario los nombre:
- Codex
- Windsurf
- Kilo Code extension
- Kilo CLI
- VS Code con configuracion workspace-level de MCP
- Antigravity

No significa asumir que todos existen siempre, sino tratarlos como primera lista de comprobacion.

Si el proyecto usa PostgreSQL o el usuario menciona una config previa de otro IDE, la skill debe considerar `postgresql` como MCP preferente para inspeccion real de esquema y datos, especialmente cuando pueda haber drift entre codigo, migraciones y base viva.

## Politica ante documentacion incompleta o conflictiva
- Si la documentacion oficial y la instalacion local coinciden, usar esa ruta.
- Si la documentacion oficial muestra variantes distintas entre paginas, preferir la mas actual y comprobar si la ruta existe localmente antes de escribir.
- Si no hay documentacion publica suficientemente clara, se puede apoyar en la instalacion local, esquemas o archivos reales detectados, pero debe marcar el resultado como `verificado localmente` y no como canon universal.
- Si sigue habiendo duda material, la skill debe dejar constancia del hueco y no inventar una ruta.

## Politica de seguridad
- Nunca persistir tokens, PATs o claves reales en `SKILL.md`, `docs/`, `.teams/` o archivos del proyecto.
- Si el MCP necesita secretos y no hay un contenedor seguro/local claro, la skill debe dejarlo bloqueado y explicarlo.
- Si el MCP permite variables de entorno o cabeceras locales, preferir esa via antes que hardcodear secretos.

## Politica de verificacion
La skill no debe dar por buena una instalacion solo porque el archivo fue editado.

Debe verificar, cuando el entorno lo permita:
- que el IDE reconoce el servidor MCP;
- o que la herramienta/paquete responde;
- o que, tras reinicio, el MCP aparece disponible y operativo.

Cuando el cliente tenga un comando nativo de gestion MCP, debe preferirlo para validar. Ejemplos tipicos:
- `codex mcp list`
- `kilo mcp list`

Si el MCP expone recursos o herramientas visibles desde el propio cliente, la skill debe preferir una verificacion funcional real despues del reinicio. Ejemplo practico para PostgreSQL:
- comprobar que el servidor `postgresql` aparece en `list_mcp_resources`;
- y ejecutar una consulta de lectura simple para confirmar conexion y base objetivo.

Si el paquete del MCP aparece marcado como `deprecated` pero sigue funcionando, la skill debe:
- avisarlo al usuario sin dramatizar;
- verificar igualmente si el cliente lo reconoce y responde;
- y dejar constancia de que podria requerir sustitucion futura.

## Relacion con otras skills
- `configurar-entorno` prepara runtimes, servicios y setup del proyecto.
- `configurar-mcp` prepara el tooling MCP del agente/IDE.
- `elevar-ui-frontend`, `definir-arquitectura` u otras skills consumidoras deben derivar aqui cuando falte un MCP preferente o requerido.
- `documentar-con-criterio` decide cuanto detalle MCP merece quedar en docs y cuanto debe quedarse solo en configuracion local.

## Ejemplos operativos
### Quiero todos los MCP necesarios en este ordenador
- Inventariar MCPs pedidos por el proyecto y las skills relevantes.
- Revisar Codex, Windsurf, Kilo Code, Antigravity u otros IDEs presentes.
- Configurar los faltantes en cada IDE posible.
- Indicar reinicio y verificar disponibilidad.

### Una skill pide un MCP oficial y no esta instalado
- No improvisar el comportamiento como si existiera.
- Explicar el hueco.
- Configurarlo o derivar a esta skill si el hilo actual no va de entorno/tooling.

### El mismo MCP existe solo en un IDE
- Detectar la asimetria.
- Proponer o aplicar la replicacion en los IDEs realmente usados por el usuario.

### El usuario trae una config de Windsurf y quiere replicarla en Codex
- Validar primero que la ruta de configuracion de Codex existe y usa `[mcp_servers.<nombre>]`.
- Replicar el servidor sin versionar secretos en el repo.
- Reiniciar Codex si hace falta.
- Confirmar que el MCP aparece en recursos o herramientas despues del reinicio.
- Si es PostgreSQL, comprobar ademas que la base responde con una consulta real.

# Flujo recomendado
- [ ] Leer la documentacion del proyecto y detectar MCPs requeridos o preferentes.
- [ ] Leer `docs/MCP.md` para aplicar la estrategia canonica.
- [ ] Aplicar primero la tabla de clientes comunes y rutas conocidas antes de discovery libre.
- [ ] Inspeccionar configuraciones MCP reales en los IDEs de la maquina actual.
- [ ] Configurar solo los MCPs necesarios y sin duplicados.
- [ ] Mantener secretos fuera del repo.
- [ ] Reiniciar o recargar el IDE cuando aplique.
- [ ] Verificar que los MCPs quedan realmente disponibles.
- [ ] Registrar en `.teams/` lo configurado y cualquier bloqueo por secretos o soporte parcial.

# Criterio de resultado bueno
La skill esta bien aplicada si:
- los MCPs necesarios quedan localizados y configurados donde toca;
- no se han versionado secretos ni configuraciones locales sensibles;
- otra IA puede repetir el proceso en otro ordenador sin inventar rutas o servidores;
- y un MCP ausente deja de ser una trampa silenciosa del flujo.

## Triggers
- Keywords: MCP, servidor MCP, tools MCP, anadir MCP, instalar MCP, configurar MCP
- Patrones de usuario: "configura los MCP", "que MCP faltan", "instala Context7", " configura HeroUI MCP"
- Encadenamiento: antes de skills que dependan de MCPs especificos como `heroui-react` o `definir-arquitectura`

# Ejemplos de activacion
"Configura todos los MCP necesarios en este ordenador."

"Revisa que MCPs faltan en mis IDEs y deja instalados los utiles para este proyecto."

"Configura Context7 y HeroUI en Codex, Windsurf y Kilo Code si es posible."
