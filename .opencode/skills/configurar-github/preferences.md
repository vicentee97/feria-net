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

## publish-only-on-explicit-order
- Alcance: global.
- Regla: Una validacion funcional (`ok`, `funciona`, `perfecto`, `esta bien`) deja el trabajo en estado `listo para publicar`, pero no autoriza `commit`, `push`, PR ni release. Publica solo cuando el usuario lo pida explicitamente con una orden como `sube los cambios`, `haz push`, `haz commit y push`, `crea PR` o `saca release`.
- Cuando aplica: Al cerrar cualquier ciclo de desarrollo normal.
- Ejemplo: Tras `ok, funciona bien`, responder `listo para publicar`; tras `sube los cambios`, preparar decision de publicacion.
- Advertencia: Exigir orden explicita para publicar puede retrasar entregas si el usuario asume que la validacion implicita autoriza el push.
- Ultima confirmacion: 2026-04-29

## commit-context-source
- Alcance: global.
- Regla: Antes de redactar un commit, revisa `git status` y `git diff`; si existe un TEAM activo en `.teams/`, usalo tambien. Si no existe `.teams/`, no bloquees y reporta `sin TEAM verificable` solo cuando afecte a trazabilidad.
- Cuando aplica: Justo antes de crear commits tras orden explicita de publicacion.
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
- Regla: Tras cualquier `push`, PR o `release`, devuelve siempre tipo, rama, commit, version, tag, PR si aplica y enlace.
- Cuando aplica: En la respuesta final despues de operaciones Git/GitHub.
- Ejemplo: `Tipo: sync push`, `Rama: feature/ui`, `Commit: abc123`, `Version: sin cambios`, `Tag: sin tag`, `PR: no aplica`, `Enlace: https://...`.
- Advertencia: Incluir metadatos exhaustivos en cada respuesta puede alargar la salida y distraer del foco tecnico.
- Ultima confirmacion: 2026-04-29

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
- Regla: En proyectos de una sola persona, no uses PR por defecto para cambios pequenos o sync push ordinarios. Propone o usa rama + PR cuando el cambio sea grande, transversal, de release, de arquitectura, sensible, o cuando convenga dejar una revision formal antes de mezclar en `main`.
- Cuando aplica: Al decidir entre push directo, rama de trabajo o PR.
- Ejemplo: Un fix documental puede ir directo; un refactor transversal o una release formal puede ir por rama + PR.
- Advertencia: Omitir PRs en cambios grandes de una sola persona pierde la oportunidad de revision futura y dejar rastro de decisiones.
- Ultima confirmacion: 2026-04-29

## git-metadata-language
- Alcance: global.
- Regla: Redacta siempre en espanol los mensajes de commit, titulos de PR, cuerpos de PR y explicaciones de publicacion, salvo que el usuario pida explicitamente otro idioma.
- Cuando aplica: Al preparar commits, PRs o cualquier texto asociado a Git/GitHub.
- Ejemplo: `fix: corrige contraste del modo claro`.
- Advertencia: Espanol en metadatos de Git puede romper scripts de CI/CD o herramientas de parsing que esperan ingles.
- Ultima confirmacion: 2026-03-21

## push-all-pending-changes-on-request
- Alcance: global.
- Regla: Si el usuario pide subir o publicar los cambios, incluye por defecto todo el estado pendiente del repositorio, aunque parte de esos cambios provenga de otros chats de IA, salvo que el usuario indique explicitamente limitar el alcance.
- Cuando aplica: Al ejecutar `git add`, `commit` y `push` tras una orden explicita de subir/publicar cambios.
- Ejemplo: Si hay cambios propios de la sesion y otros pendientes ya presentes en `git status`, se suben todos juntos si el alcance se declara.
- Advertencia: Subir cambios pendientes de otros chats puede introducir cambios no revisados o no deseados por el usuario.
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
