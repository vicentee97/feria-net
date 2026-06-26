---
name: gestionar-roadmap
description: "Mantiene docs/TODO.md como roadmap operativo vivo: definir, limpiar, priorizar, partir, cerrar y realinear tareas con el estado real del proyecto. TRIGGERS: roadmap, TODO, tareas, pendientes, priorizar, planificar, gestionar tareas, limpiar TODO."
---

# Objetivo
Mantener un roadmap vivo, accionable y bien documentado en `docs/TODO.md`, evitando listas sueltas, épicas disfrazadas de tarea y drift entre documentación, trabajo real y estado del proyecto.

La skill debe actuar por defecto en modo **revisar y corregir**: si el arreglo es claro y reversible, lo aplica; si no, documenta la ambigüedad y la escala correctamente.

# Alcance y límites
- Sí define, crea, sanea y mantiene `docs/TODO.md` como roadmap operativo canónico.
- Sí reescribe ítems vagos, parte ítems demasiado grandes y recoloca estados cuando el cambio sea claro.
- Sí puede crear un roadmap mínimo si falta `docs/TODO.md` pero el proyecto ya tiene suficiente definición funcional.
- Sí debe revisar el roadmap al inicio y al cierre de una tarea cuando el trabajo toque estructura, alcance o pendientes visibles.
- Sí debe dejar rastro en `.teams/` y, cuando haga falta, en `.questions/`.
- No sustituye a `definir-producto`; si falta producto o el alcance es humo, debe escalar hacia esa skill.
- No sustituye a `configurar-github`; no publica ni decide tags, solo deja preparado el roadmap para que otra skill lo consuma.
- No inventa prioridades o cierres si la evidencia del proyecto no las sostiene.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- [Skill transversal de documentación](../documentar-con-criterio/SKILL.md).
- `docs/TODO.md`, si existe.
- `docs/SSOT.md` del proyecto real.
- `.teams/` y `.questions/` recientes.
- Documentación funcional o de producto disponible (`docs/product-map.md`, PRD, README o equivalente), si existe.
- Referencia de formato y heurísticas: [references/formato-roadmap.md](./references/formato-roadmap.md).

# Comportamiento esperado
La skill debe inspeccionar primero el estado real del proyecto y del roadmap antes de tocar nada.

## Contrato base
1. Tratar `docs/TODO.md` como roadmap operativo vivo y único documento canónico de seguimiento.
2. Corregir directamente formato, granularidad, estados, duplicados y cierres cuando la solución sea clara.
3. No dejar ítems que dependan de memoria conversacional para entenderse.
4. No permitir listas de deseos sin criterio de cierre.
5. No permitir épicas enormes escondidas como una sola casilla.

## Estructura canónica de `docs/TODO.md`
La skill debe mantener estas secciones, en este orden:
1. `## En Curso`
2. `## Siguientes`
3. `## Bloqueados`
4. `## Cerrados`
5. `## Aparcados`

Cada ítem debe llevar siempre:
- ID estable;
- estado implícito por sección;
- descripción concreta y accionable.

Formato base:

```md
- [ ] PRJ-001 - Descripción concreta y accionable.
```

Opcionales, cuando aportan claridad real:
- `Cierre:`
- `Depende de:`
- `Notas:`
- `Versión:`

En `Cerrados`, el cierre versionado debe aceptar:

```md
- [x] PRJ-001 - Descripción concreta y accionable. (vX.XX.XX - YYYY-MM-DD)
```

## Reglas de saneado
- Reescribir ítems vagos para convertirlos en resultados verificables.
- Partir ítems demasiado grandes en varias unidades cerrables.
- Fusionar duplicados o solapamientos claros.
- Mover ítems a la sección que refleje el estado real.
- Crear ítems faltantes si el trabajo realizado o detectado revela un hueco estructural claro.
- Si un ítem queda bloqueado por una decisión real, moverlo a `Bloqueados`.
- Si una idea es legítima pero no debe competir ahora mismo, moverla a `Aparcados`.
- No reordenar, renombrar, partir o reescribir items si no existe un problema material de claridad, estado, duplicidad, tamano, trazabilidad o accionabilidad.
- No convertir una revision del roadmap en una limpieza creativa: el objetivo es reflejar mejor el trabajo real, no producir una version mas bonita sin necesidad.

## Guardarraíles
La skill debe detectar y corregir, como mínimo:
- títulos genéricos tipo `mejorar proyecto`;
- tareas con varios entregables grandes unidos por `y`;
- ítems que describen intención pero no resultado;
- estados obsoletos respecto al diff, la documentación o `.teams/`;
- TODOs que mezclan roadmap, notas personales y basura historica en la misma seccion;
- `Siguientes` lleno de deseos vagos, ideas inmaduras o tareas que todavia dependen de una decision de producto.

Debe aplicar `documentar-con-criterio` para que el roadmap siga siendo un documento operativo y no acabe absorbiendo contexto, historia o explicación que pertenece a otros sitios.

Si el problema no es mecánico sino de producto, la skill debe frenar y derivar a `definir-producto` en lugar de fabricar un roadmap sobre ambigüedad funcional.


## Roadmap frente a backlog de ideas
`docs/TODO.md` debe ser una lista de trabajo operativo, no un cajon de deseos.

- `En Curso`: solo trabajo activo de verdad.
- `Siguientes`: trabajo plausible, accionable y suficientemente definido para poder empezarse sin una conversacion larga de producto.
- `Bloqueados`: trabajo valido pero detenido por una dependencia o decision concreta.
- `Aparcados`: ideas legitimas, mejoras futuras o lineas inmaduras que no deben competir con el trabajo proximo.
- `.questions/`: dudas reales que impiden convertir una idea en tarea accionable.

Si una idea es interesante pero aun no tiene criterio de cierre claro, no debe entrar en `Siguientes`; debe ir a `Aparcados` o a `.questions/` segun corresponda.

## Proactividad obligatoria
La skill debe revisar el roadmap:
- al empezar una tarea que toque alcance, pendientes o estructura;
- al cerrar una tarea que deje trabajo terminado, residual o bloqueado;
- cuando el usuario pida priorizar, limpiar, revisar o preparar trabajo;
- cuando otra skill necesite un roadmap fiable para continuar.

## Relación con otras skills
- `definir-producto` define visión, capacidades y módulos.
- `gestionar-roadmap` traduce eso a trabajo mantenible y lo mantiene vivo.
- `definir-reglas-proyecto` fija dónde vive el roadmap y sus reglas canónicas de proyecto.
- `configurar-github` consume el roadmap al publicar y añade versión cuando el cierre es inequívoco.
- `mantener-cerebro-operativo` puede apoyarse en esta skill para sanear `docs/TODO.md`, pero no la sustituye.

# Flujo recomendado
- [ ] Leer `docs/SSOT.md`, `docs/TODO.md`, `.teams/` y `.questions/`.
- [ ] Confirmar si el proyecto tiene suficiente definición funcional para sostener un roadmap útil.
- [ ] Si falta `docs/TODO.md`, crearlo con la estructura canónica mínima sin inventar producto.
- [ ] Detectar ítems vagos, enormes, duplicados, huérfanos o mal ubicados.
- [ ] Reescribir, partir, fusionar o recolocar lo que sea claro y reversible.
- [ ] Dejar bloqueos reales en `Bloqueados` y registrar dudas genuinas en `.questions/`.
- [ ] Revisar otra vez el roadmap al cierre del trabajo y actualizar estados, restos y cierres.
- [ ] Registrar en `.teams/` cualquier cambio relevante de estructura, prioridad o hipótesis adoptada.

# Criterio de resultado bueno
La skill está bien aplicada si:
- `docs/TODO.md` queda entendible sin contexto conversacional;
- cada ítem describe un resultado verificable;
- el roadmap refleja el estado real del proyecto;
- no quedan épicas encubiertas ni ruido documental innecesario;
- los casos ambiguos quedan documentados en `.questions/` o escalados a `definir-producto`;
- y otras skills pueden apoyarse en el roadmap sin reinterpretarlo desde cero.

## Triggers
- Keywords: roadmap, TODO, tareas, pendientes, priorizar, planificar, gestionar tareas, limpiar TODO
- Patrones de usuario: "limpia el roadmap", "revisa el TODO", "parte estas tareas", "prioriza el trabajo", "cierra el roadmap"
- Encadenamiento: despues de `definir-producto`, antes de `configurar-github` para enlazar versiones

# Ejemplos de activación
"Limpia este roadmap y déjalo accionable."

"Revisa `docs/TODO.md` antes de empezar."

"Parte estas tareas grandes y priorízalas bien."

"Cierra el roadmap después de este cambio."
