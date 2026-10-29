---
name: refinar-cerebro-operativo
description: "Usar antes de cualquier edicion del hub CerebroOperativoIA: pensamiento profundo previo en 7 fases, analisis del flujo completo y escenarios de fallo. NO es para editar proyectos consumidores del hub. TRIGGERS: editar el hub, mejorar el hub, refinar el hub, anadir skill al hub, modificar agente, tocar skill, revisar skill, pulir hub, reestructurar hub."
---

# Refinar Cerebro Operativo

# Frontera de la skill: METACOGNICION del hub antes de editar (LEER PRIMERO)

Esta skill obliga a pensar antes de tocar el hub. La frontera es de razon previo, no de ejecucion:

- **EXIGE** pasar por las 7 fases de pensamiento (documentadas en el team activo) antes de cualquier edicion del hub.
- **NEVER** empieza a editar sin haber reconstruido intencion, contexto, riesgo y plan.
- **NEVER** inventa cambios por agilidad cuando hay efectos colaterales en proyecciones, agentes, validadores o proyectos consumidores.
- Si una fase revela un STOP (riesgo material, decision que requiere al usuario, precondicion incumplida), la IA frena y lo reporta; no continua por inercia.

Razon: cualquier cambio del hub, por pequeno que parezca, puede tener efectos colaterales en docenas de archivos proyectados, multiples agentes, proyectos consumidores y en el comportamiento de las IAs que cargan las skills. Ver [preferences.md](preferences.md) para los invariantes persistentes del hub (5 pistas del objetivo mayor y umbral de aplicacion de las 7 fases).

# Objetivo

Obligar a la IA a pensar como subjefe antes de tocar el hub `CerebroOperativoIA`. La IA que carga esta skill debe dejar de actuar como operaria y actuar como quien delega y refina.

Esta skill existe porque el usuario esta cansado de repetir las mismas pautas en cada prompt y ha decidido cristalizarlas en una skill transversal del propio hub.

# Anti-patrones y su correccion

Cada sesgo fuerte del entrenamiento base necesita su par MAL -> BIEN -> EJEMPLO. Reconocer el anti-patron no basta para vencerlo.

- **Operaria sin pensar:** MAL empezar a editar skills, scripts o reglas del hub sin haber pasado por las 7 fases. BIEN documentar las 7 fases (aunque sea de forma resumida) en el team activo antes de tocar nada. EJEMPLO ver un typo y arreglarlo sin mas -> excepcion permitida; ver una regla que "choca" y reescribirla sin mapear consumidores -> anti-patron.
- **Saltar fases por prisa:** MAL comprimir las 7 fases a "ya se lo que hay que hacer" cuando el cambio es estructural (regla global, agente, script de publicacion, HUB_VERSION). BIEN escalar el rigor al impacto: typo o link roto evidente no necesitan las 7 fases, pero un cambio de regla global o de frontera entre agentes si las necesita completas. EJEMPLO tocar `docs/AI_GLOBAL_RULES.md` saltandose la Fase 6 (reversibilidad y efectos colaterales) -> anti-patron critico.
- **Inventar sin mapear:** MAL proponer una skill, agente o regla nueva sin haber listado las existentes y detectado si ya cubren el objetivo. BIEN Fase 4 primero: listar redundancias, gaps y obsolescencias antes de anadir nada. EJEMPLO crear una skill de "auditar CI" sin verificar que `gestionar-ci` ya existe -> duplicacion.
- **Ignorar que pasaria si:** MAL ejecutar el plan sin haber imaginado escenarios adversos. BIEN Fase 5: escribir al menos 5 escenarios `que pasaria si` relevantes y blindar los que fallen (re-validar el relleno por muestreo de teams: si mas de la mitad son relleno, sustituir la cuota por categorias obligatorias). EJEMPLO cambiar un marcador CONTRACT sin prever que un IDE lo busca en otra posicion -> se rompen las proyecciones.
- **Confundir preferencia puntual con regla cristalizable:** MAL elevar un "me gusta mas asi" de una sesion a regla global del hub. BIEN solo cristalizar pautas que el usuario ha repetido o que sirven al objetivo mayor (las 5 pistas). EJEMPLO una preferencia de naming de un proyecto consumidor -> no es regla del hub.

# Alcance y limites
- Aplica SOLO a sesiones donde el repositorio objetivo es el propio `CerebroOperativoIA` (el hub), NO a sesiones en proyectos consumidores.
- Aplica antes de cualquier modificacion: skills, agentes, scripts, docs, plantillas, validadores, SSOT, README, AGENTS.md, HUB_MANIFEST.json, HUB_VERSION, etc.
- Aplica tambien para anadir una nueva pieza (skill, agente, script, plantilla).
- NO aplica a tareas puramente consultivas ni a fixes triviales sin impacto (typo, link roto evidente); esos pueden saltarse las 7 fases.
- Si la tarea ya fue analizada en un team activo reciente con conclusion valida, se puede reusar; si no, se arranca desde la Fase 1.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md) (fuente unica de verdad del hub).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- [preferences.md](preferences.md): invariantes persistentes del hub (las 5 pistas del objetivo mayor y el umbral de aplicacion de las 7 fases).
- `HUB_VERSION` y `HUB_MANIFEST.json` (estado de sincronizacion).
- Catalogo completo de skills y de agentes (`scripts/agent-prompts.json`).
- Scripts canonicos del hub: `validate-hub.ps1`, `validate-hub-skills.ps1`, `refresh_hub_manifest.py`, `test_skills.py`, `sync-agent-projections.ps1`, `check-secrets.py`.
- Equipos activos en `.teams/active/` y preguntas abiertas en `.questions/`.
- Estado del stash (`git stash list`), rama actual y worktree si hay sesiones paralelas (Rule 25 y 26).
- Si el cambio toca una regla o un agente, leer el contrato de @orquestador y la skill asociada.

# Comportamiento esperado

La IA NO empieza a editar hasta haber pasado por las 7 fases. Cada fase se documenta de forma resumida en el team activo antes de pasar a la siguiente. Si en cualquier fase aparece un STOP (incumplimiento de precondiciones, riesgo material, decision que requiere al usuario), la IA frena y lo reporta.

## Fase 1 - Entender la intencion real del usuario
Que ha pedido literalmente; que quiere CONSEGUIR (no que haga, sino que consiga); a que objetivo mayor del hub sirve (consultar la SSOT, seccion Fase activa); si hay una pauta repetida que deba cristalizar en regla; si el usuario ha dicho "estoy cansado de X" (X es el problema real, no lo que pide encima).

## Fase 2 - Mapear el contexto actual
Que hay ahora relacionado con el cambio (skills, agentes, scripts, docs, prefs); como interactuan las piezas; que esta cerca del cambio y se vera afectado (archivos, proyecciones, tests, validadores); que dicen los equipos recientes en `.teams/archive/` y las preguntas abiertas en `.questions/`.

## Fase 3 - Pensar como experto en LLMs, harness e IAs
Como descubren las IAs las skills (frontmatter `name` + `description` con `TRIGGERS:`, progressive disclosure); como se proyecta el contenido a los IDEs (junctions para skills, copia para agentes via `sync-agent-projections.ps1`); como mantienen los runtimes la coherencia (frontmatter, marcadores CONTRACT START/END); que limites tienen los modelos (ventana de contexto, alucinaciones de APIs, sesgo a exhaustividad); que sesgos vigilar (landingitis, generic UI, recetas memorizadas); que clientes usa el propietario (Codex, OpenCode, MiniMax Code y DSH), sus rutas compartidas y sus particularidades comprobadas.

## Fase 4 - Analizar redundancias y gaps
Antes de anadir nada nuevo, listar: skills que se solapan (frontera ambigua, candidatas a fusionar o aclarar); agentes cuya responsabilidad puede absorberse en otro; partes del flujo que ya no se usan; documentacion obsoleta (SSOT, README, planes historicos sin archivar); enlaces rotos; reglas que ya no se cumplen (purgarlas o aplicarlas); tests que no validan lo que dicen validar.

## Fase 5 - Anticipar el resultado con escenarios
Escribir al menos 5 `que pasaria si` relevantes: usuario junior que no entiende un termino; IA con poco contexto; sesion larga que olvida la regla a mitad; dos IAs en paralelo sobre el mismo archivo; usuario que dice "si" sin leer el detalle; proxima version del harness que cambia como descubre skills. Si en algun escenario la respuesta es "el sistema falla", blindarlo en esta iteracion, no dejarlo para despues.

## Fase 6 - Pensar en reversibilidad y efectos colaterales
Si me equivoco, puedo volver atras (git revert, snapshot); que archivos se ven afectados (listar explicitamente); que proyecciones hay que regenerar (`sync-agent-projections.ps1`, `refresh_hub_manifest.py`, `globalize.ps1`); que validadores hay que correr (`test_skills.py`, `validate-hub-skills.ps1`, `validate-hub.ps1`, `eval/test_*.py`); que proyectos consumidores podrian romperse (los que enlazan `.agents/skills/<skill>`); si cambio un agente, todos los `.opencode/agents/<agente>.md` y `.codex/agents/<agente>.toml` se regeneran via `sync-agent-projections`.

## Fase 7 - Proponer el plan antes de ejecutar
Con todo lo anterior, escribir en el team activo: objetivo verificable; cambios propuestos (archivos exactos); cambios desechados (con motivo); riesgos identificados; validacion minima al cierre; si algun cambio requiere OK explicito del usuario (borrado, push, publicacion, cambio mayor de version), pedirlo explicitamente. Solo entonces la IA ejecuta.

# El objetivo mayor que el usuario ha verbalizado

El usuario quiere que el hub consiga que programar con IAs sea agradable, profesional y con sensacion de equipo. Las 5 pistas concretas (cristalizadas en [preferences.md](preferences.md) como invariante `objetivo-mayor-cinco-pistas`):

- Que de gusto programar.
- Que parezca que tengo un subjefe que delega.
- Que vibecoding parezca que tengo un equipo que me da feedback facil de entender.
- Que se encarguen de todo de forma profesional.
- Con protocolos.

Cada cambio que la IA proponga o ejecute en el hub debe medirse contra estas 5 pistas. Si un cambio las empeora, no va; si las mejora, va aunque sea pequeno.

# Cierre OBLIGATORIO: gate de auto-cita

Antes de declarar el refinamiento listo, declarar (auto-cita con evidencia, no auto-evaluacion). Maximo 7 items:

- [ ] **Declaro** que documente las 7 fases en el team activo antes de editar (salvo fix trivial permitido por el umbral de [preferences.md](preferences.md)).
- [ ] **Declaro** que reconstrui intencion real, contexto, sesgos de LLM/harness, redundancias, escenarios `que pasaria si`, reversibilidad y plan antes de ejecutar.
- [ ] **Declaro** que evite cada anti-patron listado arriba (operaria sin pensar, saltar fases por prisa, inventar sin mapear, ignorar escenarios, confundir preferencia puntual con regla cristalizable), citando cual aplicaba.
- [ ] **Declaro** que medi el cambio contra las 5 pistas del objetivo mayor y que no las empeora.
- [ ] **Declaro** que pare en los STOP (riesgo material, decision del usuario, precondicion incumplida) en lugar de continuar por inercia.
- [ ] **Declaro** que el plan quedo escrito en el team activo con archivos exactos, cambios desechados, riesgos y validacion minima.
- [ ] **Declaro** el resultado del gate de segunda IA (ver abajo).

## Gate de segunda IA (OBLIGATORIO, no sugerencia)

El agente que refina el hub no es el que califica que el cambio estructural no haya roto nada. Antes de cerrar:

- Si el refinamiento **toca skills, scripts, plantillas, validadores, reglas globales, HUB_VERSION o AGENTS.md** -> delegar OBLIGATORIAMENTE a **@qa-validador** para re-validar `test_skills.py`, `validate-hub-skills.ps1` y `validate-hub.ps1`, y a **@revisor** para revision de riesgo material (proyecciones, proyectos consumidores, efectos colaterales).
- Si el refinamiento **cambia fronteras entre agentes o el contrato de @orquestador** -> derivar OBLIGATORIAMENTE a **@auditor-cumplimiento** para validar coherencia de delegacion.
- Si el refinamiento **detecta secrets, permisos o superficie sensible** -> escalar OBLIGATORIAMENTE a **@especialista-seguridad**.
- Si el refinamiento fue **solo analisis sin cambios materiales** (diagnostico para decision del usuario) -> sin segunda IA obligatoria (no burocracia innecesaria).

# Flujo recomendado
- [ ] Fase 1: entender la intencion real (no lo literal, lo que quiere conseguir).
- [ ] Fase 2: mapear el contexto actual del hub (skills, agentes, scripts, docs, equipos, preguntas).
- [ ] Fase 3: pensar como experto en LLMs, harness e IAs antes de decidir nada tecnico.
- [ ] Fase 4: listar redundancias, gaps y obsolescencias detectadas.
- [ ] Fase 5: anticipar el resultado con al menos 5 escenarios `que pasaria si`.
- [ ] Fase 6: medir reversibilidad y efectos colaterales (archivos, proyecciones, validadores, consumidores).
- [ ] Fase 7: escribir el plan en el team activo y pedir OK explicito si hay decisiones de jefe.
- [ ] Ejecutar; resolver el gate de auto-cita y el gate de segunda IA; validar con `test_skills.py`, `validate-hub-skills.ps1`, `validate-hub.ps1` y los tests de `eval/`.

# Criterio de resultado bueno

Cierre valido cuando el gate de auto-cita de arriba se cumple con evidencia observable y el gate de segunda IA esta resuelto segun la tipificacion. Esta seccion no anade reglas: es el mirror declarativo del gate, repetido aqui solo porque `validate-hub-skills.ps1` exige el header.

## Triggers
- Keywords: editar el hub, mejorar el hub, refinar el hub, anadir skill al hub, modificar agente, tocar skill, revisar skill, mejorar flujo, pulir hub, optimizar hub, repensar hub, reestructurar hub, evolucionar hub, auditar hub, limpieza profunda del hub, repensar una skill, repensar un agente, repensar una regla.
- Patrones de usuario: "Vamos a tocar el hub", "Quiero mejorar X del hub", "Pulamos esto del hub", "La skill Y no me convence", "El flujo Z podria ser mejor", "Limpia esto", "Esto esta cogiendo polvo", "Lo hago porque estoy cansado de repetir X".
- Encadenamiento: antes `coordinar-sesiones-multi-ia` (lease y team activo); despues `mantener-cerebro-operativo` (frontera: revision/limpieza sin cambio concreto → mantener primero; SIEMPRE que se vaya a editar algo del hub, refinar antes) o `crear-skills` / `crear-agentes` (si la accion concreta es crear); hermanas `auditar-orquestacion` (auditar la delegacion tras cambios en agentes), `validar-calidad` (gate tecnico al cierre), `revisar-cambios` (pre-push), `comunicar-como-jefe` (modo de respuesta al usuario en todo momento).

# Ejemplos de activacion
- "Quiero retocar la skill auditar-proyecto-tecnico porque me da la sensacion de que duplica cosas con auditar-seguridad."
- "He anadido 3 skills este mes y ya no se cual usar para cada cosa. Limpia las que sobren o fusiona las que se solapen."
- "El hub ha crecido mucho y la SSOT tiene capitulos que ya no se leen. Quiero una pasada de claridad."
- "Voy a empezar a usar el hub para vibecoding en proyectos pequenos y quiero que la primera sesion sea fluida: dime que tendrias que cambiar para que eso pase."
