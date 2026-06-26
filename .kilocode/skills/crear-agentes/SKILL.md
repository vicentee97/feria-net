---
name: crear-agentes
description: "Crear, modificar o normalizar agentes del hub con fuente canonica unica, prompts compatibles Codex/OpenCode, fronteras de responsabilidad y validacion contra drift. TRIGGERS: crear agente, modificar agente, normalizar agente, agentes, prompts de agentes, formato Codex, OpenCode."
---

# Crear Agentes

# Objetivo
Definir y mantener agentes especializados del hub sin duplicar politicas de dominio, sin crear roles redundantes y sin romper la compatibilidad multi-IDE.

# Alcance y limites
- Si crea, modifica, normaliza o elimina agentes del mapa del hub.
- Si decide que parte debe vivir en el agente y que parte debe vivir en una skill.
- Si mantiene `scripts/agent-prompts.json` como fuente canonica de prompts de agentes.
- Si exige regenerar proyecciones tras cambios en agentes.
- No crea skills de dominio completas por reflejo: solo las propone o crea cuando la politica reusable no debe vivir dentro del agente.
- No edita directamente `.opencode/agents/` ni `.codex/agents/` como fuente de verdad.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- Mapa actual en `scripts/agent-prompts.json`.
- Proyecciones generadas en `.opencode/agents/` y `.codex/agents/`.
- Skill de dominio asociada cuando exista.

# Comportamiento esperado
## Separacion agente vs skill
- La skill define como se hace bien una disciplina reusable.
- El agente define quien entra, cuando entra, que limites tiene, a quien escala y que evidencia devuelve.
- Si un agente 1:1 repite el procedimiento completo de su skill, reducir el agente y mover la politica reusable a la skill.
- Si un agente coordina varias skills o varias situaciones, mantener en el agente solo routing, fronteras y combinacion de responsabilidades.

## Agentes 1:1 con skill
Un agente 1:1 con una skill es valido si aporta rol operativo:
- routing claro;
- limites de superficie;
- condiciones de escalada;
- contrato de salida;
- relacion con otros agentes.

No es valido si solo copia la skill con otro nombre.

## Fuente canonica
- Editar agentes en `scripts/agent-prompts.json`.
- Regenerar proyecciones con `scripts/sync-agent-projections.ps1` o `globalize.ps1`.
- Tratar `.opencode/agents/*.md` y `.codex/agents/*.toml` como artefactos generados.
- Verificar que no hay drift, mojibake ni agentes obsoletos.

## Redaccion robusta
Cada agente debe incluir, proporcionado a su riesgo:
- objetivo claro;
- alcance y limites;
- inputs obligatorios;
- comportamiento esperado;
- regla de no invadir responsabilidades;
- mapa de agentes;
- triggers;
- flujo recomendado;
- criterio de resultado bueno;
- ejemplos de activacion;
- transparencia en fallos de herramientas/MCPs (referencia a Rule 19 de AI_GLOBAL_RULES.md: reportar fallos explicitamente, no continuar como si la herramienta hubiera funcionado, marcar estado de la tarea y trasladar fallos al orquestador cuando trabaje bajo delegacion).

Cuando una regla pueda malinterpretarse, anadir un ejemplo breve. Cuando se prohiba algo, indicar que debe hacer el agente en su lugar.

# Flujo recomendado
- [ ] Entender la necesidad real del agente o cambio.
- [ ] Revisar si ya existe un agente o skill que cubre esa responsabilidad.
- [ ] Decidir si el contenido pertenece a agente, skill o SSOT.
- [ ] Actualizar `scripts/agent-prompts.json` como fuente canonica.
- [ ] Regenerar proyecciones.
- [ ] Ejecutar validaciones del hub.
- [ ] Revisar que no hay duplicacion, drift ni mojibake.

# Criterio de resultado bueno
- El agente tiene una responsabilidad reconocible y no duplica otro agente.
- Las politicas reusables viven en skills, no enterradas en prompts de agente.
- Las proyecciones Codex/OpenCode coinciden con la fuente canonica.
- La salida del agente es auditable y no invade responsabilidades ajenas.

## Triggers
- Keywords: crear agente, modificar agente, normalizar agente, prompts de agentes, formato Codex, OpenCode, agentes
- Patrones de usuario: "Crea un agente para X", "Normaliza estos agentes", "Actualiza el prompt de @implementador", "Separa esta politica del agente"
- Encadenamiento: usar antes de `validar-calidad`; si se crea o cambia documentacion, coordinar con `documentar-con-criterio`

# Ejemplos de activacion
"Crea un agente para seguridad sin duplicar las reglas de la skill de seguridad."
"Normaliza @crear-agentes para que use una skill asociada en vez de guardar toda la politica en el prompt."
