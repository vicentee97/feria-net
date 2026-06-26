---
name: auditar-orquestacion
description: "Verifica si el orquestador delego correctamente o invadio responsabilidades de otros agentes durante una sesion. TRIGGERS: auditar orquestacion, orquestador delego, verificacion delegacion, disciplina orquestador, sesion larga."
---

# Objetivo
Verificar si el orquestador mantuvo su contrato de delegacion durante una sesion de trabajo, detectando invasiones de responsabilidades y proponiendo correcciones.

# Alcance y limites
- Aplica a sesiones de trabajo donde el orquestador coordino multiples agentes o tareas.
- Detecta cuando el orquestador ejecuto directamente acciones que deberia haber delegado.
- No sustituye a `auditor-cumplimiento` que audita agentes ejecutores contra sus briefs.
- No corrige codigo; solo emite un diagnostico de orquestacion.

# Inputs / contexto obligatorio
- Historial de la sesion de trabajo (conversacion o log).
- Mapa de agentes disponibles.
- Contrato del orquestador en `agent-prompts.json`.

# Comportamiento esperado

## Fase 1: Reconstruir la sesion
1. Identificar todas las acciones ejecutadas durante la sesion.
2. Clasificar cada accion como: delegacion correcta, ejecucion directa permitida (inspeccion/git/validacion), o invasion.

## Fase 2: Detectar invasiones
Buscar especificamente estos patrones de invasion:
- El orquestador uso `Set-Content`, `Out-File`, `Add-Content`, `echo >`, `cat >` o equivalentes para escribir archivos fuente.
- El orquestador edito codigo fuente directamente en vez de delegar a `@implementador`.
- El orquestador ejecuto `npm install`, `npm run build` u otros comandos de build que pertenecen a `@qa-validador`.
- El orquestador creo o modifico skills sin delegar a `@crear-agentes`.
- El orquestador actualizo documentacion sin delegar a `@documentador`.
- El orquestador ejecuto operaciones sensibles sin delegar al agente correspondiente.

## Fase 3: Clasificar severidad
- `P1`: Invasion que podria haber causado un error o inconsistencia (escribir codigo incorrectamente, romper un contrato).
- `P2`: Invasion que funciono pero rompe el contrato de orquestacion (deberia haber delegado).
- `P3`: Accion limite que podria justificarse como inspeccion/validacion.

## Fase 4: Emitir diagnostico
Formato de salida:
1. **Acciones correctas**: lista de delegaciones bien ejecutadas.
2. **Invasiones detectadas**: lista por severidad con accion concreta y agente que deberia haberla ejecutado.
3. **Patron general**: si hubo un patron de degradacion progresiva (empezo delegando, termino ejecutando).
4. **Recomendacion**: que cambiar para la proxima sesion.

# Checklist de auditoria
- [ ] Todas las escrituras de archivos fueron delegadas?
- [ ] Todas las ediciones de codigo fueron delegadas?
- [ ] Los builds y validaciones fueron delegados a @qa-validador?
- [ ] La creacion de skills/agentes fue delegada a @crear-agentes?
- [ ] La documentacion fue delegada a @documentador?
- [ ] Las operaciones sensibles fueron delegadas al agente correspondiente?
- [ ] El orquestador mantuvo su rol de coordinador durante toda la sesion?
- [ ] Hubo degradacion progresiva de delegacion en conversaciones largas?

## Flujo recomendado
- [ ] Reconstruir el objetivo de la sesion y el mapa de agentes disponibles.
- [ ] Listar acciones relevantes ejecutadas por el orquestador.
- [ ] Clasificar cada accion como delegacion correcta, ejecucion directa permitida o invasion.
- [ ] Comparar invasiones contra el agente o skill responsable.
- [ ] Clasificar severidad y explicar impacto observable.
- [ ] Emitir recomendaciones concretas para corregir el patron en sesiones futuras.

## Criterio de resultado bueno
- La auditoria se basa en acciones observables, no en preferencias abstractas.
- Distingue inspeccion permitida, coordinacion legitima e invasion real de responsabilidades.
- Senala el agente responsable correcto sin reescribir el trabajo por su cuenta.
- El resultado deja una correccion operativa clara para @orquestador.

# Triggers
- Keywords: auditar orquestacion, orquestador delego, verificacion delegacion, disciplina orquestador, sesion larga
- Patrones de usuario: "delegaste bien?", "audita la orquestacion", "el orquestador se paso de frenada", "revisa si el orquestador hizo su trabajo"
- Encadenamiento: despues de sesiones largas de trabajo multiagente, antes de publicar

# Ejemplos de activacion
"Audita si el orquestador delego correctamente durante esta sesion."
"El orquestador empezo haciendo cosas directamente, revisa que se salto."
"Antes de publicar, verifica que la orquestacion fue correcta."
