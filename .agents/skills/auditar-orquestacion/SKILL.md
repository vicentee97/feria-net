---
name: auditar-orquestacion
description: "Usar al cerrar una sesion compleja para auditar si el orquestador delego correctamente o invadio responsabilidades de otros agentes. REPORTA hallazgos con evidencia; no corrige la orquestacion ni el codigo. TRIGGERS: auditar orquestacion, orquestador delego, verificacion delegacion, disciplina orquestador, sesion larga."
---

# Auditar Orquestacion

# Frontera de la skill: AUDITA, no corrige (LEER PRIMERO)

Esta skill es de auditoria de delegacion, no de ejecucion. La frontera es estricta:

- **REPORTA** invasiones de responsabilidad con evidencia observable (accion concreta + agente que deberia haberla ejecutado).
- **NEVER** corrige el codigo que @orquestador escribio por error; lo senala y deriva al agente responsable.
- **NEVER** reescribe los briefs ni rehace la orquestacion; emite un diagnostico para la proxima sesion.
- Las correcciones reales las ejecutan los agentes especialistas (`@implementador`, `@ingeniero-backend`, `@crear-agentes`, `@documentador`, `@qa-validador`) bajo brief explicito.

Razon: una auditoria que corrige pierde su neutralidad como checkpoint. Ver [auditar-proyecto-tecnico/SKILL.md](../auditar-proyecto-tecnico/SKILL.md) para la misma frontera aplicada a configs y dependencias.

# Objetivo

Verificar si @orquestador mantuvo su contrato de delegacion durante una sesion de trabajo, detectando invasiones de responsabilidades con evidencia observable y proponiendo correcciones operativas para sesiones futuras.

# Anti-patrones y su correccion

Cada sesgo de invasion necesita su par MAL -> BIEN -> EJEMPLO. Reconocer el anti-patron no basta; hay que senalar el agente responsable correcto.

- **Escritura directa de archivos fuente:** MAL que @orquestador use `Set-Content`, `Out-File`, `Add-Content`, `echo >`, `cat >` o heredocs para escribir codigo/docs. BIEN delegar la escritura a `@implementador` (codigo) o `@documentador` (docs) con brief explicito; el shell de @orquestador es para inspeccion, Git y comandos de sistema. EJEMPLO @orquestador que crea `src/utils.ts` con `Set-Content` -> hallazgo P1; deberia haber briefado a @implementador.
- **Edicion de codigo en caliente:** MAL que @orquestador edite componentes, SQL, migraciones o logica de negocio directamente. BIEN derivar a `@implementador` o `@ingeniero-backend` segun frontera UI/backend. EJEMPLO @orquestador cambia un `return` en un handler -> P1; era trabajo de @ingeniero-backend.
- **Build y validaciones ejecutadas por el orquestador:** MAL que @orquestador corra `npm run build`, typecheck o tests como parte del flujo principal. BIEN delegar a `@qa-validador`; @orquestador solo inspecciona resultados. EJEMPLO @orquestador ejecuta `npm test` y reporta "pasa" -> P2; debe pedir a @qa-validador el gate tecnico. **Excepcion (Fase 4 de coordinar-sesiones-multi-ia):** la re-verificacion anti-D3 con datos primarios (correr los gates que la especialista declaro haber corrido) es ejecucion directa PERMITIDA; la invasion es usarla como unico gate o encargarle trabajo nuevo de especialista.
- **Creacion o edicion de skills/agentes:** MAL que @orquestador toque skills, prompts de agentes o `agent-prompts.json`. BIEN derivar a `@crear-agentes` (agentes) o aplicar `crear-skills`/`endurecer-skills` via @documentador. EJEMPLO @orquestador anade una seccion a una skill -> P1; era de @crear-agentes.
- **Operaciones sensibles sin delegar:** MAL que @orquestador fuerce push, borre ramas, ejecute migraciones destructivas o resetee estado. BIEN derivar a `@experto-github` (publicacion) o al agente del dominio con `ejecutar-operaciones-sensibles`. EJEMPLO @orquestador corre `git push --force` -> P1 critico.
- **Degradacion progresiva silenciosa:** MAL que la sesion empiece delegando bien y termine ejecutando todo por inercia o cansancio conversacional. BIEN reportar el patron temporal (empezo delegando, termino ejecutando) como hallazgo estructural, no como suma de P3. EJEMPLO los primeros 3 turnos delegan, los ultimos 5 ejecutan -> P2 por patron, aunque cada accion aislada pareciera menor.

# Alcance y limites
- Aplica a sesiones donde @orquestador coordino multiples agentes o tareas.
- Detecta invasiones comparando cada accion contra el contrato de @orquestador (delegar, consolidar, no ejecutar trabajo especialista).
- No sustituye a `auditar-cumplimiento` (agente) que audita agentes ejecutores contra sus briefs; esta skill audita al orquestador.
- No corrige codigo ni reescribe briefs; solo emite un diagnostico de orquestacion accionable.

# Inputs / contexto obligatorio
- Historial de la sesion (conversacion o log de acciones).
- Contrato de @orquestador en `scripts/agent-prompts.json` (bloque de enrutamiento y frontera de ejecucion).
- Mapa de agentes disponibles y sus fronteras (`@implementador`, `@ingeniero-backend`, `@qa-validador`, `@revisor`, `@crear-agentes`, `@documentador`, `@experto-github`, `@especialista-seguridad`).
- Si aplica, el TEAM activo que documento la sesion para contrastar delegacion declarada vs real.

# Comportamiento esperado

## Fase 1 - Reconstruir y clasificar la sesion
1. Listar las acciones relevantes ejecutadas durante la sesion (escrituras, ediciones, builds, commits, creacion de piezas).
2. Clasificar cada accion en una de tres categorias:
   - **Delegacion correcta**: @orquestador briefo y consolido, el especialista ejecuto.
   - **Ejecucion directa permitida**: inspeccion (`git status`, `ls`, `cat`, `rg`), coordinacion, lectura de TEAM/.questions, comandos de sistema no destructivos.
   - ** Invasion**: accion especialista ejecutada por @orquestador (ver anti-patrones).

## Fase 2 - Clasificar severidad
- `P1`: invasion que pudo causar error, inconsistencia o ruptura de contrato (escribir codigo incorrecto, ejecutar operacion sensible, crear skill sin gate).
- `P2`: invasion que funciono pero rompe el contrato de orquestacion (deberia haber delegado).
- `P3`: accion limite que podria justificarse como inspeccion/validacion; reportar solo si forma patron.

## Fase 3 - Emitir diagnostico
Formato de salida:
1. **Acciones correctas**: delegaciones bien ejecutadas (breve).
2. **Invasiones detectadas**: por severidad, con accion concreta, evidencia y agente responsable correcto.
3. **Patron general**: si hubo degradacion progresiva (cronologia de la sesion).
4. **Recomendacion**: cambio concreto para la proxima sesion (que briefar, a quien derivar, donde frenar).

# Cierre OBLIGATORIO: gate de auto-cita

Antes de declarar la auditoria lista, declarar (auto-cita con evidencia, no auto-evaluacion). Maximo 7 items:

- [ ] **Declaro** que reconstrui las acciones de la sesion desde evidencia observable (log/conversacion/TEAM), no desde memoria.
- [ ] **Declaro** que cada invasion cita la accion concreta, el agente responsable correcto y la severidad, separando ejecucion directa permitida de invasion real.
- [ ] **Declaro** que evite cada anti-patron listado arriba (escritura directa, edicion en caliente, build por orquestador, skills/agentes, operaciones sensibles, degradacion progresiva), citando cual aplicaba a esta sesion.
- [ ] **Declaro** que distingui P1/P2/P3 con criterio observable y senale el patron temporal si lo hubo.
- [ ] **Declaro** que NO corregi codigo ni reescribi briefs; el diagnostico deja la correccion en manos del agente responsable.
- [ ] **Declaro** el resultado del gate de segunda IA (ver abajo).

## Gate de segunda IA (OBLIGATORIO, no sugerencia)

El agente que audita orquestacion no es el que califica el cumplimiento final. Antes de cerrar:

- Si la auditoria **detecta invasiones P1 multiples o un patron de degradacion progresiva** -> delegar OBLIGATORIAMENTE a **@auditor-cumplimiento** para que valide el diagnostico contra los briefs reales de los agentes implicados.
- Si la auditoria **revela que una invasion causo un defecto material** (codigo roto, contrato roto, dato corrupto) -> derivar OBLIGATORIAMENTE a **@revisor** para revision de riesgo antes de entregar el diagnostico.
- Si la auditoria es **lectura puntual sin invasiones materiales** -> sin segunda IA obligatoria (no burocracia innecesaria).

# Flujo recomendado
- [ ] Reconstruir el objetivo de la sesion y el mapa de agentes disponibles.
- [ ] Listar acciones relevantes ejecutadas por @orquestador con evidencia.
- [ ] Clasificar cada accion como delegacion correcta, ejecucion directa permitida o invasion.
- [ ] Comparar invasiones contra el anti-patron correspondiente y el agente responsable.
- [ ] Clasificar severidad y explicar impacto observable, senalando el patron temporal si lo hubo.
- [ ] Resolver el gate de auto-cita y el gate de segunda IA.
- [ ] Emitir recomendaciones concretas para corregir el patron en sesiones futuras.

# Criterio de resultado bueno

Cierre valido cuando el gate de auto-cita de arriba se cumple con evidencia observable y el gate de segunda IA esta resuelto segun la tipificacion. Esta seccion no anade reglas: es el mirror declarativo del gate, repetido aqui solo porque `validate-hub-skills.ps1` exige el header.

## Triggers
- Keywords: auditar orquestacion, orquestador delego, verificacion delegacion, disciplina orquestador, sesion larga, invasion responsabilidad, orquestador ejecuto directo.
- Patrones de usuario: "delegaste bien?", "audita la orquestacion", "@orquestador se paso de frenada", "revisa si @orquestador hizo su trabajo", "el orquestador empezo a hacer cosas directamente".
- Encadenamiento: despues de sesiones largas de trabajo multiagente; antes de `configurar-github` cuando la sesion vaya a publicarse; hermana de `auditar-cumplimiento` (audita agentes ejecutores) y `mantener-cerebro-operativo` (verifica que esta skill existe y esta integrada).

# Ejemplos de activacion
- "Audita si @orquestador delego correctamente durante esta sesion."
- "@orquestador empezo haciendo cosas directamente, revisa que se salto."
- "Antes de publicar, verifica que la orquestacion fue correcta."
