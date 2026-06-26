---
name: mantener-cerebro-operativo
description: "Revisa y corrige el propio hub CerebroOperativoIA para detectar y arreglar inconsistencias, referencias rotas, drift documental y desalineaciones entre skills, scripts y plantillas. TRIGGERS: cerebro, hub, inconsistencias, revisar hub, mantener hub, limpiar hub, CerebroOperativoIA."
---

# Objetivo
Mantener `CerebroOperativoIA` coherente, limpio y alineado con sus propias reglas cuando haya pasado tiempo sin revisarse.

Esta skill debe detectar y corregir automáticamente las incoherencias claras del hub, dejando documentados solo los casos ambiguos o estructuralmente sensibles.

# Alcance y límites
- Aplica al mantenimiento del propio repositorio `CerebroOperativoIA`.
- Su modo por defecto es `revisar y corregir`.
- Sí debe detectar y corregir referencias rotas, nombres heredados, incoherencias de documentación, drift estructural y desalineaciones entre skills, scripts y plantillas.
- Sí puede actualizar documentación y validadores del hub si el arreglo es claro y coherente con la SSOT.
- Sí debe registrar decisiones, pendientes y riesgos en `.teams/`.
- No debe inventar nuevas políticas del hub sin evidencia en la SSOT, reglas globales o decisiones confirmadas del usuario.
- No debe borrar contenido útil solo por limpieza si no está claro que sobra.
- No sustituye revisiones funcionales de campo, como la prueba manual del bootstrap multi-IDE en un proyecto dummy.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- [Skill transversal de documentación](../documentar-con-criterio/SKILL.md).
- [TODO global del repositorio](../docs/TODO.md).
- `.teams/` recientes para reconstruir contexto.
- `scripts/validate-hub-skills.ps1`.
- Árbol real del repositorio y sus archivos canónicos.

# Comportamiento esperado
La skill debe actuar como una pasada de mantenimiento profundo del hub, no como una limpieza superficial.

Antes de modificar nada:
- inspecciona el estado real del repositorio;
- identifica referencias, nombres, plantillas y rutas canónicas;
- ejecuta las validaciones automáticas disponibles;
- detecta incoherencias entre documentación, skills, scripts y estructura real.

Después debe:
- corregir automáticamente los casos claros;
- evitar introducir nuevas reglas no respaldadas;
- documentar en `.teams/` lo corregido, lo pendiente y cualquier hipótesis adoptada;
- cerrar con un resumen claro del estado del hub y el siguiente paso recomendado.

Cuando el problema sea de exceso, duplicación o drift documental, debe apoyarse en `documentar-con-criterio` antes de añadir más texto o más archivos.

## Tipos de problemas que debe cubrir como mínimo
- Referencias rotas.
- Nombres heredados o inconsistentes.
- Rutas canónicas mal documentadas.
- Skills fuera del estándar estructural.
- Plantillas desalineadas.
- TODOs desactualizados.
- Incoherencias entre script, SSOT y reglas globales.
- Errores de representación del contenido cuando afecten claridad o consistencia.
- Drift de orquestacion: verificar que el contrato del orquestador incluye checkpoint de disciplina para conversaciones largas y que la skill `auditar-orquestacion` existe y esta sincronizada.

## Política de corrección
- Si un problema es mecánico y reversible, corrígelo directamente.
- Si un problema requiere una decisión estructural nueva, escálalo y documenta la duda.
- Si hay tensión entre limpieza y preservación de información útil, prioriza conservar y reubicar antes que borrar.
- Si el mantenimiento detecta un hueco que merece una skill o regla nueva, no la inventes automáticamente salvo que ya esté claramente decidida.

## Pasada periodica de archivos de equipo y preguntas

`.teams/` y `.questions/` son memoria operativa entre sesiones del hub. Su mantenimiento debe reducir incertidumbre futura, no producir burocracia ni reescribir historia.

### Objetivo

Detectar teams activos obsoletos, duplicados, bloqueados o sin informacion minima util, y revisar preguntas abiertas que ya no aportan decision. El resultado debe ser una de tres acciones: `mantener`, `cerrar` o `bloquear`.

### Disparadores explicitos

La pasada se ejecuta cuando se da al menos uno de estos disparadores:

- Al cierre formal de una fase del proyecto, segun `docs/SSOT.md`.
- Antes de una release formal del hub, cuando se invoca `configurar-github` con tipo `release formal`.
- Cuando el ultimo archivo de equipo activo tenga mas de **14 dias** sin actualizarse. Este umbral se sincroniza con `Test-TeamFileFreshness` en `scripts/validate-hub.ps1`.
- Cuando el usuario pida explicitamente "repasar los teams", "revisar `.teams/`", "limpiar preguntas" o equivalente.

### Pasos concretos

1. Listar `.teams/active/TEAM_*.md`, `.teams/archive/TEAM_*.md` y preguntas activas en `.questions/`.
2. En teams activos, comprobar solo lo que afecta continuidad:
   - `Objetivo` verificable y todavia vigente;
   - `Contexto leido` con fuentes reales, no inferidas;
   - `Decisiones` utiles solo si condicionan trabajo futuro;
   - `Validacion` con ejecutado, no ejecutado y riesgo residual;
   - `Pendiente` accionable o `Ninguno`.
3. Clasificar:
   - `mantener`: el objetivo sigue abierto y el team reduce incertidumbre.
   - `cerrar`: el objetivo esta cumplido o ya no requiere continuidad.
   - `bloquear`: falta una decision externa o dato que impide avanzar.
4. Aplicar la accion:
   - `mantener`: actualizar solo los apartados que reduzcan incertidumbre futura.
   - `cerrar`: poner estado `cerrado`, completar validacion/pendiente y mover a `.teams/archive/`.
   - `bloquear`: poner estado `bloqueado` y dejar el desbloqueo concreto en `Pendiente`.
5. Regenerar `.teams/INDEX.md` con `scripts/generate-teams-index.ps1` y ejecutar `scripts/validate-teams.ps1` o `python eval/test_teams_integrity.py --fix`.

### Politica sobre historico

- No se normalizan teams antiguos por estilo.
- El historico archivado se considera memoria congelada.
- Solo se corrige un team antiguo si se retoma exactamente ese hilo, contiene un error que induce a fallo operativo o bloquea una decision actual.

### Cross-references

La pasada periódica se apoya sin duplicar contenido en:

- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md) — Rule 2 (gate de admisión para crear/reutilizar archivo de equipo) y Rule 10 (disciplina mínima: gate de admisión, umbral de frescura de 5 intercambios, warning en publicación).
- [Plantilla canónica de equipo](../.teams/TEAM_TEMPLATE.md) — contrato minimo con Objetivo, Contexto leido, Decisiones, Trabajo realizado, Validacion y Pendiente.
- [Plantilla canónica de pregunta](../.questions/QUESTION_TEMPLATE.md) — formato mínimo con campo opcional `Equipo relacionado`.
- [Validador del hub](../scripts/validate-hub.ps1) — `Test-TeamFileFreshness` con `FreshnessDays = 14`, que actúa como señal de aviso no bloqueante.
- [SSOT del repositorio](../docs/SSOT.md) — sección "Revisión periódica" como contexto superior de la cadencia del hub.

## Relación con otras skills
- `crear-skills` ayuda a normalizar skills concretas si una de ellas está fuera de patrón.
- `gestionar-roadmap` debe usarse cuando el problema principal sea drift, ruido o mala estructura en `docs/TODO.md`.
- `configurar-github` entra después si el resultado validado debe publicarse.
- `validar-calidad` puede apoyar el cierre técnico de cambios relevantes del hub.
- `auditar-orquestacion` verifica que el orquestador mantuvo su disciplina de delegacion; `mantener-cerebro-operativo` verifica que esa skill existe y esta correctamente integrada.
- `mantener-cerebro-operativo` no sustituye la SSOT del repositorio; la ejecuta y la protege.

# Flujo recomendado
- [ ] Leer `docs/SSOT.md`, `docs/AI_GLOBAL_RULES.md` y `docs/TODO.md`.
- [ ] Revisar `.teams/` recientes para recuperar contexto de cambios estructurales.
- [ ] Inspeccionar el árbol real del repositorio y sus rutas canónicas.
- [ ] Ejecutar las validaciones automáticas disponibles.
- [ ] Detectar incoherencias documentales y estructurales.
- [ ] Corregir automáticamente los casos claros.
- [ ] Registrar en `.teams/` lo corregido, lo diferido y cualquier duda importante.
- [ ] Cerrar con un resumen de estado y siguiente paso recomendado.

# Criterio de resultado bueno
La skill está bien aplicada si:
- el hub queda más coherente que antes de la revisión;
- se corrigen referencias, nombres y rutas claramente erróneos;
- las skills, plantillas y validadores quedan alineados con la SSOT;
- los casos ambiguos quedan documentados y no escondidos;
- no se sustituye la validación manual futura del flujo multi-IDE en proyecto dummy;
- los archivos de equipo y las preguntas activas de `.teams/` y `.questions/` quedan revisados periodicamente con criterios minimos de continuidad, sin normalizar historico por estilo.

## Triggers
- Keywords: cerebro, hub, inconsistencias, revisar hub, mantener hub, limpiar hub, CerebroOperativoIA
- Patrones de usuario: "revisa el CerebroOperativoIA", "limpia el hub", "hay inconsistencias en el hub", "optimiza el hub"
- Encadenamiento: despues de cambios estructurales en el hub, antes de `configurar-github`

# Ejemplos de activación
"Llevo meses sin revisar el CerebroOperativoIA, revísalo y optimízalo."

