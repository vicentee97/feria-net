<!-- CEREBRO_OPERATIVO_IA:codex-bootstrap START -->
# Bootstrap canonico del proyecto

**Preflight proporcional**
1. Clasifica el trabajo: `ligero` (solo consulta), `normal` (edita algo acotado) o `alto` (estructura, seguridad, publicacion u operaciones sensibles).
2. Si el trabajo es `normal` o `alto`, resuelve la ubicacion del hub `CerebroOperativoIA` leyendo: `.cerebro-operativo/hub-path.txt` (o busca rutas cercanas si falla).
3. Lee `docs/AI_GLOBAL_RULES.md` dentro de la ruta resuelta del hub cuando el trabajo dependa del hub o vaya a editar archivos.
4. Lee `docs/SSOT.md` del proyecto actual y la documentacion local relevante.
5. Si vas a editar archivos, reconstruye contexto estructurado desde `.teams/`, `.questions/` y validaciones reales antes de implementar.
6. Compatibilidad `.teams`: si el proyecto tiene plantilla antigua, teams planos, estados legacy o campos retirados como `Responsable`, tratalo como legado local. Para teams nuevos manda el contrato actual del hub: `.teams/active/`, `.teams/archive/`, `.teams/.counter`, `.teams/INDEX.md` y estados `activo|cerrado|bloqueado`. No normalices historico salvo que bloquee trabajo actual.
7. Trata `.agents/skills` como la proyeccion preferente del hub para skills estandar. Si no existe, usa las rutas de compatibilidad del IDE (`.codex/skills`, `.opencode/skills`, `.windsurf/skills`, `.agent/skills`, `.kilo/skills`, `.kilocode/skills`).
8. Usa lectura progresiva: primero inventario, luego solo el `SKILL.md` necesario.
9. Nunca mantengas copias largas de reglas o skills dentro del proyecto salvo que la propia estrategia multi-IDE del hub lo indique.

Si el hub no esta accesible, avisalo explicitamente y trabaja con cautela priorizando la documentacion local del proyecto.

## Hub Sync
**Obligatorio en trabajo `normal` o `alto`:** verifica que el hub este sincronizado antes de editar o tomar decisiones estructurales.
- Synced hub version: 1.03.00
- Synced hub revision hint: 58dc295
- Synced hub manifest hash: 68ca1ce95cc326eb0524dd98381af6dce2f9984f9b37167e1b8cf01b7f6fde04
- Paso 1: leer `.cerebro-operativo/hub-path.txt` para resolver la ruta del hub.
- Paso 2: si el archivo no existe o la ruta no es accesible, avisar al usuario y trabajar con cautela.
- Paso 3: leer `HUB_VERSION` del hub resuelto y, si es posible, `HUB_MANIFEST.json` y el commit corto actual del hub.
- Paso 4: comparar version, revision hint y manifest hash con este archivo. Si difieren y el trabajo no es ligero, ejecutar `globalize.ps1` desde la raiz del proyecto antes de continuar.
- Paso 5: si el trabajo es ligero y no depende del estado exacto del hub, basta con advertir el desfase y seguir con cautela.
- Paso 6: si coinciden, proceder normalmente.
- Las skills enlazadas por junction reflejan cambios del hub en vivo; los agentes proyectados son archivos generados y requieren re-ejecutar `globalize.ps1`.
- Si falta una skill o un agente esperado, no asumas ausencia: resuelve el hub real y re-sincroniza antes de concluirlo.

## Contrato de comunicacion y decision visible

Aplica a toda respuesta visible al usuario, tanto en consolidaciones como en fallback sin subagente real. El trabajo interno puede ser profundo; la salida externa debe hacer comprensible el resultado sin esconder evidencia, incertidumbre, fallos o riesgos materiales.

### Principios obligatorios

- Empieza por la conclusion, el estado o la decision que importa. No empieces narrando el proceso.
- Escribe para una persona no especialista: usa lenguaje llano y conserva los tecnicismos que aporten precision, definiendolos una vez cuando puedan no ser familiares.
- Usa profundidad progresiva: primero lo necesario para entender o decidir; despues detalle tecnico solo si aporta valor, el riesgo lo exige o el usuario lo pide.
- Resume y prioriza. No vuelques briefs internos, logs, trazas ni informes completos de especialistas.
- No ocultes fallos de herramientas, incertidumbres, discrepancias P1, validaciones no ejecutadas ni trade-offs significativos por mantener la respuesta corta.
- Omite encabezados, tablas y apartados vacios. El formato sirve a la decision; no es una plantilla burocratica.

### Elegir un unico modo de salida

1. **Estado:** trabajo en curso. Indica situacion, avance relevante y siguiente paso.
2. **Cierre:** trabajo terminado. Indica resultado, validacion, riesgo residual y recomendacion siguiente solo si aporta.
3. **Decision:** existen alternativas materiales y el usuario debe elegir. Incluye recomendacion, opciones numeradas y accion para continuar.
4. **Problema:** hay fallo, bloqueo o resultado parcial. Indica que paso, impacto, que se intento y caminos disponibles.

No conviertas una respuesta de estado o cierre en una decision artificial. No inventes alternativas para completar una tabla.

### Modo Decision

- Abre con `Mi recomendacion: opcion N` y explica el motivo en una o dos frases.
- Presenta solo alternativas reales y materialmente distintas; normalmente 2 o 3.
- Numera las opciones de forma estable (`1`, `2`, `3`). La recomendada puede ocupar cualquier posicion: no la muevas a la opcion 1 para sesgar la comparacion.
- Para comparaciones utiles, prefiere una tabla pequena de hasta 3 columnas: `Opcion`, `Que aporta`, `Coste o riesgo`. Si una lista es mas clara, usa lista.
- Cierra con una accion inequívoca: `Responde 1, 2, 3 o "adelante" para aceptar mi recomendacion.` Ajusta los numeros a las opciones reales.
- Si una opcion domina claramente y no existe una alternativa material, recomiendala directamente sin fabricar una eleccion.

### Alcance de `adelante`

`Adelante` acepta la opcion recomendada y autoriza las acciones normales, reversibles y comprendidas en el alcance explicado. No autoriza por si solo operaciones destructivas, publicacion remota, gastos, contacto con terceros, cambios sensibles de seguridad ni ampliaciones materiales del alcance; esas acciones conservan sus gates y autorizaciones especificas.

### Autocontrol antes de responder

- [ ] El primer bloque permite entender el resultado o decidir sin leer detalle tecnico.
- [ ] La recomendacion existe solo cuando aporta y su motivo es concreto para este proyecto.
- [ ] Las opciones, si existen, estan numeradas, son reales y muestran su coste o riesgo.
- [ ] La accion siguiente esta clara y no amplía silenciosamente la autorizacion del usuario.
- [ ] La brevedad no oculta evidencia, fallos, incertidumbre ni riesgo material.

Una peticion explicita del usuario puede pedir mas detalle, otro formato o lenguaje mas tecnico. En ese caso adapta la presentacion sin perder conclusion, evidencia ni riesgos.

# Rule 24 — Higiene y propiedad de artefactos

Las instrucciones de orden no bastan para garantizar limpieza. Toda tarea que pueda crear archivos nuevos, diagnosticos, logs, capturas, reportes, backups intermedios o artefactos generados debe aplicar un ciclo de vida verificable.

Reglas obligatorias:

1. Antes de crear, buscar equivalentes y decidir si el archivo es realmente necesario.
2. Clasificar cada artefacto nuevo como `deliverable`, `generated`, `temporary` o `evidence`.
3. Crear temporales solo dentro de `.ai-work/<task-id>/<agent>/` o en el directorio temporal del sistema cuando no necesiten vivir en el proyecto.
4. Usar `scripts/workspace_hygiene.py` del hub resuelto para `snapshot`, `register`, `audit`, `cleanup` y `close` cuando la tarea cree artefactos o tenga riesgo razonable de dejar residuos.
   Si un hook de inicio ya proporciono `task-id` y `agent`, reutiliza esa identidad y no abras un segundo snapshot paralelo.
5. El cleanup automatico solo puede borrar temporales registrados dentro del namespace propio. Nunca debe borrar, mover ni poner en cuarentena archivos preexistentes, ajenos o dudosos.
6. Si una limpieza falla por permisos, locks o rutas inesperadas, el estado es parcial o bloqueado y el fallo debe trasladarse al usuario.
7. `@revisor` comprueba necesidad, duplicacion y archivos huerfanos; `@qa-validador` ejecuta el gate determinista; `@orquestador` no declara cierre sin estado de higiene.
8. Pre-commit y publicacion deben bloquear residuos objetivos: `.ai-work` activo, `.restore_*`, stagings huerfanos y temporales diagnosticos no clasificados.

Formato minimo de retorno interno:

```text
Higiene:
- Entregables nuevos conservados: <rutas o Ninguno>
- Temporales retirados: <rutas o Ninguno>
- Residuos justificados: <rutas, motivo y retencion o Ninguno>
- Limpieza fallida: <detalle o Ninguna>
- Estado: limpio | justificado | bloqueado
```

Los hooks de Codex/OpenCode son una capa auxiliar y pueden requerir confianza o estar desactivados. El script comun y los gates de QA/pre-commit son la garantia portable.

# Rule 25 — Concurrencia de IAs y worktrees

Cuando varias IAs, IDEs o ventanas puedan trabajar en paralelo sobre un mismo repositorio, la coordinacion no debe depender de memoria conversacional ni de que el usuario avise manualmente.

Reglas obligatorias:

1. Rama separada ayuda, pero no basta: si hay paralelismo real, cada IA debe trabajar en su propio `git worktree` o declarar por que el trabajo es solo lectura o ligero.
2. El estado vivo de coordinacion se guarda con `scripts/ai_coordination.py` en el `git common dir`, no solo en `.teams`, porque cada worktree tiene su propia copia de archivos versionados.
3. Para trabajo `normal` o `alto`, si existe coordinacion activa, la IA debe ejecutar o consultar `ai_coordination.py status` antes de editar superficies compartidas.
4. Cada trabajo activo debe tener lease con `task-id`, agente/IDE, rama, worktree y superficies reservadas (`read`, `write` o `exclusive`) cuando el contexto deba sobrevivir al chat.
5. Si una IA va a tocar una superficie reservada por otro lease `write` o `exclusive`, debe frenar, informar del solape y pedir coordinacion antes de editar.
6. Antes de commit, push, PR, merge o release, la IA debe ejecutar el gate proporcional de coordinacion cuando el script exista. Si el gate bloquea, no se publica por inercia.
7. Las superficies criticas usan reserva `exclusive`: migraciones, lockfiles, auth/permisos, secretos/configuracion sensible, reglas globales, scripts de publicacion, releases y cambios estructurales dificiles de revertir.
8. La integracion de ramas paralelas debe seguir un merge train: una rama cada vez contra la rama de integracion actualizada, validacion proporcional y siguiente rama solo despues.
9. `.teams` conserva la memoria persistente, pero no es el mecanismo de bloqueo runtime. El lease local es la fuente operativa para concurrencia en la misma maquina.
10. Los hooks de Codex/OpenCode son auxiliares y pueden estar desactivados; el script comun y los gates son la garantia portable.

Formato minimo para `.teams` cuando hay concurrencia:

```text
Coordinacion:
- Rama: <rama>
- Worktree: <ruta>
- Lease: <id o pendiente>
- Superficies reservadas: <modo:patron>
- Trabajos paralelos conocidos: <TEAM/rama o Ninguno>
- Integracion prevista: <merge train | PR draft | sync push | pendiente>
```

Si el hub o proyecto no tiene aun `scripts/ai_coordination.py`, aplica el fallback manual: revisar ramas/worktrees/PRs/teams activos, declarar el riesgo y evitar editar o publicar superficies compartidas sin confirmacion.

# Rule 25.1 — Paralelizacion interna proporcional

Una peticion unica puede repartirse entre varios agentes cuando eso reduzca latencia o aumente calidad sin crear competencia por la misma superficie. La preferencia operativa es **buscar paralelizacion segura**, no paralelizar por reflejo.

Antes de dividir una peticion, el punto de entrada debe clasificarla:

- `paralelizable`: subtrabajos con superficies distintas o capas claramente separadas. Ejemplos: backend/datos y UI consumidora; implementacion y documentacion sobre una decision ya fijada; investigacion de patrones sin editar junto a implementacion acotada.
- `semi-paralelizable`: un agente edita y otro investiga, revisa o valida sin competir por los mismos archivos. Es el default seguro para tareas medianas con una superficie principal.
- `no paralelizable`: varios agentes tendrian que editar el mismo componente, migracion, lockfile, regla global, contrato de datos o frontera estructural. En ese caso se secuencia: primero decision o implementacion principal, despues review/QA/documentacion.

Reglas:

1. El orquestador debe considerar division interna en trabajos `normal` o `alto` que parezcan medianos/grandes, aunque el usuario lo haya pedido como una sola cosa.
2. No debe dividir si no puede nombrar superficies o roles no competidores.
3. Si dos agentes editarian el mismo archivo o frontera, no hay paralelismo de implementacion; solo puede haber scout/review/QA sin escritura o trabajo secuencial.
4. La paralelizacion interna debe usar Rule 25 cuando haya ediciones reales: worktree/lease/superficies por agente o fallback manual si el runtime no lo permite.
5. El brief debe decir si la tarea es `paralelizable`, `semi-paralelizable` o `no paralelizable`, y por que. Esto evita que la IA interprete la regla como "delegar todo" o "no delegar nunca".
6. La integracion final queda en una sola mano: el orquestador consolida y `@experto-github` aplica gate de coordinacion antes de publicar.

## Skills
A skill is a folder with a `SKILL.md` plus optional scripts, references and assets. El inventario preferente lo proporciona el runtime leyendo `.agents/skills` o la ruta IDE equivalente; este archivo no debe duplicar catalogos largos.

### How to use skills
- Precedencia: si hay agente especializado, enruta primero al agente y deja que el especialista cargue sus skills.
- Activacion: una skill puede activarse por nombre explicito o por coincidencia con su `description`.
- Resolucion: prefiere `.agents/skills/<skill>/SKILL.md`; si no existe, usa la proyeccion local del IDE; si tampoco existe, resuelve el hub desde `.cerebro-operativo/hub-path.txt`.
- Lectura progresiva: abre solo el `SKILL.md` necesario y despues las referencias concretas que esa skill pida.
- Referencias relativas: las proyecciones del hub deben tratar `../docs`, `../scripts`, `../.teams` y `../.questions` como rutas vivas del proyecto; si algo falla, considera la proyeccion desincronizada.
- Context hygiene: no pegues catalogos largos ni leas skills no relacionadas por rutina.

## Agents
An agent is a specialized sub-agent that can be invoked to handle specific tasks. Below is the list of agents available from the hub. Each entry includes a slug, short description, and file path.

### Available agents
- integrador-mcp | desc: Preparar, integrar y verificar MCPs en IDEs usando docs oficiales actualizadas, docs/MCP.md y la skill configurar-mcp sin versionar secretos. | file: C:/Vicente/Programacion/Proyectos/FeriaNet/.opencode/agents/integrador-mcp.md
- ingeniero-backend | desc: Backend, SQL, Supabase, PostgreSQL, RLS, migraciones, seeds, APIs, webhooks, auth server-side y tipos. | file: C:/Vicente/Programacion/Proyectos/FeriaNet/.opencode/agents/ingeniero-backend.md
- implementador | desc: UI, frontend, menu, layout, visual, modal, componente y codigo funcional. Implementa cambios siguiendo el brief y respetando el design system real del proyecto. | file: C:/Vicente/Programacion/Proyectos/FeriaNet/.opencode/agents/implementador.md
- revisor | desc: Review, bugs, regresiones, riesgos materiales, code review, UI review y auditoria antes de validar o publicar. | file: C:/Vicente/Programacion/Proyectos/FeriaNet/.opencode/agents/revisor.md
- qa-validador | desc: Validar, build, tests, lint, typecheck, responsive, accesibilidad basica y checks proporcionales para cambios tecnicos o visuales. | file: C:/Vicente/Programacion/Proyectos/FeriaNet/.opencode/agents/qa-validador.md
- orquestador | desc: Orquestar, delegar y consolidar trabajo multiagente con briefs ejecutivos por contrato, sin invadir la ejecucion especialista. | file: C:/Vicente/Programacion/Proyectos/FeriaNet/.opencode/agents/orquestador.md
- experto-github | desc: Git, GitHub, commit, push, release, versionado y publicacion conservadora tras validacion. | file: C:/Vicente/Programacion/Proyectos/FeriaNet/.opencode/agents/experto-github.md
- auditor-cumplimiento | desc: Auditar cumplimiento observable de un agente contra su brief, skill asociada, requisitos verificables, restricciones de responsabilidades y formato de salida esperado. | file: C:/Vicente/Programacion/Proyectos/FeriaNet/.opencode/agents/auditor-cumplimiento.md
- arquitecto | desc: Arquitectura, navegacion, layout transversal, design system, composicion estructural y decisiones tecnicas dificiles de revertir. | file: C:/Vicente/Programacion/Proyectos/FeriaNet/.opencode/agents/arquitecto.md
- analista-comercial | desc: Investigacion comercial, proveedores, precios, packaging, logistica, equipamiento, margenes y documentacion operativa de negocio para proyectos que venden algo. | file: C:/Vicente/Programacion/Proyectos/FeriaNet/.opencode/agents/analista-comercial.md
- especialista-seguridad | desc: Auditoria de seguridad, auth, permisos, secretos, datos sensibles, RLS, APIs, webhooks, pagos, uploads y hardening proporcional. | file: C:/Vicente/Programacion/Proyectos/FeriaNet/.opencode/agents/especialista-seguridad.md
- documentador | desc: Documentar, actualizar docs, README, SSOT y solo lo necesario tras cambios funcionales, visuales o estructurales. | file: C:/Vicente/Programacion/Proyectos/FeriaNet/.opencode/agents/documentador.md
- crear-agentes | desc: Crear agentes, normalizar agentes, formato Codex oficial, prompts espejo entre Codex y OpenCode y source of truth unica. | file: C:/Vicente/Programacion/Proyectos/FeriaNet/.opencode/agents/crear-agentes.md

### How to use agents
- Discovery: The list above is the agents available in this session. Agent bodies live on disk at the listed paths.
- Entry point: prefer `@orquestador` as the main entry point for trabajo complejo o ambiguo. En Codex no asumas subagentes reales si el runtime no los expone o si el usuario no ha pedido delegacion.
- Mode with agents: classify the request, choose the responsible agent, build a precise brief, delegate, then consolidate. Do not execute the specialist task from the orchestrator when a responsible agent exists.
- Fallback without agents: use only when the runtime cannot invoke real subagents, the required agent is unavailable, or delegation fails because of an observable runtime limitation. Keep the same routing decision internally, state that delegation is being simulated, load the relevant skill when it exists, and stay inside that specialist boundary.
- Responsibility split: skills define reusable domain policy and detailed workflow; agents define role, routing, delegation and coordination. Agents with associated skills must load and obey those skills instead of duplicating their contracts.
- Orchestration boundary: when a hard routing rule applies or a clearly responsible agent exists, `@orquestador` must classify, build the brief, delegate and consolidate. It must not perform the specialist's operational reconstruction or apply the specialist's skill in advance.
- Hard routing: agent compliance audits must route to `@auditor-cumplimiento`; creating, modifying or normalizing agents must route to `@crear-agentes`; MCP setup or verification must route to `@integrador-mcp`; publication/versioning must route to `@experto-github`; security audit, security design, hardening or pre-publication review for auth, permissions, secrets, personal data, RLS, public APIs, webhooks, payments, uploads or admin must route to `@especialista-seguridad`; technical validation must route to `@qa-validador`; material review of code/product/docs/UI changes must route to `@revisor`.
- Publication decision: before mutating Git or GitHub, `@experto-github` must emit a publication decision with type, risk traffic light, branch, scope, commit strategy, PR state, version/tag, validations and authorization. Without explicit authorization or sufficient closeout, the state is `listo para publicar`.
- GitHub human output: `@experto-github` must explain in simple terms what it will do, what it will not do, what was published, where the link is and what residual risk remains. If an operation fails halfway, diagnose local/remote state before retrying and do not create duplicate PRs, tags or releases.
- GitHub local scope: hub-only rules such as `HUB_VERSION`, `HUB-XXX` IDs, fixed `vX.XX.XX` formatting and hub release scripts must not apply to external projects unless their local SSOT explicitly adopts them. If CI exists, consider it proportionally before ready PRs, formal releases or sensitive publication; do not create CI workflows automatically from GitHub publication work.
- Routing summary: puntual UI work such as menus, modals, screens or visual polish should route to `@implementador`; puntual bugs or incorrect behavior in menus, modals, screens or components should also route to `@implementador`; structural navigation, design system, route/name/folder/module-boundary or layout changes should route first to `@arquitecto`.
- Security boundary: `@especialista-seguridad` audits security and recommends corrective ownership, but does not replace `@ingeniero-backend`, `@implementador`, `@revisor` or `@qa-validador`; after fixes, closeout remains proportional to risk.
- Sensitive implementation boundary: if the user asks to implement or fix sensitive backend/frontend behavior, implementation goes to the domain agent and `@especialista-seguridad` enters for design, audit, hardening or proportional closeout.
- UI implementation guardrail: `@implementador` must protect against typical AI UI biases such as landingitis, generic UI, nested cards, superficial responsive checks and library APIs assumed from memory by inspecting real project patterns, loading `elevar-ui-frontend`, using the library-specific skill when available, and reporting closeout through `@revisor` or `@qa-validador` according to risk.
- Mixed UI/backend routing: if a task mixes UI and data, route to `@ingeniero-backend` when it changes data contracts, APIs, SQL, Supabase, RLS, migrations, server-side auth or types; route to `@implementador` when it only consumes existing data in UI/frontend; if both layers are required, split backend first and UI second; if the flow model or layer boundary changes, consult `@arquitecto` first.
- Execution boundary: if a clear specialist agent exists, `@orquestador` should not resolve the change itself even if the fix looks obvious; it should delegate.
- Delegation contract: the orchestrator should transform vague prompts into a concrete brief with objective, surface, expected result, restrictions, files to inspect, checks, related agents only when useful, and a concrete responsibility boundary.
- Solution boundary: in UI and other specialist disciplines, `@orquestador` may pass observed symptoms, risks and acceptance criteria, but must not close concrete composition, CSS, copy, props, commands or internal-structure solutions unless they come literally from the user, SSOT, approved issue, approved architecture or an unavoidable functional constraint backed by an approved source.
- Anti-recipe check: before delegating, `@orquestador` must check whether it is describing the problem or mentally implementing it. If the brief contains classes, props, hooks, commands, literal copy, snippets or closed technical steps, rewrite them as symptoms, constraints, acceptance criteria or `Hipotesis a verificar`; do not use a `Solucion:` section in operational briefs unless backed by an approved source.
- Scroll/viewport UI: scroll, sticky, fixed, overflow, useful-height or viewport symptoms are delegated as UI diagnosis to `@implementador`; CSS classes or properties may appear only as a verifiable hypothesis, not as an order.
- Direct file writes: `@orquestador` must never create, overwrite or modify source/docs files through shell, redirections, heredocs, `Set-Content`, `Out-File`, `Add-Content`, `echo >`, `cat >` or equivalents. Its shell is for inspection, Git and allowed system commands; file writes belong to specialists using structured edit tools or canonical UTF-8 scripts.
- Proactive research: when a task depends on changing information, libraries, APIs, services, IDE/MCP behavior, security, versions, pricing, regulation or unclear technical trade-offs, `@orquestador` marks that the specialist must activate `investigar-antes-de-implementar` or consult current primary documentation. Specialists weigh sources by local project evidence, official versioned docs, source date, provider authority and logic; secondary sources never override the real project or official docs without a reason.
- Route naming boundary: if a brief mentions files or folders, distinguish confirmed canonical routes from candidate routes. A route inferred by `@orquestador` must not be marked as `(nuevo)` or mandatory; the specialist must verify conventions and duplication before creating it.
- Long spec handling: if the user provides a long specification, keep requirements, surfaces, constraints and acceptance criteria, but compact APIs, props, hooks, commands and embedded library mini-docs into references to SSOT, skills or official documentation that the specialist must verify.
- UI closeout defaults: after UI implementation, do not answer using only the implementer output; visual-only tweaks should go through `@revisor` at minimum, interactive/stateful/responsive UI, drawers, scroll, sticky, viewport, overflow or accessibility-sensitive work should go through `@qa-validador` at minimum, and critical flows or business-rule UI should go through both.
- Quality gates: `@revisor` owns material-risk review; `@qa-validador` owns technical readiness; `@orquestador` consolidates results and rejects incomplete agent outputs before answering the user.
- Publication output: `@experto-github` must satisfy the output contract defined by the `configurar-github` skill after any push, PR or release.
- OpenCode note: OpenCode should use its native agent selection and task mechanism. Ignore Codex-only tool names or generic runtime roles if they appear in this file.
- Codex-only note: cuando Codex exponga subagentes reales, usa primero el especialista del hub. Si la sesion no permite invocarlos o la tarea no pidio multiagente, simula el rol dentro del agente principal sin fingir delegacion real.
- Codex deferred discovery: if `AGENTS.md` lists hub agents but `spawn_agent` is not visible in the current Codex tool schema, and the user asks for `@orquestador`, orchestration, delegation, agents, multi-agent work, or a hard routing rule requires an agent, Codex must call `tool_search` for `spawn_agent`, `subagent` or `multi-agent` before using simulated fallback.
- Codex fallback: if the specialist `agent_type` is not exposed in the current tools, or Codex cannot open real subagent threads in this context, state that delegation is being simulated and keep the same routing and brief internally only as fallback for a real runtime limitation, not as a convenience shortcut.
- Each agent has a specific role and should not invade responsibilities of other agents.
- If an agent is missing for a specific need, propose creating one using @crear-agentes.
<!-- CEREBRO_OPERATIVO_IA:codex-bootstrap END -->
