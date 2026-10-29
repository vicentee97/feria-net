---
name: handoff-y-pendientes
description: "Reporte proactivo de pendientes al abrir un chat nuevo o preguntar 'que queda a medias': escanea .teams/active, git status, leases, ramas, boletin y TODO; reporta en modo jefe con tabla clara, lenguaje facil y recomendacion proactiva, ofreciendo cerrar pero NUNCA cerrando sin preguntar. TRIGGERS: pendientes, que queda a medias, a medias, retomar, handoff, donde estamos, que falta, que hay abierto, resumen de estado, continuar trabajo, boletin, avances de otras sesiones, resumen de sesiones."
---

# Handoff Y Pendientes

# Frontera y regla dura (LEER PRIMERO)

Esta skill responde a "¿que queda a medias?" y al arranque de un chat nuevo. Su proposito: dar al usuario una vista clara y humana de lo que hay abierto, con recomendacion proactiva, sin convertir el resumen en un volcado tecnico.

- **MUST** escanear las fuentes reales (`.teams/active/`, `git status`, leases, ramas, `docs/TODO.md`) antes de reportar.
- **MUST** reportar en modo jefe: lenguaje facil, tabla o lista clara, y una recomendacion proactiva al final.
- **MUST** ofrecerse a cerrar lo que este a medias ("¿sabes donde esta ese chat? Si no lo sabes, yo puedo cerrarte esto. Mi recomendacion es...") cuando exista trabajo retomable.
- **NEVER** cerrar ni archivar un chat sin preguntar antes al usuario. Esta skill reporta y ofrece; el cierre lo ejecuta `cerrar-sesion-chat` con su gate.
- El guardado y la publicacion **rutinaria** de trabajo propio no son un cierre ni una decision del usuario: los decide y ejecuta el autopiloto seguro de `configurar-github` (`git_guardian.py`). Solo las operaciones sensibles de esa lista piden un "si" simple.
- **NEVER** pegar hashes, leases, rutas absolutas ni IDs de equipo en el mensaje visible salvo que el usuario los pida o cambien una decision (contrato de `comunicar-como-jefe`).
- **MUST** sacar el reporte del TODO antes que de la memoria del chat: primero lo que ya esta anotado en `docs/TODO.md`, y lo que la sesion encuentre y pase el filtro de `cerrar-sesion-chat` se **anota** alli (Rule 11) en vez de quedarse en la conversacion; lo que no lo pase no genera entrada y el reporte **nombra la condicion que lo excluyo**.

Razon: el usuario trabaja con varias pestanas de OpenCode y varias IAs a la vez. Sin esta skill, cada chat responde los pendientes desde su memoria conversacional, en lenguaje tecnico y sin recomendacion. El resultado es descontrol al retomar.

# Objetivo

Producir, en cualquier chat, un reporte de pendientes veraz, estructurado y accionable: que hay abierto, que hay a medias, que hay sin subir, y que recomienda la IA hacer a continuacion, ofreciendo cerrar sin cerrar por su cuenta.

# Alcance y limites
- Aplica al abrir un chat nuevo con trabajo previo o al preguntar "que queda a medias", "que hay pendiente", "que falta", "donde estamos".
- No sustituye a `coordinar-sesiones-multi-ia` (leases, worktrees, reconciliacion de drift) ni a `revisar-todo` (auditoria de drift del roadmap vs git): esta skill agrupa estado para el usuario; aquellas resuelven el estado.
- No ejecuta cierres de chat: ofrece y espera confirmacion. El cierre confirmado deriva a `cerrar-sesion-chat`. (El guardado rutinario de trabajo propio no es un cierre de chat: lo ejecuta el autopiloto, sin pregunta.)
- No aplica a sesiones sin trabajo material (consulta pura): en ese caso el reporte es "no hay nada a medias" en una linea.
- Si hay cambios ajenos o indeterminados, se reportan como tales y se recomienda reconciliacion (Rule 26), sin etiquetarlos como propios ni ajenos por suposicion.

# Inputs / contexto obligatorio
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md) (Rule 25/26 coordinacion, Rule 24 higiene, Rule 27 semaforo de "listo").
- [SSOT del repositorio](../docs/SSOT.md) (rutas canonicas: `.teams/`, `docs/TODO.md`).
- [Comunicar como jefe](../comunicar-como-jefe/SKILL.md) (contrato de salida visible, tabla clara, max 3 preguntas).
- [Coordinar sesiones multi-IA](../coordinar-sesiones-multi-ia/SKILL.md) (estado de leases y worktrees).
- [Cerrar sesion chat](../cerrar-sesion-chat/SKILL.md) (gate de cierre que se ofrece ejecutar tras confirmacion).
- Fuentes a escanear: `git status --short`, `git log origin/<rama>..HEAD --oneline`, `.teams/active/`, `.teams/INDEX.md`, `.questions/`, `docs/TODO.md`, `python scripts/ai_coordination.py status --view summary` (sesiones significativas, leases, worktrees, ultimos avances del boletin por tema y la seccion `Pendientes de decision (requieren revision humana)` del resumen), y el listado de respaldos (`scripts/list-backups.ps1`).
- Para cada trabajo con codigo o interfaz, consultar tambien su contexto de
  testabilidad (`status`/`verify-context`): distinguir "probable por la IA"
  de "probable por el usuario", indicar la carpeta oficial o aislada, el
  entrypoint y las dependencias que faltan. Nunca convertir una carpeta
  aislada en instrucciones para abrir el `dev.bat` oficial.

# Comportamiento esperado

## Escaneo (fuentes reales, en este orden)

1. `git status --short`: cambios sin commitear, rama actual y estado de sincronizacion (`commits_ahead`/`behind` si el supervisor lo reporta).
2. `git log origin/<rama>..HEAD --oneline`: commits locales sin push (estado remoto `pendiente`).
3. `.teams/active/`: teams abiertos o recientes; leer su `## Reanudar en otro chat` cuando exista.
4. Sesiones, leases, worktrees y avances: `ai_coordination.py status --view summary` (tareas activas de otras sesiones, sesiones significativas con nombre, ultimos avances del boletin por tema y la seccion `Pendientes de decision (requieren revision humana)` con las zonas que el supervisor no puede limpiar sola y su motivo en lenguaje claro). De aqui salen tambien los **restos sin dueno vivo** (carpetas de trabajo o ramas que nadie reclama y cuyo trabajo ya esta integrado), que se **nombran traducidos** —que son, no su hash— y se **ofrecen** para retirar, con la recomendacion marcada.
5. `docs/TODO.md`: entradas En Curso / Siguientes / Bloqueados relevantes.
6. `.questions/`: dudas abiertas que condicionen el siguiente paso.
7. `scripts/list-backups.ps1`: respaldos disponibles (ver seccion `Respaldo`).

## El reporte sale del TODO

El reporte no se redacta desde la memoria del chat: **primero lo que ya esta anotado** en `docs/TODO.md` (En Curso, Siguientes y Bloqueados), completado con el estado real que devuelve el escaneo de arriba.

Ademas, lo que esta sesion encuentre y pase el filtro de `cerrar-sesion-chat` (sobrevive al chat / no tiene dueno / cambia algo futuro) **se anota** en ese mismo `docs/TODO.md`, con su id y respetando su formato y su dueno (`gestionar-roadmap`); lo que no lo pase no genera entrada y **el reporte nombra la condicion que lo excluyo**. Busca antes de anadir, para no duplicar. Rule 11 es la que lo exige; esta skill aporta el momento del reporte. Si el proyecto no tiene `docs/TODO.md`, la IA **lo crea en la ubicacion mas razonable y deja constancia en `.teams/`** (Rule 11): el reporte nunca falla por eso. El guardado de esa entrada sigue la regla de `cerrar-sesion-chat` (ruta entera, y sello del hub cuando el TODO es fichero gestionado).

Esto no cambia la oferta de cierre: se sigue ofreciendo y **nunca** se cierra ni se archiva nada sin preguntar.

## Reporte en modo jefe

Estructura visible (max ~30 lineas salvo peticion de detalle):

1. **Conclusion (1-3 lineas)**: "Hay 2 tareas a medias y 1 commit sin subir" o "No hay nada a medias".
2. **Tabla clara** con columnas: Que / Estado / Donde (en lenguaje facil, sin rutas crudas) / Que falta. Ejemplo:

| Que | Estado | Que falta |
|-----|--------|-----------|
| Cierre de chat multi-IA (TEAM_0155) | en curso | validar y subir |
| Movil TPV-048 | cerrado | nada |
| Caja: historico de stock | a medias | pantalla de consulta |
| Avance de reservas (hoy, otra sesion) | en curso | fase 2 backend completada, falta UI |

En trabajos comprobables, el estado debe añadir una línea breve: `Prueba:
IA sí/no · usuario sí/no · carpeta oficial/aislada · comando disponible o
faltan <rutas>`. Si el usuario aún no puede probar, la frase visible fija es:
"Todavía no puedes probarlo: la versión está en una carpeta aislada o el
entorno no está preparado".

Los avances del boletin de otras sesiones entran en la tabla como filas `Que` (con su autor o tema), de modo que el jefe no tenga que relatar "que hace la otra ventana".

Los **restos sin dueno vivo** entran como filas de la tabla, **traducidos** (que son y de que trabajo salieron, nunca su hash) y con la **oferta de retirarlos** en la recomendacion, cuando su trabajo ya esta integrado y nadie trabaja en ellos; si falta algo, solo se nombran.

3. **Recomendacion proactiva**: una accion concreta recomendada por la IA, con su motivo breve.
4. **Oferta de cierre** cuando aplique: "¿Sabes donde esta ese chat? Si no lo sabes, yo puedo cerrarte esto. Mi recomendacion: retomar TEAM_0155 y cerrar el lote. Lo hago?"
5. **Avisos transversales del resumen** (si aplican, en 1 linea cada uno, antes de la tabla): las lineas de salud del supervisor (`ultimo error: ...` / `monitor sin ejecucion reciente`) y la linea de paralelismo (P5): si el summary muestra sesiones significativas de OTRAS ventanas con superficies write, anadir "otras ventanas trabajando en paralelo: X (no veras sus cambios hasta integrarse)".

## Ventanas cerradas a lo bruto

Cuando la seccion `Pendientes de decision` del summary muestre zonas con cambios sin commitear (el supervisor las etiqueta con su `dirty_count` y el nombre de la sesion), el jefe no sabe que esas ventanas existen:

- Traducir cada zona sucia a una fila de la tabla con la frase fija: "sesion X (ruta) dejo cambios sin commitear; di 'recupera X'". Los datos (sesion, ruta) ya los provee el supervisor; esta skill solo los traduce a lenguaje llano.
- La frase invita a la recuperacion, NUNCA a la auto-limpieza: los cambios sin commit son trabajo que puede ser valioso; solo el jefe decide que hacer con ellos.

## Respaldo

Los backups existen pero nadie dice como pedirlos; esta skill hace visible la recuperacion:

- Ejecutar `scripts/list-backups.ps1` (copia local del proyecto si existe; si no, la del hub resuelto por `.cerebro-operativo/hub-path.txt`) al escanear.
- Si hay respaldos listados, mencionarlos en una linea del reporte (que hay y de cuando).
- Cerrar siempre con la frase fija: "si echas de menos algo, di 'recupera <X>'", donde `<X>` es el respaldo o elemento en cuestion.
- La recuperacion real la ejecuta `scripts/restore-backup.ps1` (ya existe; esta skill solo lo enlaza y traduce).

## Reglas de la oferta de cierre

- **MUST** preguntar antes de cerrar o archivar un chat.
- **NEVER** preguntar mecanica Git rutinaria: el guardado y la publicacion rutinaria de trabajo propio los decide y ejecuta el autopiloto de `configurar-github` (commit atomico, push a rama segura o PR segun el gate), sin trasladar la decision al usuario. Las operaciones sensibles si piden un "si" simple.
- **NEVER** cerrar por inercia porque "el reporte ya estaba claro" o porque el usuario pregunto pendientes.
- Si el usuario confirma el cierre, activar `cerrar-sesion-chat` y ejecutar su gate completo.
- Si el usuario no sabe donde esta el otro chat, ofrecerlo explicitamente con la recomendacion, sin tecnicismos.

## Anti-patrones y su correccion

- **Volcado tecnico:** MAL pegar `git status` crudo, hashes, leases o rutas. BIEN traducir a tabla funcional con estado y que falta. EJEMPLO "2 cambios locales sin subir" en vez de la lista de archivos con hashes.
- **Reporte sin recomendacion:** MAL listar pendientes y callar. BIEN cerrar con una recomendacion proactiva ("Mi recomendacion: X, porque Y. Lo hago?"). EJEMPLO "recomiendo cerrar el lote de la caja antes de empezar lo nuevo".
- **Cierre sin preguntar:** MAL ofrecer "puedo cerrarlo" y proceder por reflejo. BIEN preguntar siempre y esperar confirmacion explicita. EJEMPLO "¿Lo cierro yo? Es lo que recomiendo" y parar hasta que el usuario diga si. Aplica al CIERRE del chat; el guardado rutinario del trabajo propio no se pregunta.
- **Preguntar mecanica Git (D5, drift trap):** MAL cerrar el reporte con "¿subo a git?", "¿hago commit?", "veo cambios de otras sesiones sin subir, ¿que hago?". BIEN guardar/publicar con el autopiloto cuando el gate esta verde y reportar el resultado en lenguaje llano (`guardado`, `protegido`, `publicado`, `remoto pendiente`); si el arbol tiene cambios de otras sesiones, se nombran como zonas ajenas y NO se convierten en una pregunta al usuario.
- **Inventar pendientes:** MAL reportar desde memoria conversacional sin escanear fuentes. BIEN escanear primero, partir de lo ya anotado en `docs/TODO.md` y anotar lo que pase el filtro; reportar solo lo verificado. EJEMPLO si el TEAM dice en curso pero git esta limpio, reportar "tarea abierta, sin cambios locales".
- **Falso positivo de cierre:** MAL decir "todo cerrado" con commits sin push. BIEN nombrar el estado real segun Rule 27 ("commiteado sin push", "hecho localmente (pendiente publicar)").

# Flujo recomendado
- [ ] Escanear las 7 fuentes (git status, commits sin push, teams, sesiones/leases/boletin via summary, TODO, questions, respaldos via list-backups.ps1).
- [ ] Partir de lo ya anotado en `docs/TODO.md` y anotar lo que la sesion encuentre y pase el filtro (Rule 11); nombrar la condicion de lo que no lo pase.
- [ ] Construir la tabla en lenguaje facil: Que / Estado / Que falta.
- [ ] Redactar conclusion (1-3 lineas) y recomendacion proactiva.
- [ ] Ofrecer cierre de chat cuando aplique, con pregunta explicita y sin proceder; el guardado/publicacion rutinaria lo ejecuta el autopiloto sin pregunta.
- [ ] Si el usuario confirma el cierre, derivar a `cerrar-sesion-chat`.
- [ ] Resolver el gate de auto-cita de abajo antes de dar el reporte por bueno.

# Cierre OBLIGATORIO: gate de auto-cita

Antes de declarar el reporte de pendientes entregado, declarar (auto-cita con evidencia, no auto-evaluacion). Maximo 7 items:

- [ ] **Declaro** que escanee las fuentes reales (git status, commits sin push, `.teams/active/`, sesiones/leases/boletin via `status --view summary`, TODO, questions, respaldos via `list-backups.ps1`) y que el reporte refleja datos verificados, no memoria conversacional: parte de lo ya anotado en `docs/TODO.md`, lo que encontre y paso el filtro quedo anotado alli (Rule 11) y, si algo no lo paso, el reporte nombra la condicion que lo excluyo.
- [ ] **Declaro** que el visible sigue el contrato de `comunicar-como-jefe` (conclusion primero, tabla clara, lenguaje facil, sin hashes/leases/rutas salvo que cambien una decision) y que los estados usan el semaforo de Rule 27 (listo / hecho localmente (pendiente publicar) / commiteado sin push / bloqueado), sin falso "todo cerrado".
- [ ] **Declaro** que incluí una recomendacion proactiva con motivo breve.
- [ ] **Declaro** que ofreci cierre solo cuando existia trabajo retomable y que NO cerré ni archivé ningun chat sin confirmacion del usuario; y que el guardado/publicacion rutinaria de trabajo propio siguio el autopiloto de `configurar-github` en vez de convertirse en una pregunta tecnica.
- [ ] **Declaro** que evite cada anti-patron de arriba (volcado tecnico, sin recomendacion, cierre sin preguntar, inventar pendientes, falso positivo), citando cual aplicaba a este reporte.
- [ ] **Declaro** que si el usuario confirmo un cierre, derivé a `cerrar-sesion-chat` con su gate completo.
- [ ] **Declaro** que no recomendé abrir `dev.bat` sin comprobar antes la carpeta oficial, la revisión y el estado "probable por el usuario".

# Criterio de resultado bueno

Reporte valido cuando el gate de auto-cita de arriba se cumple con evidencia observable. Esta seccion no anade reglas: es el mirror declarativo del gate, repetido aqui solo porque `validate-hub-skills.ps1` exige el header. La senal observable: el usuario entiende en una tabla que hay, que falta y que hacer, recibe una recomendacion y decide libremente si se cierra algo.

## Triggers
- Keywords: pendientes, que queda a medias, a medias, retomar, handoff, donde estamos, que falta, que hay abierto, resumen de estado, continuar trabajo, que se quedo pendiente, hay algo a medias, estado del proyecto, boletin, avances de otras sesiones, resumen de sesiones
- Patrones de usuario: "Que queda a medias?", "Abro chat nuevo, donde estavamos?", "Hay algo pendiente de la otra sesion?", "Que tareas hay abiertas?", "Resumeme el estado antes de seguir", "Vengo de otro chat, que falta?"
- Encadenamiento: antes ninguna (es bootstrap de reporte); despues `cerrar-sesion-chat` si el usuario confirma cerrar; hermanas `coordinar-sesiones-multi-ia` (reconciliar leases), `revisar-todo` (auditar drift del roadmap), `comunicar-como-jefe` (formato visible)

# Ejemplos de activacion
- "Abro un chat nuevo en el proyecto. Que queda a medias?"
- "Que ha avanzado la sesion de reservas hoy?" (responder citando el boletin del summary)
- "Hay algo pendiente de la sesion de ayer? Donde estamos?"
- "Que tareas hay abiertas y que recomiendas cerrar?"
- "Vengo de otro chat y no recuerdo que faltaba; resumeme el estado."
