---
name: cerrar-sesion-chat
description: "Cerrar el chat con el trabajo propio protegido y retomable cuando el usuario dice 'cierro', 'otro chat' o 'hasta luego'. El cierre del chat es independiente de terminar la tarea, publicarla o activar DSH. TRIGGERS: cierro, cerrar chat, cerrar sesion, otro chat, hasta luego, terminar chat, adios, cierra la sesion, voy a cerrar, chat cerrado, no sigo, dejo el chat."
---

# Cerrar Sesion Chat

# Frontera y gate (LEER PRIMERO)

Esta skill ayuda a cerrar el chat sin poner en riesgo el trabajo propio. Cerrar el chat no declara por si solo que la tarea termino, se publico o esta activa en DSH.

- **MUST** revisar solo el lote, tarea y lease propios para decidir el estado de este chat.
- **NEVER** impedir que el chat termine por pendientes de otra tarea/sesion, leases caducados ajenos, turnos de publicacion ocupados o archivos fuera del lote propio.
- **NEVER** confundir `chat cerrado`, `tarea terminada localmente`, `publicado` (push y CI verde cuando aplique) y `runtime activo` (activacion/comprobacion del entorno).
- Un chat puede cerrarse con trabajo pendiente si queda guardado o preservado, el estado es honesto y existe una frase breve para retomarlo.
- El cierre del chat se comunica como publicación pendiente cuando el push aún no está verificado; eso no impide terminar el chat.
- **MUST** dejar "retoma TEAM_XXXX" cuando quede trabajo material por continuar; una tarea ya terminada no necesita frase de reanudacion.
- **NEVER** cerrar la tarea si no esta terminada: las tareas a medias se marcan en-curso `[~]` con lo que falta, nunca como cerradas.
- **MUST** vaciar al TODO los residuales materiales antes de terminar: lo que sobrevive al chat, no tiene dueno y cambia algo futuro queda anotado en `docs/TODO.md` (Rule 11) y el mensaje de cierre nombra esa entrada en una linea. Cuando **no** se anota, el cierre **nombra cual de las tres condiciones dejo fuera el residual**: el filtro no se puede cumplir callando. Filtro y destino, en `Residuales materiales: al TODO, no en prosa`.

Razon: el cierre del chat se bloqueaba por gates de tarea, publicacion o trabajo ajeno. Esta skill conserva un estado honesto y permite terminar el chat cuando el trabajo propio queda guardado o protegido.

# Objetivo

Permitir terminar el chat cuando el trabajo propio queda protegido y retomable. La publicacion de la tarea y la activacion del runtime son estados independientes.

# Alcance y limites
- Aplica cuando el usuario anuncia cierre de chat o sesion: "cierro", "otro chat", "hasta luego", "termino por hoy", "cierra la sesion" o equivalente.
- No sustituye a `coordinar-sesiones-multi-ia` (bootstrap, leases, worktrees y re-verificacion de P1) ni a `configurar-github` (publicacion real). Esta skill los referencia y orquesta: cierra el CHAT, no el repositorio.
- No aplica a consultas ligeras sin trabajo material: si no hay nada que inventariar ni documentar, el cierre es una respuesta corta en modo jefe, sin burocracia. El gate se aplica de forma **proporcional** al trabajo material existente: sin trabajo, no se crean TEAM ni frases de reanudacion por reflejo.
- No crea tags, releases, force push ni operaciones irreversibles: eso sigue en `configurar-github` y requiere autorizacion segun el riesgo.
- Si la sesion es de trabajo `normal` o `alto` con lease activo, el cierre debe pasar tambien por el cierre de sesion de Rule 26 (team file actualizado, gate, `close` del supervisor).

# Inputs / contexto obligatorio
- [Reglas globales compartidas](../docs/AI_GLOBAL_RULES.md) (Rule 27 semaforo de "listo", Rule 24 higiene, Rule 25/26 coordinacion).
- [SSOT del repositorio](../docs/SSOT.md) (rutas canonicas de `.teams`, regla de cierre de sesion).
- [Coordinar sesiones multi-IA](../coordinar-sesiones-multi-ia/SKILL.md) (Fase 3 team file, Fase 5 autopiloto de cierre, frase "retoma TEAM_XXXX").
- [Comunicar como jefe](../comunicar-como-jefe/SKILL.md) (contrato de salida visible).
- [Configurar GitHub](../configurar-github/SKILL.md) (gates de publicacion y autorizacion).
- Estado real: `git status --short`, `git log origin/<rama>..HEAD --oneline`, `.teams/active/`, `.questions/`, leases (`python scripts/ai_coordination.py status --view compact`).

# Comportamiento esperado

## Cierre proporcional

Cuando el usuario anuncia cierre de chat:

1. **Consulta o tarea sin material pendiente:** responde al cierre directamente. No inventes inventario, TEAM, lease ni publicacion.
2. **Trabajo material propio:** confirma el lote propio y su estado local/remoto. Si sigue abierto, actualiza solo su TEAM con la siguiente accion y la frase para retomarlo. El guardado rutinario pasa por Git Guardian con `--own`, sin handoff a @experto-github cuando el gate está verde; el trabajo ajeno se conserva y solo se avisa si cambia una decision.
3. **Lease propio:** termina el lease propio cuando su ejecucion acaba. Si falla, resuelve o registra la condicion de esa tarea; un lease viejo de otra sesion no bloquea. No ejecutes `reconcile` global como paso de cada cierre: es mantenimiento/diagnostico del supervisor. Si dejas trabajo vivo que otro chat debe continuar, la via es `takeover --by-order` (ver `coordinar-sesiones-multi-ia`).
4. **Reporte corto:** separa chat cerrado, tarea terminada, publicacion y runtime activo. La publicacion rutinaria usa autopiloto verde; las operaciones sensibles conservan su autorizacion.
5. **Residuales materiales:** pasa por el filtro lo que quede suelto y anota en el TODO lo que lo pase, antes de dar el cierre por bueno. No cambia los pasos 1-4: el cierre sigue sin depender de trabajo ajeno.

El chat puede cerrarse si el trabajo propio no queda expuesto a perdida inmediata y el mensaje no presenta como terminada/publicada una tarea que no lo esta. No se exige que todo el repositorio este limpio.

## Residuales materiales: al TODO, no en prosa

Rule 11 ya fija que el TODO es el roadmap vivo y Rule 27 que "listo" exige el TODO actualizado. Un momento para revisar el roadmap ya existia: `gestionar-roadmap` lo fija al cerrar una tarea que deje trabajo residual. Lo que faltaba era el momento del **cierre del chat** y el **filtro** que decide que merece entrada; esta skill aporta los dos. No se reescribe la regla, se ejecuta.

**El filtro (las tres, no una).** Una cosa merece entrada solo si:

- **sobrevive al chat** (no se resuelve sola en un rato),
- **no tiene dueno** (si otra sesion lo tiene, se nombra quien lo lleva),
- **cambia algo futuro** (una decision, un riesgo o un paso concreto).

Si falla una, **no hay entrada**: el cierre **nombra la condicion que la dejo fuera** ("ya tiene dueno: lo lleva otra sesion", "se resuelve solo en este rato"). Callar no vale como filtro: como las tres condiciones las juzga la propia IA, sin ese nombre el MUST se cumpliria sin anotar nada y nadie podria verificarlo desde fuera. Anotar por anotar convierte el TODO en un vertedero y le quita valor para priorizar.

**Donde va.** En `docs/TODO.md` del proyecto, respetando su formato y su dueno (`gestionar-roadmap`). **Busca antes de anadir**, para no duplicar una entrada existente. Si el proyecto no tiene `docs/TODO.md`, la IA **lo crea en la ubicacion mas razonable y deja constancia en `.teams/`** (Rule 11): el cierre nunca falla por eso.

**El guardado del TODO.** El guardado juzga por ruta entera, no por lineas: si el TODO tiene cambios sin confirmar de otra sesion, **no se mete en el lote** — se nombra la entrada y se deja declarada sin guardar, o se coordina la superficie. Solo en el hub, donde `docs/TODO.md` y las skills son ficheros gestionados, ese guardado necesita incluir en el lote el sello regenerado (`HUB_MANIFEST.json` y `AGENTS.md`; se regenera con `python scripts/refresh_hub_manifest.py . --batch <ruta>`, una vez por cada ruta del lote) o el pre-commit corta el guardado; si no se puede, la entrada queda declarada sin guardar.

**Como se dice al dueno.** El mensaje de cierre **nombra la entrada** (una linea) en vez de explicar el detalle; y cuando no hay entrada, **nombra la condicion del filtro que la excluyo**. Con eso el dueno lo verifica leyendo el mensaje, sin ninguna comprobacion tecnica. La prosa se reserva para los avisos y lo transitorio.

**Lo que NO cambia.** El cierre sigue sin depender de trabajo ajeno ni de que el TODO se pueda escribir: si el fichero no se puede tocar, o su guardado queda declarado sin hacer, se dice y el chat termina igual. Una tarea terminada sigue sin necesitar frase de reanudacion; los estados local/publicado/activo siguen separados.

Razon: sin este paso la IA cierra soltando al dueno un parrafo de residuales que el tiene que descifrar, y lo importante no llega a la lista que usa para priorizar.

## Semaforo de estados (Rule 27)

| Estado | Significado |
|--------|-------------|
| `listo` / `terminado` | commiteado + pusheado + CI verde + TODO actualizado |
| `hecho localmente (pendiente publicar)` | cambios commiteados o no, sin push verificado |
| `commiteado sin push` | commit local pendiente de subir |
| `pendiente de CI` | pusheado, CI aun no verde |
| `bloqueado` | estado de la tarea cuando un riesgo propio material impide avanzar; no significa por si solo que el chat no pueda terminar |

## Anti-patrones y su correccion

- **Confundir chat y tarea:** MAL decir que la tarea esta terminada porque el chat acaba. BIEN cerrar el chat dejando la tarea como local, pendiente de publicar o en curso, segun evidencia.
- **Reconciliar todo para cerrar uno:** MAL llamar `reconcile` en cada chat y trasladar sus `pending` al usuario. BIEN comprobar solo la tarea/lease propios; el monitor conserva la reconciliacion global.
- **Cierre en falso:** MAL decir "listo, cerrado" con commits sin push o trabajo a medias. BIEN nombrar el estado real ("commiteado sin push", "queda X") y dejar el semaforo honesto. EJEMPLO "he terminado y esta todo en GitHub" cuando `git log origin/main..HEAD` muestra commits locales -> P1: el estado remoto es `pendiente`.
- **Cerrar la tarea sin terminar:** MAL marcar `[x]` una tarea a medias por dejarla "bien documentada". BIEN marcar `[~]` con lo que falta y la frase de reanudacion. EJEMPLO tarea al 80% -> `[~] falta validar el flujo de stock`.
- **Sin frase de reanudacion:** MAL cerrar un chat con trabajo material sin actualizar `## Reanudar en otro chat`. BIEN dejar "retoma TEAM_XXXX" con estado, siguiente accion y superficies. EJEMPLO "Puedes abrir otro chat y decir: 'retoma TEAM_0155'".
- **Documentar por reflejo:** MAL crear TEAM o frases de reanudacion "por si acaso" cuando no hay trabajo material (consulta ligera). BIEN aplicar el gate de forma proporcional: sin trabajo, respuesta corta en modo jefe sin artefactos. EJEMPLO un chat de solo consultas -> "no hay nada que documentar; hasta luego".
- **Residuales en prosa:** MAL cerrar soltando al dueno un parrafo de residuales que el tiene que descifrar. BIEN anotar en el TODO lo que pasa el filtro y nombrar la entrada en una linea; la prosa se queda para lo que no merece nota. EJEMPLO "queda anotado en el TODO del proyecto; el resto era transitorio" en vez de tres parrafos de contexto.
- **Filtro en silencio:** MAL cerrar sin anotar nada y sin decir por que, dando por hecho que "no paso el filtro": asi el MUST se cumple solo y nadie puede verificarlo. BIEN nombrar la condicion que dejo fuera el residual. EJEMPLO "queda fuera: ya tiene dueno, lo lleva otra sesion" en vez de callar.
- **Drift ajeno mezclado:** MAL commitear cambios ajenos o no atribuidos "para dejarlo limpio". BIEN preservarlos; investiga o aísla solo si afectan a tu superficie o impiden establecer el lote propio. EJEMPLO cambio ajeno en otro paquete -> se conserva y no bloquea el cierre de este chat.
- **Frenar el cierre por estado ajeno:** MAL reportar "tengo mis cambios sin subir y veo otros cambios sin subir, ¿que hago?" o dejar el cierre en `bloqueado` porque el arbol tiene ficheros de otras sesiones. BIEN guardar el lote propio con `git_guardian.py save --own <tus superficies>`: el guardian juzga solo tu lote, ignora lo ajeno y lo nombra como aviso; despues publicar si el gate esta verde y reportar el estado real. EJEMPLO arbol con 60 ficheros ajenos sucios y 3 propios -> se guardan los 3 y se sigue; lo ajeno se nombra, no se pregunta.
- **Reporte tecnico:** MAL pegar hashes, leases, ramas y rutas en el mensaje visible. BIEN reporte en modo jefe: estado, que queda y siguiente paso. EJEMPLO "queda subir los cambios; di 'retoma TEAM_0155' para continuar" en vez del log de comandos.

# Flujo recomendado
- [ ] Sin trabajo material **y sin residuales que pasen el filtro**: despedida breve, sin gates adicionales.
- [ ] Con trabajo material: revisar y guardar/preservar solo el lote propio; dejar un estado retomable si corresponde.
- [ ] Con residuales materiales: anotar en el TODO lo que pase el filtro (las tres condiciones) y nombrar la entrada en el mensaje de cierre; lo que no lo pase, nombrar la condicion que lo excluyo.
- [ ] Cerrar solo el lease propio; dejar la reconciliacion global al monitor o a un diagnostico solicitado.
- [ ] Separar chat cerrado, tarea terminada, publicacion y runtime activo.

# Cierre: evidencia mínima

Para un cierre material, comprobar y comunicar internamente solo lo necesario:

- [ ] La tarea y el lease comprobados son los propios; lo ajeno queda intacto y no bloquea el chat.
- [ ] El estado local, de publicacion y de runtime es cierto; si hay trabajo retomable, el TEAM da el siguiente paso.
- [ ] Las operaciones sensibles y los gates de publicacion conservan sus autorizaciones y evidencia.
- [ ] Los residuales materiales que pasan el filtro quedan anotados en `docs/TODO.md` y el mensaje de cierre **nombra el identificador de la entrada**; los que no lo pasan no generan entrada y el cierre **nombra la condicion del filtro que los excluyo**. Una de las dos cosas, siempre.

## Revision adicional solo cuando aporta una comprobacion distinta

Una consulta, un guardado rutinario o una ruta directa no necesita una segunda revision independiente por defecto. Usa @experto-github para PR, conflicto, publicacion sensible o gate rojo; usa @revisor/@qa-validador cuando lo exija la ruta planificada o el riesgo. No dupliques un gate verde.

# Criterio de resultado bueno

Cierre valido cuando el estado del chat es honesto y el trabajo propio queda protegido o retomable. "Publicado" requiere evidencia remota y CI cuando aplique; "activo en DSH" requiere activacion y comprobacion del runtime.

## Triggers
- Keywords: cierro, cerrar chat, cerrar sesion, otro chat, hasta luego, terminar chat, adios, cierra la sesion, voy a cerrar, chat cerrado, no sigo, dejo el chat, retoma, frase de reanudacion, cierre de sesion, avance de cierre, boletin
- Patrones de usuario: "Cierro el chat, deja todo documentado", "Voy a abrir otro chat, que no se pierda nada", "Hasta luego, dejalo todo subido", "Termino por hoy, retoma TEAM_XXXX manana", "Cierra la sesion pero sin cerrar la tarea"
- Encadenamiento: despues de `coordinar-sesiones-multi-ia` (bootstrap/leases) y antes de `configurar-github` o `@experto-github` (publicacion); hermanas `comunicar-como-jefe` (reporte visible), `handoff-y-pendientes` (reporte de pendientes al retomar)

# Ejemplos de activacion
- "Voy a cerrar este chat, deja todo subido y documentado."
- "Cierro, pero la tarea del carrito no esta terminada; dejalo anotado para continuar en otro chat."
- "Hasta luego. Si abro otro chat, que me diga que falta con 'retoma TEAM_0155'."
- "No sigo con esto hoy; guarda el progreso sin publicar nada."
