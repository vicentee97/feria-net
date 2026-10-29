# Preferencias acumuladas - Configurar GitHub

Este archivo almacena preferencias personales confirmadas para operaciones de Git, GitHub y nomenclatura asociada.

Cada preferencia debe declarar su alcance:
- `global`: aplica a cualquier repositorio salvo contradiccion de la SSOT local.
- `si SSOT local lo define`: aplica solo si el proyecto documenta esa convencion o fuente.
- `solo CerebroOperativoIA`: aplica solo al hub.

Si una preferencia referencia archivos o convenciones que no existen en el proyecto actual, no debe obedecerse literalmente; se trata como no aplicable y se reporta si afecta a la decision.

## commit-format
- Alcance: global.
- Regla: Usa commits con formato `[vX.XX.XX] <tipo>: <resumen>` solo cuando la release formal del proyecto documente ese prefijo; en `sync push`, PR ordinario o cambios sin version formal usa `<tipo>: <resumen>` sin prefijo versionado.
- Cuando aplica: Al proponer o redactar mensajes de commit.
- Ejemplo: Release con prefijo local: `[v1.04.08] feat: anade validador de memoria`; sync push: `feat: anade validador de memoria`.
- Advertencia: Usar prefijos versionados en commits de sync puede generar ruido en el historial y confundir la trazabilidad de releases reales.
- Ultima confirmacion: 2026-05-05

## safe-autopilot-on-close
- Alcance: global.
- Regla: Una validacion funcional (`ok`, `funciona`, `perfecto`, `esta bien`) autoriza a la IA a guardar y proteger trabajo rutinario con `scripts/git_guardian.py`: commit atomico y publicacion en el destino permitido por [ramas.md](ramas.md), incluido main rutinario cuando proceda, o rama/PR si el gate lo pide. La IA no pregunta mecanica Git rutinaria. Release formal, tags, force push, borrado remoto, merge grande/sensible a `main`, secretos, auth/permisos/datos/RLS y operaciones irreversibles siguen exigiendo autorizacion humana simple.
- Cuando aplica: Al cerrar cualquier ciclo de desarrollo normal.
- Ejemplo: Tras `ok, funciona bien`, si el gate esta verde, ejecutar la ruta permitida y responder `incorporado a main en GitHub` o `subido a una rama; falta incorporar`, segun evidencia; si toca secretos o release, responder `bloqueado por riesgo real` y pedir autorizacion simple.
- Advertencia: La automatizacion solo cubre decisiones tecnicas reversibles; bloquea cambios o residuos propios sin resolver, CI rojo obligatorio, secretos, lease incompatible o superficie sensible del lote. Los archivos ajenos separables quedan excluidos y se avisan, sin impedir guardar o cerrar el lote propio.
- Ultima confirmacion: 2026-07-05

## commit-context-source
- Alcance: global.
- Regla: Antes de redactar un commit, revisa `git status` y `git diff`; si existe un TEAM activo en `.teams/`, usalo tambien. Si no existe `.teams/`, no bloquees y reporta `sin TEAM verificable` solo cuando afecte a trazabilidad.
- Cuando aplica: Justo antes de crear commits, tanto en autopiloto seguro como en publicacion pedida explicitamente.
- Ejemplo: Leer `.teams/TEAM_007_...` cuando exista, revisar el diff y redactar el resumen final con fuentes reales.
- Advertencia: Depender de archivos de equipo puede ser contraproducente si el archivo esta obsoleto o fue editado por otra sesion de IA sin contexto completo.
- Ultima confirmacion: 2026-03-14

## commit-link-after-push
- Alcance: global.
- Regla: Tras publicar cambios en GitHub, comparte siempre el enlace directo al commit generado y, si existe, tambien el enlace al tag o release.
- Cuando aplica: Despues de cada `git push`, PR o release.
- Ejemplo: `https://github.com/usuario/repositorio/commit/<sha>` y, si aplica, `https://github.com/usuario/repositorio/releases/tag/v1.04.08`.
- Advertencia: Compartir enlaces publicos de repositorios privados puede filtrar informacion si el destinatario no tiene acceso.
- Ultima confirmacion: 2026-03-21

## sync-vs-release-default
- Alcance: global.
- Regla: Si el usuario pide subir cambios pero no habla explicitamente de version, release o tag, tratalo por defecto como `sync push`; usa `release formal` solo cuando el usuario lo pida de forma inequivoca o la SSOT local lo exija.
- Cuando aplica: Antes de clasificar cualquier `commit`, `push`, PR o release.
- Ejemplo: `Sube esto a GitHub` => `sync push`; `Publica la version` => `release formal`.
- Advertencia: Clasificar un release como sync push por omision puede omitir pasos de validacion formal requeridos por la SSOT.
- Ultima confirmacion: 2026-03-23

## git-output-minimum
- Alcance: global.
- Regla: Tras cualquier push, PR o release, conservar tipo, rama, commit, version, tag y PR en el informe interno. En la respuesta visible aplicar el contrato de estados de SKILL.md: destino verificado, incorporacion o pendiente, comprobaciones y enlace util; sin volcar hashes/version/tag por rutina.
- Cuando aplica: En la respuesta final despues de operaciones Git/GitHub.
- Ejemplo: "Incorporado a main en GitHub; copia local actualizada y pruebas aprobadas", con enlace al resultado. Una rama subida se comunica como "aun no incorporada a main".
- Advertencia: Incluir metadatos exhaustivos en cada respuesta puede alargar la salida y distraer del foco tecnico.
- Ultima confirmacion: 2026-10-01

## branch-naming
- Alcance: global.
- Regla: Usa nombres de rama en kebab-case y con prefijo semantico corto cuando haya que proponer una rama nueva.
- Cuando aplica: Al sugerir o crear ramas para cambios nuevos.
- Ejemplo: `feature/memoria-por-skill`.
- Advertencia: Kebab-case semantico puede no alinearse con convenciones de equipo ajenas al hub; verificar antes de imponerlo.
- Ultima confirmacion: 2026-03-14

## pr-language
- Alcance: global.
- Regla: Redacta titulos y cuerpos de PR en el mismo idioma dominante del repositorio o el pedido explicito del usuario.
- Cuando aplica: Al proponer texto de PR o plantillas de descripcion.
- Ejemplo: `Resumen: anade memoria acumulativa por skill`.
- Advertencia: Redactar en espanol en repositorios dominados por otro idioma puede confundir a contribuyentes externos.
- Ultima confirmacion: 2026-03-14

## solo-work-pr-policy
- Alcance: global.
- Regla: En proyectos de una sola persona, el control se gradua por tamano sin mover el desarrollo local por defecto. Primero se implementa en el workspace activo para que el usuario pueda probar; al cierre Git Guardian decide: TRIVIAL -> `main` directo; MEDIO -> guardar/proteger con rama efimera solo si aporta control o main lo exige, con gate `listo para mergear`; GRANDE/sensible/release -> PR obligatorio. No PR/worktree por burocracia en triviales ni medios pequenos; PR donde el riesgo o la proteccion de rama lo exige.
- Cuando aplica: Al decidir entre seguir en workspace local, push directo, rama de proteccion o PR.
- Ejemplo: Un fix de menu en solitario se cambia en el workspace local y se prueba en navegador; si el diff final es medio y main no esta protegida, puede guardarse/mergearse sin PR; un refactor transversal o una release formal va por rama + PR.
- Advertencia: Omitir PRs en cambios grandes de una sola persona pierde la oportunidad de revision futura y dejar rastro de decisiones.
- Ultima confirmacion: 2026-07-08

## git-metadata-language
- Alcance: global.
- Regla: Redacta siempre en espanol los mensajes de commit, titulos de PR, cuerpos de PR y explicaciones de publicacion, salvo que el usuario pida explicitamente otro idioma.
- Cuando aplica: Al preparar commits, PRs o cualquier texto asociado a Git/GitHub.
- Ejemplo: `fix: corrige contraste del modo claro`.
- Advertencia: Espanol en metadatos de Git puede romper scripts de CI/CD o herramientas de parsing que esperan ingles.
- Ultima confirmacion: 2026-03-21

## push-all-pending-changes-on-request
- Alcance: global.
- Regla: Si el usuario pide subir o publicar los cambios, incluye por defecto el estado pendiente reconocible y seguro que pertenezca al lote propio. El Git Guardian debe clasificar el diff y no mezclar cambios de propietario indeterminado, secretos, residuos ni superficies sensibles en commits rutinarios. Bloquea los riesgos propios o incluidos en el lote; excluye y avisa de los ajenos separables sin detener la publicacion propia.
- Cuando aplica: Al ejecutar `git add`, `commit` y `push` en autopiloto seguro o tras una orden explicita de subir/publicar cambios.
- Ejemplo: Si hay cambios propios y otros `team-log` o `hub-sync` del mismo lote, se guardan juntos si la historia es coherente; un cambio ajeno separable queda fuera y se avisa. Si el propietario de un cambio incluido en el lote es indeterminado, el guardado se bloquea hasta aclararlo.
- Advertencia: Subir cambios pendientes de otros chats sin ownership claro puede introducir cambios no revisados o no deseados por el usuario; por eso el gate clasifica antes de commitear.
- Ultima confirmacion: 2026-03-21

## commit-body-default
- Alcance: global.
- Regla: Por defecto, redacta todos los commits en espanol con titulo y cuerpo breve de 2-5 bullets. Solo se permite usar solo titulo cuando el cambio sea claramente menor, este acotado a un unico archivo y no mezcle mas de una clase de modificacion.
- Cuando aplica: Al redactar mensajes de commit antes de `git commit`.
- Ejemplo: Un cambio en varios archivos de UI debe llevar titulo y bullets; un typo minimo de un archivo puede quedarse solo en titulo.
- Advertencia: Cuerpos largos por defecto en commits menores pueden ocultar la verdadera naturaleza del cambio en ruido informativo.
- Ultima confirmacion: 2026-03-21

## release-bump-policy
- Alcance: global.
- Regla: Clasifica cada publicacion formal como `major`, `minor` o `patch` con criterio conservador: `patch` para cambios pequenos o acotados, `minor` para capacidades nuevas o bloques claros de roadmap y `major` solo para rupturas de contrato o reestructuraciones relevantes.
- Cuando aplica: Al decidir la siguiente version antes de redactar commit y crear tag.
- Ejemplo: Un fix documental sube `patch`; una skill nueva o feature relevante sube `minor`; un cambio incompatible sube `major`.
- Advertencia: Clasificacion conservadora puede subestimar el impacto de un cambio; validar contra la SSOT local.
- Ultima confirmacion: 2026-03-21

## roadmap-check-before-release
- Alcance: global.
- Regla: Antes de cerrar una release formal, revisa `docs/TODO.md` solo si existe y esta estructurado; marca solo el item abierto que encaje de forma inequivoca con el diff real, anadiendo ID local, version y fecha.
- Cuando aplica: Durante la preparacion final de una release formal.
- Ejemplo: Si el cambio completa `<ID-local>`, el item pasa a cerrado con version y fecha segun el formato del proyecto.
- Advertencia: Dependencia de docs/TODO.md puede ser contraproducente si el documento esta desactualizado.
- Ultima confirmacion: 2026-03-21

## branch-scope-coherence
- Alcance: global.
- Regla: Antes de `commit` o `push`, no asumas que la rama activa sigue siendo valida; comprueba si el nombre de la rama encaja con el diff real y no publiques cambios transversales por defecto en una rama tematica.
- Cuando aplica: Justo antes de publicar cambios, especialmente si la rama no es la de integracion.
- Ejemplo: Si la rama es `codex/heroui` pero el diff toca bootstrap, agentes y docs generales, mueve el cambio a `main` o a una rama mas amplia antes de publicar.
- Advertencia: Verificaciones estrictas de rama pueden bloquear publicaciones urgentes de hotfix si el nombre no encaja perfectamente.
- Ultima confirmacion: 2026-04-02

## release-version-source-hub
- Alcance: solo CerebroOperativoIA.
- Regla: En el hub, trata el ultimo tag Git valido `vX.XX.XX` como fuente principal de la version publicada; usa `HUB_VERSION` como espejo local y recurre al historial local solo si faltan ambos.
- Cuando aplica: Justo antes de calcular la siguiente version en una release formal aprobada del hub.
- Ejemplo: Si el ultimo tag es `v1.04.08` pero `HUB_VERSION` sigue en `1.04.07`, prevalece el tag y `HUB_VERSION` se corrige en la misma publicacion.
- Advertencia: Priorizar tag Git sobre HUB_VERSION puede ocultar discrepancias de version en documentacion.
- Ultima confirmacion: 2026-03-21

## release-tagging-hub
- Alcance: solo CerebroOperativoIA.
- Regla: Toda release formal aprobada del hub debe dejar la misma version en tres sitios: titulo del commit con prefijo `[vX.XX.XX]`, `HUB_VERSION` sin prefijo y tag anotado `vX.XX.XX`.
- Cuando aplica: Al ejecutar una release formal aprobada del hub, no en un `sync push` normal.
- Ejemplo: Commit `[v1.05.00] feat: formaliza el versionado`, `HUB_VERSION=1.05.00` y tag `v1.05.00`.
- Advertencia: Triplicar la version en commit, archivo y tag aumenta la superficie de error si alguno se actualiza manualmente.
- Ultima confirmacion: 2026-03-21

## merge-policy
- Alcance: global.
- Regla: Elige la estrategia de integracion de una rama a `main` por regla segun tamano, no por preferencia puntual: MEDIO -> `git merge --ff-only` (o `--no-ff` si el historial no permite ff); GRANDE/SENSIBLE -> squash merge; RELEASE formal -> `merge --no-ff` + tag. Detalle y motivo en [merge-gate.md](merge-gate.md).
- Cuando aplica: Al fusionar una rama a la rama de integracion tras el gate `listo para mergear`.
- Ejemplo: Un MEDIO con 2 commits -> `git merge --ff-only`; un GRANDE por PR -> squash merge en 1 commit semantico.
- Advertencia: Squash para MEDIO pierde granularidad util (1-3 commits); forzar ff cuando hay divergencia puede pedir rebase y sumar friccion.
- Ultima confirmacion: 2026-07-03

## branch-ttl
- Alcance: global.
- Regla: Toda rama efimera tiene TTL de 72h desde el ultimo commit; sin renovacion (commit o heartbeat) pasa a `caducada`. A los 7 dias sin renovacion pasa a `candidata a borrado`. La rama no se borra sola: el borrado es operacion destructiva que exige orden humana. Cualquier commit nuevo reinicia el TTL.
- Cuando aplica: Al auditar el arbol de ramas y al decidir si una rama sigue activa.
- Ejemplo: Una rama `feature/x` con ultimo commit hace 80 horas -> `caducada`; hace 9 dias -> `candidata a borrado`.
- Advertencia: El TTL mide commits, no trabajo en progreso sin commitear; una rama con WIP largo se marca caducada aunque este activa.
- Ultima confirmacion: 2026-07-03

## branch-limit
- Alcance: global.
- Regla: Mas de 5 ramas efimeras activas (local + remoto) genera aviso de mantenimiento. Nunca bloquea por si solo abrir una rama necesaria, guardar, publicar o cerrar; tampoco exige borrar trabajo ajeno. Preferir reutilizar una rama propia del mismo tema cuando sea compatible.
- Cuando aplica: Al abrir una rama nueva y al auditar el arbol.
- Ejemplo: Con 5 ramas activas, se abre la 6ª si protege el lote; se informa del mantenimiento sin tocar las otras.
- Advertencia: El contador no demuestra conflictos ni perdida de trabajo; su umbral es redefinible por SSOT local.
- Ultima confirmacion: 2026-09-27

## pr-required-for
- Alcance: global.
- Regla: Aplicar la tabla canonica de rutas de [ramas.md](ramas.md): PR obligatorio para GRANDE/SENSIBLE/RELEASE, superficie exclusive o rama objetivo protegida. TRIVIAL y MEDIO en solitario con main no protegida pueden ir directamente a main si el gate lo permite; MEDIO usa rama efimera solo cuando aporta control o hay validacion pendiente. La deteccion de proteccion y su fallback viven en [merge-gate.md](merge-gate.md), sin interpretarlos como permiso para omitir un PR obligatorio.
- Cuando aplica: Al elegir entre push directo, rama de trabajo o PR tras clasificar el tamano.
- Ejemplo: Un MEDIO con main protegida -> PR; el mismo cambio sin proteccion y con gate verde -> main directo o rama justificada, sin PR obligatorio.
- Advertencia: Asumir protegida por defecto sin `gh` puede abrir PR innecesarios en el hub; asumir no protegida en consumidores puede dejar rechazos de push.
- Ultima confirmacion: 2026-10-01

## suggest-on-close
- Alcance: global.
- Regla: Al cerrar una tarea material (criterios CREAR team de Rule 2 de `docs/AI_GLOBAL_RULES.md`: >1 archivo; docs/protocolos/arquitectura/roadmap/reglas; trabajo >1 respuesta; investigacion con decisiones; auth/datos/Supabase/Git/seguridad; contexto que deba sobrevivir al siguiente LLM) con cierre `inmediato` o `por-lote`, o cuando el humano lo pide explicitamente, @experto-github entra en modo `autopiloto-de-cierre`: reconstruye estado con Git Guardian y el supervisor v2, marca `ready` tras validacion y puede ejecutar `integrate-local --local-only` si el cambio es TRIVIAL/MEDIO, limpio, no sensible y sin validacion humana pendiente. Con gate verde puede ejecutar tambien el `sync push` rutinario; la salida separa terminación local/protegida de estado remoto publicado o pendiente. Release formal, tags, force push, borrado remoto, merge grande/sensible a `main`, secretos, auth/permisos/datos/RLS y operaciones irreversibles siguen exigiendo autorizacion humana simple.
- Default: `true` (autopiloto seguro por defecto). Justificado por el objetivo del humano "jefe no experto en git que no quiere decidir mecanica Git".
- Cuando aplica: Al cierre de tarea material `inmediato`/`por-lote` de @orquestador, o ante demanda explicita del humano ("¿que hay pendiente?", "¿que hay que subir?", "dejalo listo").
- Ejemplo: Tras cerrar una feature valida probada en local, el experto ejecuta `preflight` y `save`; si todo esta limpio, responde con destino y estado comprobados (por ejemplo, "incorporado a main en GitHub" o "guardado en tu equipo; pendiente subir"); si es grande/sensible, crea PR draft o deja "subido a una rama; pendiente incorporar" y pide autorizacion humana simple para integrar.
- Advertencia: Desactivar esta preferencia con `suggest-on-close: false` en la SSOT local solo apaga el cierre automatico rutinario; no habilita operaciones destructivas ni releases sin autorizacion. Precedencia: SSOT local > preferencia global.
- Ultima confirmacion: 2026-07-08
