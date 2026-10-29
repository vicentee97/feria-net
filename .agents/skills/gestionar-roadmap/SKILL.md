---
name: gestionar-roadmap
description: "Usar cuando el roadmap (docs/TODO.md) necesite definir, limpiar, priorizar, partir o cerrar tareas, o realinearse con el estado real del proyecto. TRIGGERS: roadmap, TODO, tareas, pendientes, priorizar, planificar, gestionar tareas, limpiar TODO."
---

# Gestionar Roadmap

# Objetivo

Mantener un roadmap vivo, accionable y bien documentado en `docs/TODO.md`, evitando listas sueltas, épicas disfrazadas de tarea y drift entre documentacion, trabajo real y estado del proyecto.

La skill actua por defecto en modo **revisar y corregir**: si el arreglo es claro y reversible, lo aplica; si no, documenta la ambiguedad y la escala correctamente.

La accion dominante es **reflejar el trabajo real del proyecto, no producir una version mas bonita del roadmap**.

# Anti-patrones y su correccion

Cada sesgo fuerte del entrenamiento base necesita su par MAL -> BIEN -> EJEMPLO.

- **Titulos genericos:** MAL `mejorar proyecto` o `refactorizar backend`. BIEN reescribir como resultado verificable con ID estable y descripcion accionable. EJEMPLO `mejorar proyecto` -> `PRJ-014 - Unificar manejo de errores en API de pedidos. Cierre: todos los endpoints devuelven formato {ok,error}`.
- **Epicas disfrazadas de tarea:** MAL una sola casilla que junta `auth + billing + dashboard`. BIEN partir en unidades cerrables independientes. EJEMPLO `PRJ-002 Auth+billing+panel` -> tres items `PRJ-002a`, `PRJ-002b`, `PRJ-002c` cada uno con su cierre.
- **Intencion sin resultado:** MAL `investigar X` o `valorar mejorar el cache`. BIEN un item que describe una decision o entrega, no una sensacion. EJEMPLO `valorar mejorar cache` -> `PRJ-007 - Decidir entre Redis en memoria y cache HTTP. Cierre: ADR-007`.
- **Estados obsoletos:** MAL items en `Siguientes` que ya estan hechos, o en `En Curso` sin trabajo activo. BIEN mover a la seccion que refleje el estado real contrastando diff, `.teams/` y documentacion. EJEMPLO item ya mergeado pasa a `Cerrados` con `(vX.XX.XX - YYYY-MM-DD)`.
- **Siguientes lleno de deseos:** MAL ideas inmaduras o dependientes de una decision de producto compitiendo con trabajo real. BIEN mover a `Aparcados` o registrar la duda en `.questions/`. EJEMPLO "idea: app movil nativa" sin definicion de producto -> `Aparcados`, no `Siguientes`.
- **Limpieza creativa:** MAL reescribir, partir, renombrar o reordenar items cuando no hay un problema material de claridad, estado, duplicidad, tamano, trazabilidad o accionabilidad. BIEN tocar solo lo que resuelve un problema real del roadmap. EJEMPLO no renombrar IDs estables solo por estetica; cada ID roto rompe trazabilidad en `.teams/`, commits y PRs.

# Alcance y limites

- Define, crea, sanea y mantiene `docs/TODO.md` como roadmap operativo canonico.
- Reescribe items vagos, parte items demasiado grandes y recoloca estados cuando el cambio sea claro y reversible.
- Puede crear un roadmap minimo si falta `docs/TODO.md` pero el proyecto ya tiene suficiente definicion funcional.
- Revisa el roadmap al inicio y al cierre de una tarea cuando el trabajo toque estructura, alcance o pendientes visibles.
- Deja rastro en `.teams/` y, cuando haga falta, en `.questions/`.
- No sustituye a `definir-producto` (si falta producto o el alcance es humo, escala hacia ahi), ni a `configurar-github` (no publica ni decide tags). No inventa prioridades o cierres sin evidencia del proyecto.

# Inputs / contexto obligatorio

- [SSOT del repositorio](../docs/SSOT.md).
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- [Skill transversal de documentacion](../documentar-con-criterio/SKILL.md).
- `docs/TODO.md`, si existe.
- `docs/SSOT.md` del proyecto real.
- `.teams/` y `.questions/` recientes.
- Documentacion funcional o de producto disponible (`docs/product-map.md`, PRD, README o equivalente), si existe.
- Referencia de formato y heuristicas: [references/formato-roadmap.md](./references/formato-roadmap.md).

# Comportamiento esperado

La skill inspecciona primero el estado real del proyecto y del roadmap antes de tocar nada.

## Contrato base
1. Tratar `docs/TODO.md` como roadmap operativo vivo y unico documento canonico de seguimiento.
2. Corregir directamente formato, granularidad, estados, duplicados y cierres cuando la solucion sea clara.
3. No dejar items que dependan de memoria conversacional para entenderse.
4. No permitir listas de deseos sin criterio de cierre ni epicas enormes escondidas como una sola casilla.

## Estructura canonica de `docs/TODO.md`
Secciones, en este orden: `## En Curso`, `## Siguientes`, `## Bloqueados`, `## Cerrados`, `## Aparcados`. Cada item lleva siempre ID estable, estado implicito por seccion y descripcion concreta y accionable.

Formato base:

```md
- [ ] PRJ-001 - Descripcion concreta y accionable.
```

Opcionales cuando aportan claridad real: `Cierre:`, `Depende de:`, `Notas:`, `Version:`. En `Cerrados`, el cierre versionado acepta:

```md
- [x] PRJ-001 - Descripcion concreta y accionable. (vX.XX.XX - YYYY-MM-DD)
```

## Reglas de saneado
- Reescribir items vagos como resultados verificables.
- Partir items demasiado grandes en varias unidades cerrables.
- Fusionar duplicados o solapamientos claros.
- Mover items a la seccion que refleje el estado real; crear items faltantes si el trabajo revela un hueco estructural claro.
- Si un item queda bloqueado por una decision real, moverlo a `Bloqueados`. Si una idea es legitima pero no debe competir ahora, moverla a `Aparcados`.
- Aplicar `documentar-con-criterio` para que el roadmap siga siendo operativo y no absorba contexto o historia de otros sitios.
- Si el problema no es mecanico sino de producto, frenar y derivar a `definir-producto` en lugar de fabricar un roadmap sobre ambiguedad funcional.

## Roadmap frente a backlog de ideas
`docs/TODO.md` es una lista de trabajo operativo, no un cajon de deseos: `En Curso` solo trabajo activo de verdad; `Siguientes` trabajo plausible, accionable y suficientemente definido para empezarse sin una conversacion larga de producto; `Bloqueados` trabajo valido detenido por una dependencia o decision concreta; `Aparcados` ideas legitimas, mejoras futuras o lineas inmaduras. Las dudas reales que impiden convertir una idea en tarea accionable van a `.questions/`. Una idea interesante sin criterio de cierre claro no entra en `Siguientes`; va a `Aparcados` o a `.questions/`.

## Proactividad obligatoria
La skill revisa el roadmap al empezar una tarea que toque alcance, pendientes o estructura; al cerrar una tarea que deje trabajo terminado, residual o bloqueado; cuando el usuario pida priorizar, limpiar, revisar o preparar trabajo; y cuando otra skill necesite un roadmap fiable para continuar.

## Relacion con otras skills
`definir-producto` define vision, capacidades y modulos; `gestionar-roadmap` traduce eso a trabajo mantenible y lo mantiene vivo; `definir-reglas-proyecto` fija donde vive el roadmap y sus reglas canonicas; `configurar-github` consume el roadmap al publicar y anade version cuando el cierre es inequivoco; `mantener-cerebro-operativo` puede apoyarse en esta skill para sanear `docs/TODO.md`, pero no la sustituye.

# Cierre OBLIGATORIO: gate de auto-cita

Antes de declarar el roadmap saneado o actualizado como listo, declarar (auto-cita con evidencia, no auto-evaluacion). Maximo 7 items:

- [ ] **Declaro** que inspeccione el estado real del proyecto (diff, `.teams/`, `.questions/`, documentacion) antes de tocar el roadmap, no solo memoria conversacional.
- [ ] **Declaro** que cada item reescrito o creado describe un resultado verificable con ID estable, o deje la ambiguedad en `.questions/`.
- [ ] **Declaro** que evite cada anti-patron de arriba (titulos genericos, epicas disfrazadas, intencion sin resultado, estados obsoletos, deseos en Siguientes, limpieza creativa), citando cual aplicaba a este caso concreto.
- [ ] **Declaro** que mantuve la estructura canonica de secciones y el formato base, y que respeta IDs estables para no romper trazabilidad.
- [ ] **Declaro** que no parti, renombre ni reordene items sin un problema material de claridad, estado, duplicidad, tamano, trazabilidad o accionabilidad.
- [ ] **Declaro** que registre en `.teams/` los cambios relevantes de estructura, prioridad o hipotesis adoptada.
- [ ] **Declaro** el resultado del gate de segunda IA (ver abajo).

## Gate de segunda IA (OBLIGATORIO, no sugerencia)

El agente que sanea el roadmap no es el que califica el impacto de los cambios:

- Si la revision **reordena prioridades materialmente, cierra items versionados o cambia la estructura del roadmap** -> delegar OBLIGATORIAMENTE a **@revisor** para revision de riesgo (consistencia con `.teams/`, diff y documentacion) antes de cerrar.
- Si el saneado revela un **hueco de producto o ambiguedad funcional estructural** -> escalar a `definir-producto`, no fabricar roadmap sobre humo.
- Si la revision es **mecanica y reversible** (formato, duplicados obvios, estados claros) -> sin segunda IA obligatoria.

# Flujo recomendado

- [ ] Leer `docs/SSOT.md`, `docs/TODO.md`, `.teams/` y `.questions/`.
- [ ] Confirmar si el proyecto tiene suficiente definicion funcional para sostener un roadmap util.
- [ ] Si falta `docs/TODO.md`, crearlo con la estructura canonica minima sin inventar producto.
- [ ] Detectar items vagos, enormes, duplicados, huerfanos o mal ubicados.
- [ ] Reescribir, partir, fusionar o recolocar lo que sea claro y reversible.
- [ ] Dejar bloqueos reales en `Bloqueados` y registrar dudas genuinas en `.questions/`.
- [ ] Revisar otra vez el roadmap al cierre del trabajo y actualizar estados, restos y cierres.
- [ ] Resolver el gate de auto-cita y el gate de segunda IA; registrar en `.teams/` lo que aplique.

# Criterio de resultado bueno

Cierre valido cuando el gate de auto-cita de arriba se cumple con evidencia observable y el gate de segunda IA esta resuelto segun la tipificacion. Esta seccion no anade reglas: es el mirror declarativo del gate, repetido aqui solo porque `validate-hub-skills.ps1` exige el header. La senal observable es que `docs/TODO.md` se entiende sin memoria conversacional, cada item describe un resultado verificable, refleja el estado real del proyecto y otras skills pueden apoyarse en el sin reinterpretarlo.

## Triggers
- Keywords: roadmap, TODO, tareas, pendientes, priorizar, planificar, gestionar tareas, limpiar TODO
- Patrones de usuario: "limpia el roadmap", "revisa el TODO", "parte estas tareas", "prioriza el trabajo", "cierra el roadmap"
- Encadenamiento: despues de `definir-producto`, antes de `configurar-github` para enlazar versiones; hermana de `documentar-con-criterio` (densidad del roadmap) y `definir-reglas-proyecto` (donde vive el roadmap).

# Ejemplos de activacion
- "Limpia este roadmap y dejalo accionable."
- "Revisa `docs/TODO.md` antes de empezar."
- "Parte estas tareas grandes y priorizalas bien."
- "Cierra el roadmap despues de este cambio."
