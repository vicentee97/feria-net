---
name: refinar-en-bucle
description: "Procedimiento multiagente generico para refinar un objetivo complejo hasta convergencia y verificarlo globalmente antes de ejecutarlo: objetivo congelado, contrato de evidencia, panel rotativo, ojos frescos, gate independiente, reparacion dirigida y bloques con cross-check. TRIGGERS: ejecuta el loop, refinar en bucle, plan review fix, ojos frescos, converger con agentes, loop largo, verificacion global, plan perfecto."
---

# Refinar En Bucle

# Frontera y hard rules (leer primero)

Esta skill es un procedimiento de `@orquestador`, no un agente. El detalle normativo vive en el [ADR #9](../docs/ARCHITECTURE_DECISIONS.md) y el estado en la [plantilla del loop](../docs/brief-templates/loop-plan-template.md).

- NEVER crear un agente nuevo para el loop. `@orquestador` coordina y es read-only: el escribano `@documentador` crea la cabecera y cada agente escribe su propia sección.
- MUST mantener solo tres entradas humanas: Fase 0 (objetivo), Fase 2 (intención/coste) y Fase 6 (aceptación del resultado). Los gates técnicos y semánticos son trabajo interno.
- MUST distinguir estados: **convergencia = estabilidad del artefacto; verificación global = permiso para ejecutar**. NEVER declarar `listo para ejecutar` por alcanzar la racha de convergencia.
- MUST crear en Fase 0 un **contrato de evidencia** para afirmaciones materiales: `claim`, tipo (`hecho | decisión humana | hipótesis`), etapa (`pre-ejecución | bloque | post-ejecución`), fuente/oráculo, estado y dependencias. No se inventaría cada frase; solo lo que pueda cambiar alcance, orden, comportamiento, datos, seguridad o aceptación.
- MUST reservar desde Fase 1 un **verificador global fresco** que no haya participado en pasadas ni gates. Registrar ID de instancia/task, no solo rol, junto a los IDs de todos los participantes y el manifiesto exacto del contexto ciego. Si el runtime no expone identidad/contexto comprobables, la verificación queda pendiente.
- Al converger, MUST materializar un snapshot normativo completo e inmutable: objetivo, criterios, ledger y TODO el cuerpo final, con inventario de secciones y SHA-256. El verificador recibe el snapshot entero; la ceguera excluye solo rondas/historial, nunca contenido auditable. Si requiere chunks, el manifiesto prueba cobertura exhaustiva.
- MUST el verificador contrastar cada claim material con fuente primaria y la cadena causal necesaria (`origen -> transformaciones/filtros -> consumidor/efecto`). Un archivo aislado o el reporte de otro agente no prueban un claim.
- Si no existe instancia fresca/ausente o falta un oráculo material, el cierre es `convergido con verificación pendiente`; NEVER se degrada silenciosamente a `listo`.
- MUST gate global finito: `verificación superada | verificación fallida | verificación pendiente`. Solo `superada` habilita Fase 5.
- MUST ante fallo reabrir el claim refutado y sus dependencias, no todo el objetivo. Máximo dos ciclos `reparación -> re-verificación dirigida`; después escalar al humano. Volver a Fase 0 solo si cambia el objetivo o el fallo es sistémico.
- MUST reclasificar como P2 cualquier error factual o hipótesis que cambie ejecución, aunque una ronda anterior lo llamara P3. La etiqueta heredada no prevalece sobre el impacto.
- MUST unidad única: 1 ronda = 1 pasada + su gate por agente distinto. Registrar `n_roles_o_eyes` y calcular el techo: `normal=max(3,n)`; `largo(N)` usa `max(3,n) < N <= 10`, con aprobación en Fase 2. La convergencia para antes del techo.
- En tareas normales, el autopiloto proporcional puede usar hasta 3 rondas, 4 agentes y 20 minutos sin pedir que el humano elija un modo. Si el objetivo explicito de analisis profundo necesita superar ese presupuesto, formula una sola pregunta sencilla de coste/tiempo y conserva el gate humano de Fase 2.
- Una peticion puntual nunca activa el loop por reflejo: el clasificador puede degradar a pasada simple + review. Un resultado `high` aumenta el rigor; nunca se usa para saltarse el verificador global.
- MUST modos de panel: `roles-distintos | ojos-frescos | mixto`. `ojos-frescos` exige instancias nuevas reales; si el runtime no las ofrece, usar `roles-distintos` o degradar explícitamente a pasada simple + review.
- MUST convergencia: `roles-distintos/mixto` = 2 rondas sin P1/P2 nuevos; `ojos-frescos` = K rondas de doble-`NO`, K=2 por defecto o 3; K>3 exige nueva Fase 2. P3 informativos no reinician, salvo reclasificación material.
- MUST meta-recursión máximo 1. Su crítico y gate son agentes ausentes del nivel 0; `@auditor-cumplimiento` no se autoaudita en el meta-nivel.
- MUST arbitraje: humano > proyecto/SSOT/fuentes primarias > skill normativa > autoridad de dominio > artefacto del loop.
- MUST el estado vivir en `.ai-work/<task-id>/loop/PLAN.md`, aunque el entregable sea código, UI, datos, documentación u otro. No se commitea sin orden explícita.
- NEVER activar el loop para un objetivo puntual. Si no supera el umbral o no hay tres perspectivas reales, declarar `pasada simple + review`.
# Objetivo

Refinar un objetivo complejo hasta que deje de producir hallazgos materiales nuevos, demostrar después que su resultado es correcto con evidencia independiente y, solo entonces, ejecutarlo y validar el resultado observable.

# Alcance y límites

- Aplica a planes, decisiones, código, datos, operaciones, UI, documentación y seguridad cuando el coste de equivocarse justifica varias perspectivas.
- La convergencia descubre y estabiliza; el gate global intenta refutar. Ninguna sustituye a la otra.
- No promete perfección absoluta: produce `verificado con la evidencia definida` y deja explícito lo no verificable.
- Reutiliza `revisar-cambios`, `validar-calidad`, `validar-ui-visual` y `auditar-seguridad`; no duplica sus contratos.
- Coordina Rule 24/25/26 para artefactos, leases, worktrees y consolidación con datos primarios.

# Inputs / contexto obligatorio y contrato de evidencia

- Objetivo textual congelado y no-objetivos.
- [ADR #9](../docs/ARCHITECTURE_DECISIONS.md), [plantilla](../docs/brief-templates/loop-plan-template.md), [reglas globales](../docs/AI_GLOBAL_RULES.md), [SSOT](../docs/SSOT.md) y `comunicar-como-jefe`.
- Proyecto real: código, configuración, tests, datos, documentación, TEAM y preguntas que puedan demostrar o refutar el resultado.
- Perfil o combinación de perfiles:
  - `plan-documentación`: hechos, contradicciones, decisiones y ensayo del primer bloque.
  - `código-datos-operación`: antes, invariantes/contratos/oráculos; por bloque o después, tests, transacciones, concurrencia, rollback y efectos.
  - `UI`: antes, contrato/estados/referencia; después, navegador real, responsive y accesibilidad.
  - `seguridad`: antes, modelo de amenaza y políticas; después, config/policies/tests/runtime. El especialista evalúa; su reporte no es fuente primaria.
  - `otro`: oráculo y evidencia definidos en Fase 0; sin oráculo material no existe estado `verificado`.

Un claim solo queda `verificado` cuando alcanza su etapa. Fase 4B exige verificar claims `pre-ejecución` y demostrar que los de `bloque/post-ejecución` tienen oráculo ejecutable; no finge resultados futuros. Las decisiones humanas se marcan `ratificadas`.

# Comportamiento esperado

## Fase 0 — Objetivo y prueba (HUMANO)

`@orquestador` replica el objetivo textual y clasifica el trabajo. `@documentador` crea el PLAN y un contrato inicial: criterios, no-objetivos, perfiles, claims y oráculos. El contrato se amplía durante las rondas.

## Fase 1 — Panel e independencia

Constituir al menos tres perspectivas genuinas o degradar. Declarar `n`, modo, intensidad, techo calculado y K. Registrar ID de instancia de cada participante. Reservar un verificador fresco/ausente con ID comprobable; no puede actuar como pasador ni gate.

Paneles base: código/estructura (`@arquitecto -> @revisor -> @qa-validador -> @auditor-cumplimiento`), seguridad (`@especialista-seguridad -> @revisor -> @auditor-cumplimiento -> @ingeniero-backend`), documentación (`@documentador -> @revisor -> @auditor-cumplimiento`) y otro (tres autoridades justificadas).

## Fase 2 — Check de intención y coste (HUMANO)

Explicar en lenguaje de producto qué se busca, qué queda fuera, cómo se demostrará, panel, intensidad, coste aproximado y riesgo principal. Si el humano cambia el objetivo, volver a Fase 0.

## Fases 3-4 — Refinamiento y convergencia

Cada pasada registra P1/P2/P3, cambios y claims añadidos/modificados. Un agente distinto emite el gate. La racha solo declara `convergido pendiente de verificación`; nunca readiness. En ojos frescos, un `NO` exige cobertura y doble ratificación.

## Fase 4B — Verificación global independiente

El verificador recibe el snapshot normativo completo con inventario/hash y fuentes; no recibe el PLAN con rondas. Verifica claims pre-ejecución, oráculos futuros, contradicciones, cadena causal, no-objetivos y ejecutabilidad. Después puede leer el historial solo para reconciliar.

- `superada`: claims pre-ejecución verificados/ratificados y claims futuros con oráculo ejecutable; ninguno no-verificable condiciona ejecución.
- `fallida`: existe claim refutado, contradicción material o criterio sin oráculo. Reabrir claim y dependencias; otra instancia no participante re-verifica la reparación.
- `pendiente`: falta independencia, fuente u oráculo. No ejecutar.

Este gate no cuenta como ronda de convergencia ni puede omitirse por early-stop o techo.

## Fase 5 — Ejecución en bloques

Por bloque material: ejecutor implementa y otro agente audita contra **objetivo + decisiones humanas + fuentes/oráculos + criterios de aceptación + PLAN**. El PLAN guía, pero nunca es oráculo único. Ejecuta los oráculos de claims cuya etapa vence y actualiza evidencia/estado; no cierra con claims debidos abiertos. Un bloque trivial puede degradar explícitamente a implementación simple + validación proporcional. Máximo dos reparaciones antes de escalar.

## Fase 6 — Aceptación del resultado (HUMANO)

Presentar resultado y evidencia en lenguaje llano. Antes, ejecutar oráculos post-ejecución y cerrar sus claims; `verificado y ejecutado` exige cero claims materiales vencidos pendientes/refutados/no-verificables. El humano decide producto, no ejecuta gates técnicos. Cambio de objetivo vuelve a Fase 0; defecto local reabre bloque/claim.

# Anti-patrones y corrección

- **Consenso tratado como verdad:** MAL “2/2, listo”; BIEN “2/2, estable; falta gate global”; ejemplo: dos agentes repiten un supuesto tenant sin recorrer filtros globales.
- **Cross-check circular:** MAL validar solo contra PLAN; BIEN usar objetivo+fuentes+oráculos+aceptación+PLAN; ejemplo: una implementación fiel no salva una fórmula falsa.
- **Auditor contaminado:** MAL reciclar un gate del panel; BIEN reservar instancia ausente con brief ciego; ejemplo: lee historial solo tras emitir su dictamen inicial.
- **Ledger burocrático:** MAL catalogar cada frase; BIEN registrar claims que cambian decisiones; ejemplo: la existencia de una ruta es material, el color de un encabezado no.
- **Validación textual confundida con verdad:** MAL creer que un test de plantilla prueba semántica; BIEN el test garantiza estructura y la segunda IA demuestra claims con fuentes.
- **Reinicio total por defecto:** MAL volver a Fase 0 por un fallo local; BIEN invalidar claim y dependencias; ejemplo: corregir aislamiento tenant sin rediseñar toda la UI.

# Flujo recomendado

1. Congelar objetivo, perfiles y contrato de evidencia.
2. Constituir panel y reservar verificador global.
3. Aprobar intención/coste.
4. Refinar hasta convergencia.
5. Ejecutar gate global; reparar de forma dirigida si falla.
6. Ejecutar bloques con cross-check no circular.
7. Validar resultado y promover memoria esencial a TEAM; retener PLAN como `evidence`.

# Criterio de resultado bueno (gate de cierre, auto-cita)

Antes de declarar el loop listo:

- [ ] Declaro objetivo, perfiles, claims materiales y oráculos con evidencia en el PLAN.
- [ ] Declaro modo, intensidad, rondas y gates; el loop no cerró en una ronda ni inventó modalidades.
- [ ] Declaro que la convergencia quedó `pendiente de verificación`, no se presentó como readiness.
- [ ] Declaro IDs, snapshot normativo completo, inventario/hash y exclusión exclusiva del historial; rol o autoafirmación solos no acreditaron independencia.
- [ ] Declaro el veredicto global y la evidencia primaria/cadena causal de cada claim material; ningún supuesto condicionante quedó pendiente.
- [ ] Declaro que cada bloque/post-cierre ejecutó sus oráculos y actualizó claims vencidos; ninguno material pendiente/refutado quedó bajo estado final verde.
- [ ] Declaro higiene, coordinación, reparaciones dirigidas y riesgo residual; si faltó independencia/oráculo, el estado final no es `listo`.

# Skills y agentes invocados

`@orquestador` coordina; `@documentador` mantiene el artefacto; los roles de dominio refinan; una instancia fresca de `@revisor` o del especialista apropiado verifica globalmente; `@qa-validador` ejecuta checks; `@auditor-cumplimiento` comprueba el contrato. Se invocan proporcionalmente `actuar-como-senior`, `investigar-antes-de-implementar`, `revisar-cambios`, `validar-calidad`, `validar-ui-visual`, `auditar-seguridad`, `auditar-orquestacion` y `comunicar-como-jefe`.

## Triggers

- **Keywords:** ejecuta el loop, loop multiagente, refinar en bucle, ojos frescos, converger con agentes, loop largo, consenso fresco, verificación global, plan perfecto, implementación perfecta.
- **Patrones de usuario:** “ejecuta el loop para X”, “quiero que varias IAs lo refinen”, “no cierres hasta verificarlo globalmente”, “usa los tokens sobrantes para pulir y comprobar”.
- **Encadenamiento:** la activa `@orquestador`; los roles cargan skills de dominio; tras converger entra el verificador global; antes de publicación siguen aplicando `revisar-cambios`, `validar-calidad` y `configurar-github`. Hermana de `auditar-en-bucle`: esa audita un corpus existente con flota de lentes y produce hallazgos; esta refina un objetivo o plan antes de ejecutarlo.

# Ejemplos de activación

- “Refina en bucle esta arquitectura y verifica globalmente sus premisas antes de implementarla.”
- “Ejecuta un loop largo sobre este módulo; cuando converja, otra IA debe intentar refutarlo con código y tests.”
- “Usa el loop para mejorar esta documentación y comprueba hechos, contradicciones y que el primer paso sea ejecutable.”
