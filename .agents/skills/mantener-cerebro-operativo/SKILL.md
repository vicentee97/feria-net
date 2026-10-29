---
name: mantener-cerebro-operativo
description: "Usar cuando el propio hub CerebroOperativoIA muestre inconsistencias, referencias rotas, drift documental o desalineacion entre skills, scripts y plantillas y haya que detectarlos y arreglarlos. Modo por defecto revisar y corregir; los casos ambiguos se escalan. TRIGGERS: cerebro, hub, inconsistencias, revisar hub, mantener hub, limpiar hub, CerebroOperativoIA."
---

# Mantener Cerebro Operativo

# Frontera de la skill: MANTENIMIENTO del hub, corrige casos claros + escala ambiguos (LEER PRIMERO)

Esta skill mantiene el propio repositorio `CerebroOperativoIA`. La frontera combina correccion autonoma y escalado:

- **CORRIGE** automaticamente los casos mecanicos y reversibles: referencias rotas, nombres heredados, rutas canonicas mal documentadas, drift entre scripts/SSOT/reglas, plantillas desalineadas.
- **ESCALA** los casos que requieren una decision estructural nueva o que tocan superficie sensible (reglas globales, HUB_VERSION, scripts de publicacion, migraciones del hub): los documenta en `.teams/` y los deriva al agente responsable.
- **NEVER** inventa politicas, skills ni reglas nuevas sin evidencia en la SSOT, en las reglas globales o en una decision confirmada del usuario.
- **NEVER** ejecuta `refresh_hub_manifest.py`, `globalize.ps1`, commit, push ni release por iniciativa propia; la publicacion la hace `configurar-github` / **@experto-github**.

Razon: el mantenimiento autonomo agiliza lo mecanico, pero las decisiones estructurales del hub tienen efectos colaterales en proyectos consumidores y deben pasar por gate explicito.

# Objetivo

Mantener `CerebroOperativoIA` coherente, limpio y alineado con sus propias reglas cuando haya pasado tiempo sin revisarse. La skill debe detectar y corregir las incoherencias claras del hub, dejando documentados solo los casos ambiguos o estructuralmente sensibles.

# Anti-patrones y su correccion

Cada sesgo fuerte del entrenamiento base necesita su par MAL -> BIEN -> EJEMPLO. Reconocer el anti-patron no basta para vencerlo.

- **Borrar por limpieza sin evidencia:** MAL eliminar contenido, archivos o skills solo porque "parecen sobrar" o "hace tiempo que no se tocan". BIEN conservar y reubicar antes que borrar; solo borrar si hay evidencia clara de obsolescencia (referencia rota confirmada, regla que el codigo real ignora, duplicacion exacta). EJEMPLO borrar una skill heredada sin verificar que ningun proyecto la enlaza -> peligroso; primero grep de referencias.
- **Inventar politicas por reflejo:** MAL anadir reglas, skills o validadores nuevos para "endurecer" el hub sin evidencia en SSOT/reglas globales/decision del usuario. BIEN escalar el hueco como propuesta documentada en `.teams/`; la creacion real la hace `crear-skills`/`crear-agentes` bajo brief. EJEMPLO crear un nuevo validador de idioma porque "seria bueno" -> escalar, no improvisar.
- **Normalizar historico por estilo:** MAL retocar teams archivados o preguntas antiguas para que "parezcan mas limpios". BIEN tratar el historico como memoria congelada; solo corregir un team antiguo si se retoma ese hilo, contiene un error que induce a fallo operativo o bloquea una decision actual. EJEMPLO renombrar campos de un TEAM cerrado de hace meses -> no; corregir una ruta rota que alguien citara manana -> si.
- **Drift silencioso entre scripts, SSOT y reglas:** MAL dejar que `scripts/validate-hub.ps1`, `docs/SSOT.md` y `docs/AI_GLOBAL_RULES.md` digan cosas distintas sin reconciliar. BIEN detectar la incoherencia, corregir el lado mecanico y dejar el lado de decision como pendiente documentado. EJEMPLO un umbral de frescura distinto en el script y en la SSOT -> corregir el script o escalar la decision, no ignorar.
- **Mantenimiento que publica:** MAL que la pasada termine commiteando, pusheando o regenerando el manifest sin gate. BIEN cerrar con resumen de estado y siguiente paso; la publicacion va por `configurar-github`. EJEMPLO correr `refresh_hub_manifest.py` y `git push` al final de la pasada -> fuera de frontera.

# Alcance y limites
- Aplica al mantenimiento del propio repositorio `CerebroOperativoIA`.
- Su modo por defecto es `revisar y corregir` casos mecanicos y reversibles.
- Detecta y corrige referencias rotas, nombres heredados, incoherencias de documentacion, drift estructural y desalineaciones entre skills, scripts y plantillas.
- Puede actualizar documentacion y validadores del hub si el arreglo es claro y coherente con la SSOT.
- Registra decisiones, pendientes y riesgos en `.teams/`.
- No inventa politicas del hub sin evidencia; no borra contenido util sin claridad; no sustituye la prueba manual del bootstrap multi-IDE en un proyecto dummy.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md) y [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- [Skill transversal de documentacion](../documentar-con-criterio/SKILL.md) y [TODO global](../docs/TODO.md).
- `.teams/` recientes para reconstruir contexto; `scripts/validate-hub-skills.ps1` y `scripts/validate-hub.ps1`.
- Arbol real del repositorio y sus archivos canonicos (`HUB_VERSION`, `HUB_MANIFEST.json`, `agent-prompts.json`, plantillas `.teams/`/`.questions/`).

# Comportamiento esperado

La skill actua como una pasada de mantenimiento profundo del hub, no como una limpieza superficial. Antes de modificar nada: inspecciona el estado real del repositorio, identifica referencias/nombres/plantillas/rutas canonicas, ejecuta las validaciones automaticas y detecta incoherencias entre documentacion, skills, scripts y estructura real. Despues: corrige los casos mecanicos, evita introducir reglas no respaldadas, documenta en `.teams/` lo corregido/pendiente/hipotetico, y cierra con resumen de estado y siguiente paso. Cuando el problema sea exceso, duplicacion o drift documental, apoyarse en `documentar-con-criterio` antes de anadir mas texto o mas archivos.

## Tipos de problemas que debe cubrir como minimo
- Referencias rotas; nombres heredados o inconsistentes; rutas canonicas mal documentadas.
- Skills fuera del estandar estructural; plantillas desalineadas; TODOs desactualizados.
- Incoherencias entre script, SSOT y reglas globales; errores de representacion que afecten claridad o consistencia.
- Drift de orquestacion: verificar que el contrato de @orquestador incluye checkpoint de disciplina para conversaciones largas y que la skill `auditar-orquestacion` existe y esta sincronizada.

## Politica de correccion
- Si un problema es mecanico y reversible, corrígelo directamente.
- Si requiere una decision estructural nueva, escálalo y documenta la duda.
- Si hay tension entre limpieza y conservacion de informacion util, prioriza conservar y reubicar antes que borrar.
- Si se detecta un hueco que merece skill o regla nueva, no la inventes salvo decision confirmada.

## Pasada periodica de archivos de equipo y preguntas

`.teams/` y `.questions/` son memoria operativa entre sesiones del hub. Su mantenimiento debe reducir incertidumbre futura, no producir burocracia ni reescribir historia.

**Disparadores:** cierre formal de fase segun SSOT; antes de una release formal del hub; cuando el ultimo TEAM activo tenga mas de **14 dias** sin actualizarizarse (sincronizado con `Test-TeamFileFreshness` en `scripts/validate-hub.ps1`); o peticion explicita del usuario ("repasar los teams", "limpiar preguntas").

**Pasos concretos:**
1. Listar `.teams/active/TEAM_*.md`, `.teams/archive/TEAM_*.md` y preguntas activas en `.questions/`.
2. En teams activos, comprobar solo lo que afecta continuidad: `Objetivo` verificable y vigente; `Contexto leido` con fuentes reales; `Decisiones` utiles solo si condicionan trabajo futuro; `Validacion` con ejecutado/no ejecutado/riesgo residual; `Pendiente` accionable o `Ninguno`.
3. Clasificar en `mantener` (objetivo abierto, reduce incertidumbre), `cerrar` (objetivo cumplido o sin continuidad) o `bloquear` (falta decision externa).
4. Aplicar: `mantener` actualiza solo lo que reduzca incertidumbre; `cerrar` pone estado `cerrado`, completa validacion/pendiente y mueve a `.teams/archive/`; `bloquear` pone estado `bloqueado` y deja el desbloqueo concreto en `Pendiente`.
5. Regenerar `.teams/INDEX.md` con `scripts/generate-teams-index.ps1` y ejecutar `scripts/validate-teams.ps1` o `python eval/test_teams_integrity.py --fix`. Un team que declara `Estado: cerrado` pero sigue en `.teams/active/` es drift duro y el `--fix` debe archivarlo sin reescribir su contenido.
6. Antes de limpiar `.ai-work`, revisar si contiene `PLAN.md` u otra evidencia viva. Esos artefactos se promueven a `.teams`, se registran como `evidence` o los cierra su owner; no se borran por limpieza generica.

**Politica sobre historico:** no se normalizan teams antiguos por estilo; el historico archivado es memoria congelada; solo se corrige un team antiguo si se retoma ese hilo, contiene un error que induce a fallo operativo o bloquea una decision actual.

Cross-references: [Reglas globales](../docs/AI_GLOBAL_RULES.md) Rule 2 (gate de admision) y Rule 10 (disciplina minima); [Plantilla canonica de equipo](../.teams/TEAM_TEMPLATE.md); [Plantilla canonica de pregunta](../.questions/QUESTION_TEMPLATE.md); [Validador del hub](../scripts/validate-hub.ps1) `Test-TeamFileFreshness` (`FreshnessDays = 14`); [SSOT](../docs/SSOT.md) seccion "Revision periodica".

## Relacion con otras skills
- `crear-skills` normaliza skills concretas fuera de patron; `gestionar-roadmap` cuando el problema principal sea drift en `docs/TODO.md`.
- `configurar-github` entra despues si el resultado validado debe publicarse; `validar-calidad` apoya el cierre tecnico de cambios relevantes.
- `auditar-orquestacion` verifica que @orquestador mantuvo su disciplina; esta skill verifica que esa skill existe y esta integrada.
- `mantener-cerebro-operativo` no sustituye la SSOT: la ejecuta y la protege.

# Cierre OBLIGATORIO: gate de auto-cita

Antes de declarar la pasada lista, declarar (auto-cita con evidencia, no auto-evaluacion). Maximo 7 items:

- [ ] **Declaro** que inspeccione el estado real del repositorio y ejecute las validaciones automaticas (`validate-hub-skills.ps1`, `validate-hub.ps1`, `test_skills.py`) antes de decidir correcciones.
- [ ] **Declaro** que cada correccion autonoma fue mecanica y reversible (referencia rota, nombre heredado, ruta canonica, drift script/SSOT), y que los cambios estructurales quedaron escalados y documentados en `.teams/`.
- [ ] **Declaro** que evite cada anti-patron listado arriba (borrar sin evidencia, inventar politicas, normalizar historico por estilo, drift silencioso, mantenimiento que publica), citando cual aplicaba.
- [ ] **Declaro** que al haber tension entre limpieza y conservacion priorice conservar y reubicar antes que borrar.
- [ ] **Declaro** que la pasada periodica de `.teams/`/`.questions/` clasifico cada archivo en mantener/cerrar/bloquear con criterio de continuidad, sin normalizar historico por estilo.
- [ ] **Declaro** que NO ejecute `refresh_hub_manifest.py`, `globalize.ps1`, commit ni push; el siguiente paso de publicacion queda en manos de `configurar-github`.
- [ ] **Declaro** el resultado del gate de segunda IA (ver abajo).

## Gate de segunda IA (OBLIGATORIO, no sugerencia)

El agente que mantiene el hub no es el que califica que el mantenimiento no haya roto nada. Antes de cerrar:

- Si la pasada **corrigio skills, scripts, plantillas, validadores o reglas** -> delegar OBLIGATORIAMENTE a **@qa-validador** para re-validar `test_skills.py`, `validate-hub-skills.ps1` y `validate-hub.ps1` tras los cambios.
- Si la pasada **toco documentacion canonica o decisiones estructurales** (SSOT, AI_GLOBAL_RULES, HUB_VERSION, scripts de publicacion) -> derivar OBLIGATORIAMENTE a **@revisor** para revision de riesgo antes de cerrar.
- Si la pasada **detecto secrets, permisos mal configurados o superficie sensible** -> escalar OBLIGATORIAMENTE a **@especialista-seguridad**.
- Si la pasada fue **solo de lectura sin correcciones materiales** -> sin segunda IA obligatoria (no burocracia innecesaria).

# Flujo recomendado
- [ ] Leer `docs/SSOT.md`, `docs/AI_GLOBAL_RULES.md` y `docs/TODO.md`.
- [ ] Revisar `.teams/` recientes para recuperar contexto de cambios estructurales.
- [ ] Inspeccionar el arbol real del repositorio y sus rutas canonicas.
- [ ] Ejecutar las validaciones automaticas disponibles.
- [ ] Detectar incoherencias documentales y estructurales; aplicar anti-patrones para no caer en borrar/inventar/normalizar.
- [ ] Corregir automaticamente los casos mecanicos; escalar los estructurales.
- [ ] Pasada periodica de `.teams/`/`.questions/` (mantener/cerrar/bloquear).
- [ ] Resolver el gate de auto-cita y el gate de segunda IA; registrar en `.teams/` y cerrar con resumen.

# Criterio de resultado bueno

Cierre valido cuando el gate de auto-cita de arriba se cumple con evidencia observable y el gate de segunda IA esta resuelto segun la tipificacion. Esta seccion no anade reglas: es el mirror declarativo del gate, repetido aqui solo porque `validate-hub-skills.ps1` exige el header.

## Triggers
- Keywords: cerebro, hub, inconsistencias, revisar hub, mantener hub, limpiar hub, CerebroOperativoIA, drift hub, referencias rotas, pasada mantenimiento.
- Patrones de usuario: "revisa el CerebroOperativoIA", "limpia el hub", "hay inconsistencias en el hub", "optimiza el hub", "repasa los teams", "revisa .questions".
- Encadenamiento: despues de cambios estructurales en el hub; frontera: arreglo mecanico evidente → ejecutar aqui; cualquier decision de cambio → `refinar-cerebro-operativo` antes; antes de `configurar-github`; hermana de `auditar-orquestacion` (verifica integracion) y `validar-calidad` (gate tecnico).

# Ejemplos de activacion
- "Llevo meses sin revisar el CerebroOperativoIA, revisalo y optimizalo."
- "El hub tiene referencias rotas tras los ultimos cambios, haz una pasada."
- "Repasa los teams y questions antes de la release del hub."
