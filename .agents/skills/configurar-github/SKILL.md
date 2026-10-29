---
name: configurar-github
description: "Politica canonica para gestionar Git y GitHub en el hub y en proyectos consumidores: decision de publicacion, ramas, commits, push, PR, versionado, tags y releases, separando politica comun, concrecion local y reglas exclusivas del hub. TRIGGERS: subir, push, publicar, github, commit, release, tag, version, sincronizar, sube cambios, haz push, commitea, PR, pull request, descripcion de PR, integrar PR."
---

# Configurar GitHub

# Objetivo

Fijar la politica operativa de Git y GitHub del hub: cuando guardar/proteger automaticamente, cuando publicar/integrar, que riesgos exigen autorizacion humana, que salida devolver y como separar la politica comun de la concrecion local de cada proyecto y de las reglas exclusivas de CerebroOperativoIA.

La skill existe para blindar dos anti-patrones criticos: pedir al usuario decisiones tecnicas de Git que no entiende, y ejecutar operaciones sensibles por inercia (force push, release, borrado, sync push tratado como release, commit mezclado sin control).

# Frontera de la skill: POLITICA, no ejecuta (LEER PRIMERO)

Esta skill define la politica. Git Guardian ejecuta el guardado rutinario del lote propio cuando el gate esta verde; @orquestador puede invocarlo directamente. @experto-github conserva PR, conflicto, publicacion sensible/formal y gate rojo.

- **DEFINE** cuando guardar/proteger en autopiloto seguro, como clasificar el **Tipo** de operacion (`listo para publicar`, `sync push`, `PR`, `release formal`) y, como eje distinto, el **Estado/Gate** de control (`listo para mergear` | `listo para publicar` | `publicado` | `bloqueado` + motivo), que autorizacion hace falta, que salida devolver. `Tipo` y `Estado/Gate` son ortogonales: `Tipo` = que se hace contra el remoto; `Estado/Gate` = donde esta el trabajo en el flujo.
- **DEFINE** anti-patrones (force push, auto-publicar, commit mezclado, saltar validaciones, borrar rama candidata) y como corregirlos.
- **NEVER** ejecuta comandos Git manuales por iniciativa propia.
- @orquestador puede usar `scripts/git_guardian.py save --own <lote>` para un guardado rutinario verde, sin otro handoff. PR, conflicto, integracion no rutinaria, publicacion sensible/formal o gate rojo se deriva a @experto-github.
- El guardado lleva la identidad de la sesion cuando la tarea tiene reserva: `--lease-id <tu lease>` o `--task-id <tarea> --agent <agente>`, con el MISMO lote declarado en la comprobacion previa. Sin identidad, el gate juzga el arbol entero y el lote propio se bloquea contra la propia reserva; la salida es declarar la identidad o completar la admision, nunca publicar a mano.

Razon: la skill mas invocada del hub no puede ser tambien la que dispara mutaciones. Politica y ejecucion separadas evitan que una IA decida y publique en el mismo turno sin gate.

# Anti-patrones y su correccion

Cada sesgo fuerte del entrenamiento base necesita su par MAL -> BIEN -> EJEMPLO. Reconocer el anti-patron no basta para vencerlo.

- **Preguntar mecanica Git al usuario no experto (D1, critico):** MAL preguntar "¿commit?", "¿push?", "¿rama X?", "¿PR draft?" cuando el gate es verde y la decision es tecnica. BIEN ejecutar autopiloto seguro: commit atomico y publicacion en el destino permitido por [ramas.md](ramas.md), incluido main rutinario cuando proceda, y explicar el destino verificado. EJEMPLO tras `ok, funciona bien`, si no hay riesgos, guardar y proteger sin pedirle al usuario que elija Git.
- **Auto-publicar operaciones sensibles (D1b, critico):** MAL interpretar `ok`, `funciona`, `esta bien` o `validado` como autorizacion para force push, merge sensible a `main`, release formal, tag o borrado remoto. BIEN bloquear y pedir autorizacion humana simple solo para esas operaciones sensibles.
- **PR/worktree como prerequisito de probar (D1c):** MAL crear worktree + PR antes de que el usuario pueda ver su propio cambio en local. BIEN desarrollar en el workspace activo cuando no hay concurrencia, y decidir rama/PR al guardar o publicar segun tamano, main protegida y riesgo. EJEMPLO fix de menu en solitario: editar local, validar en navegador, despues Git Guardian protege si procede.
- **Force push por conveniencia (D2, el mas peligroso en multi-IA):** MAL `git push --force` para "arreglar" divergencia, conflicto o historial. BIEN parar, diagnosticar estado local/remoto, y tratar como operacion destructiva que requiere @especialista-seguridad + `ejecutar-operaciones-sensibles` + autorizacion explicita del usuario. EJEMPLO ante `! [rejected]` por divergencia: reportar opciones, no forzar.
- **Commit mezclado sin avisar (D3):** MAL agrupar en un commit cambios no relacionados (UI + skills + backend + docs de otro chat) sin declarar alcance. BIEN detectar bloques del diff, proponer commits separados si son del mismo flujo o ramas separadas si son historias independientes; solo agrupar declarando alcance y riesgo. EJEMPLO diff con `feat(ui)` + `chore(hub)` + `fix(db)` -> 3 commits o avisar al usuario antes de uno solo.
- **Saltar Git Guardian y validaciones pre-push (D4):** MAL hacer `git add/commit/push` manual por costumbre. BIEN invocar `scripts/git_guardian.py save --own <lote>` para un guardado rutinario verde; deriva a @experto-github si requiere PR, conflicto o gate sensible/rojo (un `coordination-blocked` no se resuelve a mano: ver «Gate de coordinacion en rojo»). EJEMPLO PR ready tras tocar RLS sin @qa-validador + @especialista-seguridad -> bloqueado.
- **Borrar rama candidata con trabajo no mergeado (D6):** MAL `git branch -D` por limpieza cuando la rama tiene commits no fusionados o es paralela a otra activa del mismo tema. BIEN comprobar propiedad e integracion y aplicar CERRAR de [ramas.md](ramas.md), con los controles y la autorizacion correspondientes. Una marca de caducidad o redundancia no autoriza el borrado. Las excepciones de limpieza automatica son solo las ya definidas para `sweep --safe`; no extenderlas a ramas manuales ni usar `-D` por inercia.
- **Frenar el guardado por estado ajeno (D7, el mas caro en multi-IA):** MAL bloquear el cierre porque el arbol tiene ficheros de otras sesiones sin confirmar, o preguntar "tengo mis cambios sin subir y veo otros cambios sin subir, ¿que hago?". BIEN guardar solo tu lote con `git_guardian.py save --own <tus superficies>`: el guardian juzga el lote, excluye lo ajeno del commit y lo reporta como aviso `foreign-working-tree`. EJEMPLO arbol con 60 ficheros ajenos sucios y 3 propios -> se guardan los 3, se publica si el gate esta verde y lo ajeno se nombra sin preguntar. Si el gate bloquea trabajo propio limpio, es un fallo de la herramienta: se arregla, no se traslada al usuario.
- **Confundir el turno de salida con un bloqueo (D9, multi-IA):** MAL tratar un turno ocupado como `bloqueado` o pedirle al usuario que decida algo. BIEN saber que `save --push` toma un turno por repositorio (comparten indice y remoto), espera solo hasta `--wait-seconds` (180 s por defecto) y reintenta: el resultado de agotar la espera es `pendiente publicar (turno ocupado)`, con el titular en `turn.holder`, y va en `lastDone`, nunca en `waitingOn`. EJEMPLO dos chats subiendo a la vez -> el segundo espera unos segundos y sube igual; nadie pregunta nada. NO se roba el turno ni se usa `--force`: el cerrojo es del sistema operativo y se suelta si el proceso muere.
- **Commit que se lleva el indice entero (D8, mezcla silenciosa de sesiones):** MAL `git commit -m <mensaje>` sin pathspec despues de preparar tu lote: Git commitea TODO el indice, incluido lo que otra sesion dejo preparado, bajo tu mensaje. BIEN commitear con pathspec explicito (`git commit -m <mensaje> -- <rutas del lote>`), que entrega exactamente tu lote y deja lo ajeno preparado. EJEMPLO 29 ficheros ajenos preparados + 1 propio -> el commit contiene 1.

# Alcance y limites

- Incluye: estado Git, ramas, commits, push, PRs, tags, releases, versionado, bootstrap de repositorio y explicacion humana de la decision.
- Excluye: implementar codigo, revisar riesgos materiales, cerrar QA, crear CI por defecto o ejecutar operaciones destructivas sin `ejecutar-operaciones-sensibles`.
- Si falta cierre tecnico -> escalar a `validar-calidad` o **@qa-validador**.
- Si falta review material -> escalar a `revisar-cambios` o **@revisor**.
- Si el cambio toca auth, permisos, secretos, datos sensibles o superficie publica sensible -> escalar OBLIGATORIAMENTE a `auditar-seguridad` o **@especialista-seguridad** antes de publicar.

# Inputs / contexto obligatorio

- `docs/SSOT.md` local del proyecto.
- [preferences.md](preferences.md): 22 preferencias con alcance `global`, `si SSOT local lo define` y `solo CerebroOperativoIA`. Aplicar solo las del alcance que aplique; si una preferencia referencia una ruta inexistente (`HUB_VERSION`, `.teams/`, `docs/TODO.md`) y la SSOT local no la define, tratarla como no aplicable y reportarlo.
- Estado real: `git status`, diff, rama, remoto, commits recientes y tags.
- Estado de coordinacion si existe `scripts/ai_coordination.py`: leases activos, worktree actual, superficies reservadas, solapes (ver Rule 25 y 26 de `docs/AI_GLOBAL_RULES.md`).
- Fuente local de version solo si la SSOT la documenta (`VERSION.json`, `package.json`, `HUB_VERSION` u otra).
- Contexto remoto proporcional si `gh` esta disponible: auth, PRs recientes, releases/tags y checks cuando aplique.

# Comportamiento esperado

La skill aplica politica en 4 capas: reconstruir estado, clasificar, autorizar, devolver salida. El detalle denso vive en las referencias.

1. **Reconstruir estado real** antes de cualquier decision: preferir `scripts/git_guardian.py preflight` cuando exista; si no, `git status` + diff + rama + remoto + commits + tags + SSOT local. Si falta `scripts/ai_coordination.py` local, resolver el hub por `.cerebro-operativo/hub-path.txt` y usar el script del hub. Prioridad factual: diff > Git Guardian > SSOT > TEAM > memoria conversacional.
2. **Clasificar** el **Tipo** (`listo para publicar` / `sync push` / `PR` / `release formal`) y, por separado, el **Estado/Gate** (`listo para mergear` / `listo para publicar` / `publicado` / `bloqueado` + motivo). Ver Flujos abajo y [merge-gate.md](merge-gate.md).
3. **Local-first antes de proteger**: en trabajo solitario, los cambios se hacen primero en el workspace local activo para que el usuario pueda probarlos. Git Guardian decide despues si guarda en `main`, rama segura o PR.
4. **Autopiloto seguro**: si el gate es verde y no toca superficie sensible, guardar/proteger en el destino permitido por la tabla de [ramas.md](ramas.md), sin preguntar mecanica Git al usuario; dicho en forma verificable, `no pregunta mecanica Git rutinaria`.
5. **Autorizar solo lo sensible**: release formal, tags, force push, borrados remotos, reescritura de historia, merge grande/sensible a `main`, secretos/datos/auth/permisos/RLS o cambios irreversibles exigen autorizacion humana simple.
   - MUST transportar esa autorizacion a Git Guardian como `--approval-ref user:<fecha-o-id>:<motivo-explicito>` y pasar identidad de lease (`--lease-id` o `--task-id` + `--agent`). Una referencia vaga como `yes` es invalida. Una superficie sensible NEVER se guarda desde `main`/`master`; su `integrate-gate --base-ref origin/main --team-id TEAM_XXXX` audita commits, exige review/QA `apto` ligados al digest material actual y, si toca auth/RLS/secretos u otra superficie de seguridad, exige tambien evidencia `security` del especialista ligada al mismo digest. PR y todos los runs de CI deben pertenecer a la rama/HEAD actuales. El Team debe seguir activo en fase `pendiente-qa` con gate `publicacion`: se cierra y archiva solo despues del merge, mediante un cierre Team-only, para no mentir si GitHub falla. La aprobacion no levanta secretos, diff desconocido, validacion humana pendiente, higiene, CI ni coordinacion.
6. **Devolver salida auditable**: conservar tipo, semaforo, rama, commit, version, tag, PR, enlace, validacion y riesgo residual en el informe interno. Al usuario comunicar destino, resultado verificado, comprobaciones y siguiente paso segun el contrato de estados siguiente; no volcar metadata por rutina.

## Contrato de estados: destino y resultado verificable

`publicado` acredita presencia en el remoto de una **rama identificada**; por si solo no acredita incorporacion en la rama oficial. MUST traducirlo al usuario con el destino y lo pendiente:

| Evidencia real | Salida humana | Que falta |
|---|---|---|
| Cambios o commit solo local | Hecho/guardado en tu equipo; pendiente subir | Guardado/push y controles que procedan |
| HEAD comprobado en la rama remota de trabajo | Subido a una rama de GitHub; aun no incorporado a main | Revisar e integrar si ese es el objetivo |
| PR abierto, draft o ready | Propuesta abierta; aun no incorporada a main | Gates pendientes y merge segun politica |
| Merge solo en main local | Incorporado a main en tu equipo; pendiente subir | Push autorizado y comprobacion remota |
| Resultado comprobado en main remota | Incorporado a main en GitHub | CI final o seguimiento si aun faltan |
| Aplicacion iniciada y comprobada con esa version | Version activada y comprobada | Solo pendientes reales de funcionamiento |

Sustituir `main` por la rama oficial documentada si es otra. PR cerrado sin merge no acredita incorporacion. Un merge por GitHub tambien debe comprobarse en remoto y actualizarse localmente sin alterar trabajo ajeno; no exige un segundo merge local. Un push, un PR, CI verde o una proyeccion regenerada no acreditan despliegue ni runtime activo. La declaracion de terminado mantiene todas las condiciones de Rule 27 y el objetivo acordado: si se pidio incorporar, un PR abierto no completa la tarea.

MUST incluir un enlace util cuando exista remoto y decir si queda alguna accion o autorizacion; no trasladar comandos al usuario. Ejemplos: "Subido a una rama; la propuesta esta abierta y falta autorizar su incorporacion"; "Incorporado a main en GitHub, copia local actualizada y pruebas finales aprobadas; no tienes que hacer nada". Un estado interno `no-verificable` se informa como pendiente/bloqueado con motivo, nunca como incorporado.

## Higiene de ramas y diff mezclado

Antes de `sync push`, `PR` o `release formal`, reconstruir el estado completo de ramas y detectar diff mezclado. Ver [ramas.md](ramas.md) para el modelo hibrido por tamano, el ciclo de vida ABRIR/VIVIR/MERGER/CERRAR, kebab-case, PR en solitario y deteccion de huerfanas/divergentes/redundantes. Ver [merge-gate.md](merge-gate.md) para el gate bloqueante `listo para mergear`. Ver [commits.md](commits.md) para formato de commits, ejemplos con/sin cuerpo y estrategia ante diff mezclado.

## Concurrencia de IAs y CI proporcional

 Antes de commit, push, PR, merge o release con leases activos: no publicar si `scripts/ai_coordination.py gate` devuelve `blocked`; no tocar superficies reservadas por otro TEAM sin coordinacion; usar merge train si hay varias ramas paralelas. **Riesgo del código no equivale a exclusividad de edición:** cambios de auth/permisos, migraciones, lockfiles, reglas globales y scripts de publicación mantienen sus revisiones y autorizaciones de integración, pero solo se marcan `exclusive` cuando el archivo físico o recurso compartido realmente lo requiere. Una misma base de datos o perfil activo sí es un recurso externo exclusivo; el código fuente en worktrees separados puede avanzar y se reconcilia al integrar. Para el ciclo automatico del supervisor, `integrate-local --local-only` tiene prioridad: integra solo localmente tareas `ready` TRIVIALES/MEDIAS y nunca ejecuta push, PR, tag o release. Para CI/CD: detectar `.github/workflows`, revisar runs/checks con `gh` si esta disponible, no crear CI por defecto desde esta skill (derivar a `configurar-testing` o @qa-validador).

## Recuperacion ante fallos parciales

Si una operacion falla a medias (commit, push, tag, release, PR, divergencia): NO repetir comandos a ciegas. Diagnosticar estado local/remoto antes de reintentar y no crear duplicados. Ver [recuperacion.md](recuperacion.md) para el playbook completo.

# Flujos

## `listo para mergear` (gate de control, no tipo de publicacion)
Gate anterior a incorporar una rama a la rama oficial, en local o mediante GitHub. No es un 5º valor de `Tipo`. TRIVIAL y MEDIO con main directo permitido no pasan por un merge de rama; MEDIO protegido en rama y GRANDE/SENSIBLE/RELEASE si. No exige una pregunta para MEDIO limpio verde: se aplica autopiloto proporcional. Detalle de requisitos, estrategias y autorizacion en [merge-gate.md](merge-gate.md).

Salida: `Estado/Gate: listo para mergear` + que falta para mergear + riesgo residual + siguiente paso.

## `listo para publicar`
Usar cuando el trabajo parece validado pero falta integrar/publicar una operacion sensible o formal. Para guardado rutinario limpio no se queda esperando al usuario: Git Guardian guarda/protege.

Salida: que queda preparado; que falta para publicar; riesgo residual; recomendacion de siguiente paso.

## `sync push`
Usar cuando el usuario pide subir/publicar sin version, release ni tag.

Contrato: no tocar version formal; no crear tag; no crear GitHub Release; no usar prefijo versionado; incluir solo cambios clasificados por ownership (`propio`, `team-log`, `hub-sync`, `generated`) y bloquear `desconocido`; compartir enlace al commit, rama o PR cuando exista remoto.

**Turno de salida:** `git_guardian.py save --push` toma un turno por repositorio (con `publish.lock` en el `git common dir`) antes de `git add`/`commit`/`push`, porque comparten indice y remoto. El turno espera y reintenta solo (`--wait-seconds`, 180 s por defecto) y publica el estado legible en `publish.json` (`held_by`, `since`, `pid`). Si la espera se agota: `publish-turn-timeout` con el titular en `turn.holder` — es una espera reintentable, **no** un `bloqueado` ni una pregunta al usuario. Dentro del turno git corre con `GIT_TERMINAL_PROMPT=0` y tope de tiempo, para que un push no cuelgue la publicacion de todas las sesiones; no se roba el turno (`--force` sigue prohibido).

**Turno de integración:** la exclusión del destino dura solo la comprobación y la incorporación local. Edición, pruebas y revisión ocurren fuera del turno. Antes de incorporar, vuelve a comprobar la rama origen, el SHA actual del destino, el gate y la propiedad del lote; si el destino avanzó, actualiza la rama propia y repite las validaciones afectadas. Un conflicto en esa operación no debe impedir guardar o probar ramas independientes.

## `PR`
Usar cuando aporta trazabilidad o control.

El titulo expresa una accion concreta en español; la referencia a una tarea es opcional. El cuerpo sigue la plantilla [pull_request_template.md](pull_request_template.md), con estas cuatro secciones y en este orden:

1. **Motivo** — problema que resuelve y por qué importa.
2. **Cambios** — comportamiento que queda después.
3. **Validación** — comprobaciones y resultados reales, además de pendientes reales.
4. **Riesgos y recuperación** — riesgos relevantes y forma de volver atrás; si no hay riesgos adicionales o no aplica, decirlo brevemente con motivo.

Un cambio pequeño puede usar una frase por sección; el detalle crece con el alcance. No pedir extensiones mínimas, capturas para cambios sin interfaz, tickets nuevos ni listas decorativas.

**Al preparar o integrar un PR propio:** escribe desde el diff final y las pruebas disponibles, no desde el plan inicial; actualiza título y cuerpo cuando cambie el alcance; reutiliza el PR abierto de esa rama en vez de crear otro. Antes de marcarlo listo, comprueba y corrige el cuerpo del PR propio según la plantilla. Si se corrige el cuerpo, vuelve a consultar y validar ese mismo PR antes de integrar. En cualquier repositorio que haya adoptado la plantilla, pasa el PR explícito al Git Guardian para su control de integración según [merge-gate.md](merge-gate.md). Si el consumidor no tiene `scripts/git_guardian.py` local, ejecuta el Git Guardian del Hub indicando la raíz del consumidor con `--root <raiz-del-repositorio>`; esto también se aplica a dsh-plugins y no requiere ampliar `dsh-guardian`. No edites PR ajenos ni reescribas automáticamente PR ya fusionados.

La plantilla incluye el comentario `CEREBRO_PR_CONTRACT: adopted-v1` para que el Git Guardian reconozca la **adopción a nivel de repositorio**. Al copiar la plantilla a la descripción, elimina esa línea de marcador antes de preparar o guardar el cuerpo del PR. El marcador no identifica quién es dueño del PR, no significa que esté aprobado y no demuestra una Review de GitHub, QA ni autorización del dueño.

No afirmes que una cosa demuestra otra: una **revisión interna** es el examen por otra IA o persona dentro del equipo; una **Review de GitHub** es el dictamen registrado en la pestaña Reviews; las **pruebas automáticas** son ejecuciones comprobables; y la **autorización del dueño** es su instrucción explícita para una operación sensible. Una descripción bien formada no acredita ninguna de ellas. No inventes resultados ni reveles leases, hashes o notas internas de coordinación: el PR debe ayudar a quien revisa a entender el resultado.

Ejemplos:

**Cambio pequeño**

```markdown
## Motivo
Al cerrar el formulario, el foco se perdía y dificultaba seguir usando el teclado.

## Cambios
El foco vuelve al botón que abrió el formulario.

## Validación
Prueba del flujo con teclado: correcta. No hay otras comprobaciones pendientes.

## Riesgos y recuperación
Riesgo bajo; se revierte el cambio de foco si causa problemas.
```

**Cambio sensible**

```markdown
## Motivo
La comprobación actual permitía actualizar un registro fuera del ámbito autorizado.

## Cambios
El servidor comprueba la autorización para leer y actualizar el registro antes de guardar.

## Validación
Pruebas de autorización permitida y denegada: correctas. Revisión interna de seguridad: completada. Review de GitHub: pendiente. No se ha desplegado.

## Riesgos y recuperación
Riesgo: bloquear una actualización legítima por una regla demasiado estricta. Revisar el caso denegado y revertir este cambio si persiste.
```

**Borrador con pendientes**

```markdown
## Motivo
La primera versión permite comprobar el nuevo flujo antes de decidir si conviene incorporarlo.

## Cambios
Se añade el formulario y se conserva la ruta anterior mientras sigue la revisión.

## Validación
Pruebas locales del caso principal: correctas. Falta probar el caso sin resultados y completar la revisión interna.

## Riesgos y recuperación
No integrar todavía: faltan esas comprobaciones. Se puede retirar el formulario revirtiendo este cambio.
```

En el borrador, conservar los pendientes es correcto; su estructura no significa que el cambio ya esté listo. Reviews de GitHub, QA y autorización siguen los gates existentes.

En proyectos de una sola persona, PR es una herramienta de protección/publicación, no el entorno de desarrollo. Fusionar directamente con `git merge` + `git push` cuando el gate lo permita; reservar PR para main protegida, cambios grandes, transversales, sensibles, de arquitectura, concurrencia real o release formal.

## `release formal`
Usar solo si el usuario pide version/release/tag o la SSOT local lo exige.

Contrato: resolver version con la fuente local documentada; decidir `major`, `minor` o `patch` con criterio conservador (`patch` fixes/docs/ajustes, `minor` capacidad nueva/skill o feature clara, `major` ruptura de contrato); crear tag cuando la politica local lo exija; actualizar fuente local de version solo si esta documentada; GitHub Release/notas cuando el hito lo justifique. Ante duda, elegir el nivel menor.

# Modo de cierre del experto (proactivo en ejecucion segura, conservador en operaciones sensibles)

La skill sigue siendo **POLITICA**: no ejecuta comandos git. El modo `autopiloto-de-cierre` es un modo de @experto-github para rutas no rutinarias; el guardado simple verde lo puede ejecutar @orquestador con Git Guardian, sin handoff adicional.

- **Que lo dispara**: @orquestador lo deriva para PR, conflicto, publicacion no rutinaria, gate rojo o una superficie sensible/formal.
- **Que hace el experto en el modo**: reconstruye estado, clasifica ownership y decide rama/PR/merge no rutinario. Si una tarea del supervisor esta `ready`, puede ejecutar `integrate-local --local-only` para integrar localmente cambios triviales/medios limpios. Release/tag, force push, borrado, merge grande/sensible u operacion irreversible siguen exigiendo autorizacion humana simple.
- **Que NO hace sin autorizacion humana simple**: release formal, tag, force push, borrado remoto, merge grande/sensible a `main`, cambios de auth/permisos/secretos/datos/RLS o cualquier operacion irreversible.
- **Distincion resultado vs bloqueo**: ejecucion segura = participio + evidencia ("Guardado", "Protegido", "Integrado"). Riesgo material = "bloqueado por X" + autorizacion o decision funcional necesaria, sin opciones de jerga.
- **Preferencia que lo media**: `suggest-on-close` (default `true`, desactivable por SSOT local). Si esta `false`, el sistema vuelve a modo conservador y no auto-guarda, pero los bloqueos de seguridad siguen intactos.

# Decision de publicacion

Para un guardado rutinario, basta identificar el lote propio, el gate y el resultado local/remoto. Antes de PR, release o una operacion sensible/formal, construir esta decision completa:

- **Tipo** (`listo para publicar` / `sync push` / `PR` / `release formal`) y **Estado/Gate** (`listo para mergear` / `listo para publicar` / `publicado` / `bloqueado` + motivo), **semaforo** con motivo, **rama** (actual y objetivo), **alcance** (cambios incluidos y bloques no relacionados), **commit** (unico o varios), **PR** (no aplica / draft / ready), **version/tag** (sin cambios o prevista), **validaciones** (hechas / requeridas / riesgo residual), **autorizacion** (`autopiloto seguro`, `humana simple requerida` o `bloqueada`).

Sin riesgo material, la decision rutinaria se ejecuta en `autopiloto seguro`. Si hay release formal, tag, borrado, force push, merge grande/sensible, secretos, auth/permisos/datos/RLS o irreversibilidad, la decision queda `bloqueada` hasta autorizacion humana simple.

## Alcance del veredicto y niveles de autonomia

El gate se calcula sobre el **lote propio** (las superficies que esta sesion declara con `--own`), no sobre el arbol entero. Lo ajeno fuera del lote se **excluye** del commit y se reporta como aviso; no bloquea guardado, publicacion ni cierre. Bloquean los riesgos incluidos en el lote, los residuos propios y los controles de lease, identidad y permisos. El numero de ramas es un aviso de mantenimiento (apartado `branch-limit` de [preferences.md](preferences.md)), nunca un veto por si solo.

| Nivel | Que es | ¿Se pregunta? |
|---|---|---|
| **Guardar local** | `commit` del lote: reversible, no sale del equipo | **Nunca** |
| **Publicar rutinario** | `push` a rama segura o PR segun tamano; visible en GitHub y reversible | **Nunca** si el gate esta verde |
| **Sensible o irreversible** | release formal, tag, force push, borrado remoto, reescritura de historia, merge grande/sensible a `main`, auth/permisos/secretos/datos/RLS | **Si**: un "si" simple en lenguaje llano |

Corolario: un bloqueo de nivel 1 o 2 sobre trabajo propio limpio es un **fallo de la herramienta**, no una decision pendiente del usuario. Se arregla el gate o se usa la via segura; **NEVER** se convierte en una pregunta de mecanica Git (ver anti-patron D7).

## Gate de coordinacion en rojo (`coordination-blocked`)

`coordination-blocked` es un blocker **de repositorio entero** y no se degrada por ser ajeno (a diferencia de `diff-necesita-reconciliacion` o `sensitive-surface`, que si son por ruta). La salida de texto solo dice `[BLOCK] coordination-blocked: repo`, asi que **no se concluye «hay que subir el arbol entero»** leyendola: las rutas culpables estan en el JSON.

- MUST leer el JSON antes de decidir: `python scripts/git_guardian.py --format json preflight` → `coordination_gate.issues[].path` (tipos como `surface-conflict` o `unreserved-change`).
- El lote declarado al guardar MUST caber en las **superficies admitidas** de tu lease. Si el lote crecio, se completa la admision (`python scripts/ai_coordination.py --root <repo> reserve --lease-id <lease> --fence <fence> --surface "write:<ruta>"`) o se acota `--own`, y se reintenta `save`.
- NEVER resolver un `coordination-blocked` con `git add`/`commit`/`push` a mano: eso es el bypass del gate, no su arreglo. Si la admision no se puede arreglar, la ruta es @experto-github, no la consola.
- El permiso del dueño para publicar **no cancela** secretos, alcance ni fence.

# Automata de transiciones del Estado/Gate

El `Estado/Gate` describe donde esta el trabajo en el flujo (eje distinto del `Tipo`). Estados y transiciones validas:

- `en progreso` -> `listo para mergear`: trabajo validado en rama y gate de merge satisfecho (MEDIO protegido en rama o GRANDE/SENSIBLE/RELEASE). TRIVIAL y MEDIO con main directo permitido saltan este estado.
- `listo para mergear` -> `listo para publicar`: tras merge autorizado en main local, cuando aun falta subir. Si el merge se ejecuta en GitHub y su resultado se comprueba en main remota, ya puede acreditarse `publicado` con destino main; declarar CI final pendiente si lo esta, sin repetir merge local ni afirmar terminado.
- `listo para publicar` -> `publicado`: tras comprobar el resultado en el remoto de la rama identificada, con autopiloto seguro o autorizacion humana simple cuando la operacion sea sensible/formal. Abrir un PR no incorpora su rama a main; aplicar el contrato de estados anterior y verificar el merge por separado.
- Cualquier estado -> `bloqueado`: semaforo rojo, validacion pendiente, exclusion por concurrencia abierta, riesgo sensible o falta de autorizacion humana para una operacion no rutinaria. `bloqueado` es terminal transitorio con motivo; se sale resolviendo el bloqueo.

`en progreso` es el estado por defecto previo a cualquier decision de gate (la IA aun no freno); NO se reporta en la salida auditable, que solo emite los 4 valores `listo para mergear` | `listo para publicar` | `publicado` | `bloqueado`.

Ambos campos (`Tipo`, `Estado/Gate`) aparecen **siempre** en la salida auditable. Coincidencia nominal: `listo para publicar` existe en los dos ejes (es el mismo hito conceptual, el freno pre-push); no es colision, es consistencia semantica.

# Semaforo de riesgo (con ejemplos)

Si dudas entre dos colores, usa el mayor. No uses rojo por rutina: debe haber riesgo real.

- **Verde:** cambio pequeno, coherente, bajo riesgo, rama correcta, validacion proporcional, sin version/tag. EJEMPLO fix typo en un archivo en main tras `sube los cambios`.
- **Amarillo:** diff amplio o cambios mezclados pero explicables, validacion parcial, rama candidata o PR recomendable. EJEMPLO varios commits de UI + docs en una rama `feature/x` despues de lint local.
- **Rojo:** release formal, tags/versionado, force push, conflictos, secretos, permisos, rama incoherente, operacion sensible, CI fallando o publicacion a medias. EJEMPLO release formal del hub, o push que toca RLS sin cierre de @especialista-seguridad.

# Cierre: evidencia proporcional

Guardado rutinario: basta comprobar lote propio, salida verde del Guardian y estado local/remoto. Para PR, release, conflicto o una operacion sensible/formal, @experto-github completa esta auditoria con evidencia:

- [ ] **Declaro** que reconstrui el estado real (`git status` + diff + rama + remoto + commits + tags + SSOT local) antes de clasificar, no solo memoria conversacional.
- [ ] **Declaro** que clasifique el **Tipo** de operacion (`listo para publicar`, `sync push`, `PR`, `release formal`) y el **Estado/Gate** de control (`listo para mergear`, `listo para publicar`, `publicado`, `bloqueado` + motivo), y que use `autopiloto seguro` solo cuando el gate este verde.
- [ ] **Declaro** que evite cada anti-patron listado arriba (auto-publicar, force push, commit mezclado sin avisar, saltar validaciones, borrar rama candidata), citando cual aplicaba a este caso concreto.
- [ ] **Declaro** que el gate de coordinacion (`scripts/ai_coordination.py`) esta resuelto o declarado pendiente con motivo, y que no estoy pisando superficies reservadas por otro lease.
- [ ] **Declaro** que revise higiene de ramas ([ramas.md](ramas.md)) y diff mezclado ([commits.md](commits.md)) antes de proponer commit/push/PR/release.
- [ ] **Declaro** que la salida devuelve tipo, semaforo, rama, commit, version, tag, PR, enlace, validacion y riesgo residual.
- [ ] **Declaro** el resultado del gate de segunda IA (ver abajo).

## Gate de segunda IA (OBLIGATORIO, no sugerencia)

El agente que prepara la publicacion no es el que la califica. Antes de cerrar:

- **`release formal`** -> delegar OBLIGATORIAMENTE a **@qa-validador** + **@revisor**.
- **Dif toca auth, permisos, secretos, RLS, datos personales o superficie publica sensible** -> escalar OBLIGATORIAMENTE a **@especialista-seguridad** antes de cualquier push/PR/release.
- **`PR ready`** -> delegar OBLIGATORIAMENTE a **@qa-validador** + **@revisor**.
- **`sync push` grande o transversal** -> delegar a **@qa-validador**.
- **Operacion destructiva (force push, borrar tag remoto, reescribir historia)** -> @especialista-seguridad + `ejecutar-operaciones-sensibles` + autorizacion explicita del usuario. Nunca por iniciativa propia.
- **`sync push` pequeno y verde** -> sin segunda IA obligatoria (no burocracia innecesaria).

# Flujo recomendado

- [ ] Leer SSOT local y [preferences.md](preferences.md) aplicando solo el alcance que corresponde.
- [ ] Reconstruir estado real Git/GitHub y coordinacion (leases, worktree).
- [ ] Separar politica comun, concrecion local y reglas hub-only ([hub-versionado.md](hub-versionado.md)).
- [ ] Detectar diff mezclado y coherencia de rama ([ramas.md](ramas.md), [commits.md](commits.md)).
- [ ] Revisar validacion local/CI proporcional.
- [ ] Emitir decision de publicacion; con gate verde ejecutar autopiloto seguro, y con riesgo material dejar `bloqueado` hasta autorizacion humana simple.
- [ ] Guardado rutinario: devolver resultado y evidencia minima. Para PR/release/sensible: resolver auditoria y segunda IA que correspondan.

# Criterio de resultado bueno

Cierre valido cuando la evidencia es proporcional al tipo y riesgo: un guardado rutinario no repite la auditoria completa; las rutas formales/sensibles cumplen el gate de auto-cita y la segunda IA que corresponda.

# Solo CerebroOperativoIA

Las reglas exclusivas del hub (versionado `vX.XX.XX`, `HUB_VERSION`, IDs `HUB-XXX`, prefijo `[vX.XX.XX]` en commits de release, `main` como rama diaria, `scripts/publish-hub.ps1`) y los 4 scripts auxiliares (`get-next-version.ps1`, `repo-setup.ps1`, `validate-branch-scope.ps1`, `validate-git-operation.ps1`) viven en [hub-versionado.md](hub-versionado.md). No se aplican a proyectos externos salvo que su SSOT los adopte explicitamente.

## Triggers
- Keywords: subir, push, publicar, github, commit, release, tag, version, sincronizar, sube, commitea, PR, pull request, descripcion de PR, integrar PR.
- Patrones de usuario: "sube los cambios", "haz push", "publica", "crea un repo", "haz un release", "commitea esto", "version nueva", "sincroniza con github", "crea un PR", "corrige la descripcion del PR", "integra este PR".
- Encadenamiento: despues de `revisar-cambios`, `validar-calidad` o `auditar-seguridad` cuando la publicacion lo requiera; antes de @experto-github como ejecutor; hermana de `configurar-testing` (CI) y `coordinar-sesiones-multi-ia` (leases/worktrees).

# Ejemplos de activacion

- "Configura GitHub para este proyecto."
- "Sube estos cambios sin sacar release."
- "Prepara una release formal siguiendo la SSOT local."
- "El usuario dijo ok; que hago ahora?" -> si el gate esta verde, `guardado/protegido`; si hay riesgo material, `bloqueado` con motivo.
