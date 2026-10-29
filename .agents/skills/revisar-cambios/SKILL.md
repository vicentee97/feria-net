---
name: revisar-cambios
description: "Usar antes de commitear o pushear a GitHub para REVISAR el diff pendiente contrastando documentacion, teams, roadmap, reglas y validaciones, emitiendo solo hallazgos materiales sin editar ni commitear; si detecta monolitos o modularizacion pendiente, derivar a `modularizar-codigo`. Esta skill es el gate pre-publicacion; configura-github publica. TRIGGERS: revisar cambios, antes de subir, revisar diff, pre-push, review, revisar antes de commit."
---

# Revisar Cambios

# Frontera de la skill: REVISION pre-publicacion, no edita ni publica (LEER PRIMERO)

Esta skill es el gate de revision pre-publicacion. La frontera es estricta:

- **REPORTA** hallazgos materiales con severidad (`P0`-`P3`) y dictamen finito (`bloqueado`, `listo con riesgo residual`, `listo para validar/publicar`).
- **NEVER** edita codigo, stagea, commitea, pushea, crea PR ni tags; la publicacion la hace `configurar-github` / **@experto-github** tras aceptacion explicita del usuario.
- **NEVER** propone reescrituras, refactors ni mejoras esteticas salvo que haya riesgo material verificable.
- Si el usuario pide corregir tras la revision, se cambian a las skills de implementacion; esta skill no ejecuta la correccion.

Razon: una revision que tambien edita o publica pierde su valor como checkpoint neutral. Esta skill es por definicion la "segunda IA" del ciclo de publicacion.

# Objetivo

Revisar cambios pendientes antes de `commit`, `push`, PR o subida a GitHub: entender que cambio realmente el repositorio, contrastarlo con reglas y documentacion, detectar fallos materiales y decidir si el cambio esta listo para que otra skill lo publique, evitando el bucle infinito de "siempre hay algo que mejorar".

# Anti-patrones y su correccion

Cada sesgo fuerte del entrenamiento base necesita su par MAL -> BIEN -> EJEMPLO. Reconocer el anti-patron no basta para vencerlo.

- **Perfeccionismo improductivo como hallazgo:** MAL reportar como fallo preferencias de estilo, renombres "mas bonitos", micro-refactors o alternativas equivalentes. BIEN aplicar la puerta de materialidad: solo reportar si puede causar bug visible, perdida/corrupcion de datos, fallo de seguridad, fallo de despliegue, romper regla canonica o inducir una accion equivocada. EJEMPLO "esta variable tendria un nombre mas descriptivo" -> no es hallazgo; "esta migracion borra la columna sin down" -> P1.
- **Bucle anti-perfeccionismo conversacional:** MAL buscar defectos nuevos solo porque el usuario vuelve a preguntar "hay algo mas", "estas seguro" o variantes. BIEN si ya se reviso el diff completo y no hay hallazgos materiales nuevos, repetir el dictamen con seguridad y explicar que no han aparecido evidencias nuevas; no inflar la revision para justificar la existencia. EJEMPLO tras un "estas seguro?" sin diff nuevo -> mantener el dictamen, no abrir otra ronda.
- **Confundir mejora significativa con fallo:** MAL tratar una mejora de calidad/seguridad/mantenibilidad como si bloqueara publicar. BIEN separar `Fallo material` (se reporta como hallazgo y puede bloquear) de `Mejora significativa` (se propone de forma proactiva, indicando si conviene antes o despues de publicar) y `Perfeccionismo improductivo` (no se menciona salvo peticion explicita). EJEMPLO "anadir un test para este edge case" -> mejora significativa, no P2 bloqueante.
- **Inspeccion superficial del diff:** MAL opinar leyendo solo nombres de archivo o el `git diff --stat`. BIEN leer el diff real, identificar rama/estado, separar cambios propios del hilo de ajenos y artefactos generados, y contrastar contra TEAM/TODO/docs canonicas. EJEMPLO dictamen "listo" sin haber abierto el diff -> invalido.
- **Trazabilidad ausente tratada como detalle:** MAL ignorar que un cambio material no tiene TEAM que lo justifique o que el TEAM contradice el estado real de Git/migraciones/TODO. BIEN reportar la falta de trazabilidad como hallazgo (P2 si puede inducir una accion equivocada, P3 si es limpieza acotada). EJEMPLO diff que aplica una migracion ya aplicada segun el TEAM -> P2.
- **Revision que edita o publica:** MAL que la revision termine stageando, commiteando, abriendo PR o diciendo "ya lo subi". BIEN cerrar con dictamen y dejar la siguiente accion en manos del usuario y de `configurar-github`; si el usuario pide corregir, cambiar a la skill de implementacion. EJEMPLO revision que hace `git add . && git commit` -> P1 de frontera.

# Alcance y limites
- Si revisa: codigo, migraciones, scripts, configuracion, frontend, backend, tests y documentacion afectados por el diff; `docs/SSOT.md`, `docs/TODO.md`, `.teams/`, `.questions/`, versionado y reglas locales; consistencia con skills relevantes del dominio del cambio; validaciones ejecutadas o razonablemente necesarias antes de publicar.
- No sustituye a `validar-calidad`: la usa o la invoca conceptualmente para decidir checks proporcionales.
- No sustituye a `configurar-github`: no prepara commits ni sube cambios.
- No sustituye a skills de dominio (`heroui-react`, `gestionar-roadmap`, `documentar-con-criterio`); se apoya en ellas cuando el cambio toque esas areas.
- No debe bloquear por "se podria hacer mejor" si el cambio cumple el objetivo, no rompe reglas y el riesgo residual es aceptable.

# Inputs / contexto obligatorio
- [SSOT del repositorio](../docs/SSOT.md) y [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md).
- [Actuar Como Senior](../actuar-como-senior/SKILL.md) para profundidad y contraste; [Validar Calidad](../validar-calidad/SKILL.md) para checks proporcionales.
- [Documentar Con Criterio](../documentar-con-criterio/SKILL.md) si cambia documentacion; [Gestionar Roadmap](../gestionar-roadmap/SKILL.md) si cambia `docs/TODO.md`.
- [Configurar GitHub](../configurar-github/SKILL.md) solo como frontera: esta skill termina antes de publicar.
- `git status`, `git diff`, `git diff --stat` y, si aplica, diff staged/unstaged por separado.
- TEAM activo o mas reciente en `.teams/`, preguntas abiertas relevantes y roadmap local.
- Comandos reales de build/test/lint/versionado definidos por la SSOT o scripts del proyecto.

# Comportamiento esperado

## 1. Modo revisor, no implementador
- No modificar archivos aunque el fallo sea claro.
- No hacer `git add`, `commit`, `push`, tags ni PR.
- Si el usuario pide revisar, la salida debe ser el informe; si despues pide corregir, se cambian a las skills de implementacion.

## 2. Reconstruir el cambio real
Antes de opinar: leer reglas globales, SSOT local y documentacion canonica relevante; identificar rama, estado de Git y archivos modificados/nuevos/borrados; leer el diff real (no solo nombres); leer el TEAM activo o reconstruir trazabilidad si falta; entender el objetivo declarado y compararlo con lo que el diff hace; separar cambios propios del hilo, ajenos previos y artefactos generados.

## 2.1. Trazabilidad obligatoria en TEAM
Todo cambio pendiente debe tener trazabilidad suficiente en `.teams/` cuando afecte a codigo, datos, seguridad, scripts, arquitectura, roadmap, versionado, documentacion canonica o proceso de publicacion. Durante la revision: comprobar que existe un TEAM activo/reciente que justifique el objetivo; que explica que se cambio, por que, que queda pendiente y que validaciones se ejecutaron; que no contradice el estado real de Git/migraciones/TODO/CI; y que titulos, idioma y nombres cumplen las normas locales. Si falta, esta desactualizado o no explica cambios materiales, reportarlo como hallazgo (`P2` si puede inducir una accion equivocada, `P3` si es limpieza acotada).

## 3. Severidad
- `P0`: rompe produccion, pierde datos, expone seguridad critica o impide operar.
- `P1`: bug probable en flujo importante, migracion peligrosa, fuga de datos, CI bloqueado o incoherencia grave.
- `P2`: fallo real pero acotado; debe corregirse antes de publicar si el cambio va a una rama compartida.
- `P3`: limpieza necesaria de proceso/documentacion o riesgo bajo, no siempre bloqueante.

Regla practica: `P0/P1` bloquean; `P2` normalmente bloquea si afecta a comportamiento, datos, seguridad, CI o promesas del TODO; `P3` no bloquea salvo acumulacion que degrade la trazabilidad.

## 4. Profundidad proporcionada
Minimo para cambios no triviales: revisar productores y consumidores directos del cambio; configuracion, mapeos, scripts o migraciones relacionados; tests existentes o ausencia donde el riesgo lo exija; docs canonicas y TEAM si el cambio toca reglas, version, roadmap u operativa; ejecutar o recomendar checks reales cuando sean baratos y relevantes. Freno anti-obsesion: no abrir areas remotas sin relacion tecnica clara; tras una segunda pasada sin nuevos `P0-P2`, cerrar la revision.

## 5. Checklist de revision
Aplicar solo las filas que correspondan al diff:
- Codigo: contrato publico, errores, edge cases, concurrencia, transacciones, nullability, validaciones, compatibilidad.
- Datos: migraciones, rutas canonicas, down/up, backups, integridad referencial, multi-tenant.
- Seguridad: auth, autorizacion, secretos, logs, CORS, exposicion de errores, rate limits.
- Frontend: estado, reintentos, accesibilidad (`aria-label`, keyboard nav, semantic HTML), errores; sin `key={index}` en listas reordenables, sin hooks duplicados, sin `"use client"` innecesario, imports que existen en `package.json`, sin clases CSS definidas sin usar.
- Dependencias: paquetes realmente importados, sin librerias redundantes por proposito, versiones consistentes.
- Configuracion: `.gitignore` completo, configs sin paths hardcoded, metadata sin placeholders.
- Scripts: parametros, rutas, variables reservadas, idempotencia, orden seguro de operaciones.
- Documentacion: SSOT, TODO, TEAM, preguntas abiertas, idioma/titulos, duplicados, promesas que el codigo no cumple.
- Versionado: fuente local de version, db/schema, sync push vs release formal, reglas CI.
- GitHub/CI: checks locales equivalentes, workflows afectados, archivos generados o ignorados.

## 6. Salida obligatoria
La respuesta empieza por los hallazgos, como una revision de codigo.

1. `Hallazgos`: por severidad, con archivo y linea cuando sea posible. Si no hay fallos materiales, decir `No he encontrado fallos materiales`.
2. `Estado`: `bloqueado`, `listo con riesgo residual` o `listo para validar/publicar`.
3. `Explicacion para no tecnicos`: traducir lo importante a lenguaje sencillo si el usuario lo pide o si el tema es delicado.
4. `Validaciones`: que se ejecuto, que paso, que no se pudo ejecutar y por que.
5. `Riesgo residual / mejoras opcionales`: solo lo que no bloquea, sin abrir bucle.

## 7. Dictamen final
- `bloqueado`: hay `P0/P1` o `P2` material que debe corregirse antes de publicar.
- `listo con riesgo residual`: no hay fallos bloqueantes, pero falta una validacion razonable o queda un riesgo explicado.
- `listo para validar/publicar`: no hay fallos materiales y las validaciones razonables pasaron o no aplican.

No decir "todo perfecto". Decir "no he encontrado fallos materiales con la evidencia revisada".

# Cierre OBLIGATORIO: gate de auto-cita

Antes de declarar la revision lista, declarar (auto-cita con evidencia, no auto-evaluacion). Maximo 7 items:

- [ ] **Declaro** que reconstrui el cambio real leyendo el diff (no solo nombres), la rama, el estado de Git y el TEAM, separando cambios propios de ajenos y artefactos generados.
- [ ] **Declaro** que aplique la puerta de materialidad: cada hallazgo cita riesgo concreto (bug, datos, seguridad, despliegue, regla canonica o accion equivocada), y evite inflar con perfeccionismo o con bucle anti-conversacional.
- [ ] **Declaro** que separe `Fallo material` de `Mejora significativa` y `Perfeccionismo improductivo`, y que el dictamen distingue bloqueado / listo con riesgo residual / listo para validar-publicar.
- [ ] **Declaro** que verifique trazabilidad en TEAM cuando el cambio toca codigo, datos, seguridad, scripts, arquitectura, roadmap, versionado o documentacion canonica, reportando como hallazgo su ausencia o contradiccion.
- [ ] **Declaro** que NO edite, stagee, commitee, pushee ni abri PR; el siguiente paso queda en manos del usuario y de `configurar-github`.
- [ ] **Declaro** el resultado del gate de segunda IA (ver abajo).

## Gate de segunda IA (OBLIGATORIO, no sugerencia)

Esta skill ES por definicion el gate pre-publicacion (la "segunda IA" que califica el trabajo de quien implemento). Pero cuando la revision detecta riesgos que escapan a su dominio, debe invocar una tercera IA antes de cerrar:

- Si la revision detecta **secrets versionados, auth/permisos mal configurados, RLS ausente, datos personales expuestos o superficie sensible publica** -> escalar OBLIGATORIAMENTE a **@especialista-seguridad** (o activar `auditar-seguridad`) antes del dictamen final.
- Si la revision necesita **re-validacion tecnica** (build/typecheck/lint/tests que no pudo correr o que fallaron) -> delegar OBLIGATORIAMENTE a **@qa-validador** antes del dictamen `listo para validar/publicar`.
- Si la revision revela **refactor material, riesgo arquitectonico o deuda operativa cercana** -> derivar a **@revisor** como par sobre el propio diagnostico (segunda opinion de riesgo).
- Si el dictamen es `listo para validar/publicar` sin hallazgos materiales y con validaciones razonables pasadas -> sin tercera IA obligatoria (no burocracia innecesaria).

# Flujo recomendado
- [ ] Cargar reglas globales, SSOT y skills relacionadas.
- [ ] Identificar rama, diff y archivos pendientes; leer el diff real.
- [ ] Leer TEAM/TODO/docs relevantes y comprobar trazabilidad.
- [ ] Revisar el diff por riesgo (puerta de materialidad), no por gusto.
- [ ] Contrastar consumidores, migraciones, scripts y tests cercanos.
- [ ] Ejecutar checks proporcionales si procede; resolver el gate de auto-cita y el gate de segunda IA.
- [ ] Emitir solo hallazgos materiales y cerrar con dictamen finito y sin publicar.

# Criterio de resultado bueno

Cierre valido cuando el gate de auto-cita de arriba se cumple con evidencia observable y el gate de segunda IA esta resuelto segun la tipificacion. Esta seccion no anade reglas: es el mirror declarativo del gate, repetido aqui solo porque `validate-hub-skills.ps1` exige el header.

## Triggers
- Keywords: revisar cambios, antes de subir, revisar diff, pre-push, review, revisar antes de commit, code review, review pre-publicacion.
- Patrones de usuario: "revisa los cambios antes de subir", "haz una review", "esta listo para publicar?", "revisa el diff", "otra IA hizo cambios, revisa antes de publicar".
- Encadenamiento: antes de `configurar-github`; despues de implementar cambios o de que otra IA los haga; hermana de `auditar-seguridad` (superficie sensible) y `validar-calidad` (gate tecnico).

# Ejemplos de activacion
- "Revisa los cambios pendientes antes de subirlos a GitHub."
- "Actua como revisor exhaustivo: dime si esto esta listo o si hay fallos reales."
- "Otra IA ha hecho cambios; revisa TODO, TEAM, documentacion y codigo antes de publicar."
- "Haz una review pre-push, pero no edites ni subas nada."
