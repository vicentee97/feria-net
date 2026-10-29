---
name: crear-agentes
description: "Usar cuando vayas a crear, modificar o normalizar un agente del hub y necesites asegurar fuente canonica unica, prompts compatibles Codex/OpenCode, fronteras claras y validacion contra drift. TRIGGERS: crear agente, modificar agente, normalizar agente, agentes, prompts de agentes, formato Codex, OpenCode."
---

# Crear Agentes

# Objetivo

Definir y mantener agentes especializados del hub sin duplicar politicas de dominio, sin crear roles redundantes y sin romper la compatibilidad multi-IDE.

La skill existe para blindar el anti-patron mas tipico: agentes que solo copian su skill de dominio sin aportar rol operativo, generando ruido sin routing claro. Un agente 1:1 es valido solo si aporta rol, fronteras, escalada y contrato de salida reconocibles.

# Anti-patrones y su correccion

Cada sesgo del entrenamiento base necesita su par MAL -> BIEN -> EJEMPLO. Reconocer el anti-patron no basta para vencerlo.

- **Agente espejo de su skill (D1, critico):** MAL crear un agente que copia el procedimiento completo de su skill con otro nombre. BIEN mantener en el agente solo routing, fronteras, condiciones de escalada, contrato de salida y relacion con otros agentes; mover la politica reusable a la skill. EJEMPLO `@implementador` NO repite las 9 reglas de `elevar-ui-frontend`; carga la skill y enruta.
- **Editar proyecciones como fuente (D2):** MAL editar directamente `.opencode/agents/<x>.md` o `.codex/agents/<x>.toml`. BIEN editar `scripts/agent-prompts.json` (fuente canonica) y regenerar proyecciones. EJEMPLO cambio el prompt de `@revisor` -> modifico `agent-prompts.json`, no el `.md` generado.
- **No regenerar proyecciones (D3):** MAL editar la fuente canonica y olvidar `scripts/sync-agent-projections.ps1` o `globalize.ps1`. BIEN regenerar siempre tras cualquier cambio y verificar que `.opencode/agents/` y `.codex/agents/` coinciden. EJEMPLO tras cambiar `agent-prompts.json`: ejecutar sync y diff entre `.md` y `.toml`.
- **Drift o mojibake sin verificar (D4):** MAL declarar el agente listo sin revisar encoding, drift ni obsolescencia. BIEN verificar ausencia de mojibake, drift y agentes obsoletos; aplicar `crear-skills` (regla encoding UTF-8 estricto). EJEMPLO tras regenerar: `python scripts/test_skills.py` y `pwsh scripts/validate-hub-skills.ps1` pasan sin warnings de encoding.
- **Frontera difusa con otro agente (D5):** MAL crear un agente cuya responsabilidad solapa la de otro existente. BIEN revisar el mapa de agentes antes; si hay solape, fusionar o aclarar la frontera. EJEMPLO propongo `@frontend-validator` que solapa con `@revisor` -> fusionar o reducir el nuevo a un caso no cubierto.
- **Politica reusable enterrada en prompt (D6):** MAL meter dentro del prompt del agente reglas que aplican a cualquier skill consumidora. BIEN extraer esa politica a una skill y referenciarla desde el agente. EJEMPLO regla "todo cambio UI pasa por @qa-validador" -> vive en `elevar-ui-frontend`; el agente solo la cita.

# Alcance y limites
- Crea, modifica, normaliza o elimina agentes del mapa del hub.
- Decide que parte debe vivir en el agente y que parte en una skill (anti-patron D1, D6).
- Mantiene `scripts/agent-prompts.json` como fuente canonica de prompts de agentes.
- Exige regenerar proyecciones tras cambios en agentes (anti-patron D3).
- NEVER crea skills de dominio completas por reflejo: solo las propone o crea cuando la politica reusable no debe vivir dentro del agente.
- NEVER edita directamente `.opencode/agents/` ni `.codex/agents/` como fuente de verdad (anti-patron D2).

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- Mapa actual en `scripts/agent-prompts.json`.
- Proyecciones generadas en `.opencode/agents/` y `.codex/agents/`.
- Skill de dominio asociada cuando exista.
- Skill `crear-skills` (reglas de encoding, naming, frontmatter y gate de cierre) para mantener compatibilidad estructural.

# Comportamiento esperado

## Separacion agente vs skill (anti-patron D1, D6)
- La skill define como se hace bien una disciplina reusable.
- El agente define quien entra, cuando entra, que limites tiene, a quien escala y que evidencia devuelve.
- Si un agente 1:1 repite el procedimiento completo de su skill, reducir el agente y mover la politica reusable a la skill.
- Si un agente coordina varias skills o varias situaciones, mantener en el agente solo routing, fronteras y combinacion de responsabilidades.

## Agentes 1:1 con skill
Un agente 1:1 con una skill es valido si aporta rol operativo: routing claro; limites de superficie; condiciones de escalada; contrato de salida; relacion con otros agentes. No es valido si solo copia la skill con otro nombre.

## Fuente canonica (anti-patron D2, D3)
- Editar agentes en `scripts/agent-prompts.json`.
- Regenerar proyecciones con `scripts/sync-agent-projections.ps1` o `globalize.ps1`.
- Tratar `.opencode/agents/*.md` y `.codex/agents/*.toml` como artefactos generados.
- Verificar que no hay drift, mojibake ni agentes obsoletos (anti-patron D4).

## Redaccion robusta
Cada agente incluye, proporcionado a su riesgo: objetivo claro; alcance y limites; inputs obligatorios; comportamiento esperado; regla de no invadir responsabilidades; mapa de agentes; triggers; flujo recomendado; criterio de resultado bueno; ejemplos de activacion; transparencia en fallos de herramientas/MCPs (referencia a Rule 19 de `AI_GLOBAL_RULES.md`: reportar fallos explicitamente, no continuar como si la herramienta hubiera funcionado, marcar estado de la tarea y trasladar fallos a @orquestador cuando trabaje bajo delegacion).

Cuando una regla pueda malinterpretarse, anadir un ejemplo breve. Cuando se prohiba algo, indicar que debe hacer el agente en su lugar (par MAL -> BIEN).

# Flujo recomendado
- [ ] Entender la necesidad real del agente o cambio; revisar el mapa para descartar solapamiento (anti-patron D5).
- [ ] Decidir si el contenido pertenece a agente, skill o SSOT (anti-patron D1, D6).
- [ ] Actualizar `scripts/agent-prompts.json` como fuente canonica (anti-patron D2).
- [ ] Regenerar proyecciones con `scripts/sync-agent-projections.ps1` o `globalize.ps1` (anti-patron D3).
- [ ] Verificar ausencia de drift, mojibake y obsolescencia (anti-patron D4).
- [ ] Ejecutar validaciones del hub (`test_skills.py`, `validate-hub-skills.ps1`).
- [ ] Resolver gate de auto-cita + gate de segunda IA.

# Cierre OBLIGATORIO: gate de auto-cita

Antes de declarar el agente creado, modificado o normalizado como listo, declarar (auto-cita con evidencia, no auto-evaluacion). Maximo 7 items:

- [ ] **Declaro** que el agente no duplica otro agente del mapa y aporta rol operativo reconocible (anti-patron D1, D5).
- [ ] **Declaro** que la politica reusable vive en skills, no enterrada en el prompt del agente (anti-patron D6).
- [ ] **Declaro** que edite `scripts/agent-prompts.json` como fuente canonica y que `.opencode/agents/` y `.codex/agents/` son artefactos generados (anti-patron D2).
- [ ] **Declaro** que regeneré las proyecciones tras el cambio y que coinciden con la fuente canonica (anti-patron D3).
- [ ] **Declaro** que verifique ausencia de drift, mojibake y agentes obsoletos con los validadores del hub (anti-patron D4).
- [ ] **Declaro** que el agente incluye los apartados canonicos (objetivo, alcance, inputs, comportamiento, no invadir responsabilidades, mapa, triggers, flujo, criterio, ejemplos, transparencia en fallos).
- [ ] **Declaro** el resultado del gate de segunda IA (ver abajo).

## Gate de segunda IA (OBLIGATORIO, no sugerencia)

El agente que crea o normaliza no es el que califica. Antes de cerrar:

- **Agente nuevo o normalizacion estructural** -> delegar OBLIGATORIAMENTE a **@revisor** (verifica que no duplica otro agente, fronteras claras y que la politica reusable no quedo enterrada) y a **@auditor-cumplimiento** (verifica que el agente cumple su brief, fronteras y formato de salida).
- **Cambio que afecta a routing de orquestacion o a las reglas de no invadir responsabilidades** -> delegar OBLIGATORIAMENTE a **@revisor** + **@auditor-cumplimiento**.
- **Cambio solo de typo o microajuste de prompt sin impacto en routing ni fronteras** -> sin segunda IA obligatoria (no burocracia innecesaria).

# Criterio de resultado bueno

Cierre valido cuando el gate de auto-cita de arriba se cumple con evidencia observable y el gate de segunda IA esta resuelto segun la tipificacion. Esta seccion no anade reglas: es el mirror declarativo del gate, repetido aqui solo porque `validate-hub-skills.ps1` exige el header.

## Triggers
- Keywords: crear agente, modificar agente, normalizar agente, prompts de agentes, formato Codex, OpenCode, agentes
- Patrones de usuario: "Crea un agente para X", "Normaliza estos agentes", "Actualiza el prompt de @implementador", "Separa esta politica del agente"
- Encadenamiento: despues de `crear-skills` si la accion genera skill nueva; antes de `validar-calidad`; si se crea/cambia documentacion, coordinar con `documentar-con-criterio`

# Ejemplos de activacion
"Crea un agente para seguridad sin duplicar las reglas de la skill de seguridad."

"Normaliza @crear-agentes para que use una skill asociada en vez de guardar toda la politica en el prompt."
