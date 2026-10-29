# Solo CerebroOperativoIA: versionado del hub y scripts auxiliares

Referencia de `configurar-github`. Define las reglas exclusivas del hub que NO se aplican a proyectos externos salvo que su SSOT los adopte explicitamente.

# Principio base

El hub tiene convenios propios de versionado que difieren de SemVer estandar. Aplicarlos SOLO cuando el repositorio objetivo es el propio CerebroOperativoIA o cuando la SSOT de un proyecto externo los adopta de forma explicita. Aplicar reglas del hub a proyectos externos por accidente es un anti-patron.

# Formato de version del hub

- Tags: `vX.XX.XX`.
- Archivo `HUB_VERSION`: `X.XX.XX` (sin `v`).
- `vX.XX.XX` es SemVer adaptada del hub: `X` major, bloque central minor con dos digitos, bloque final patch con dos digitos.
- EJEMPLO `v1.05.00`: major 1, minor 05, patch 00.

# Triplicacion de version en release formal (preferencia `release-tagging-hub`)

Toda release formal aprobada del hub debe dejar la misma version en tres sitios:

1. Titulo del commit con prefijo `[vX.XX.XX]`.
2. `HUB_VERSION` sin prefijo (`1.05.00`).
3. Tag anotado `vX.XX.XX`.

EJEMPLO commit `[v1.05.00] feat: formaliza el versionado`, `HUB_VERSION=1.05.00`, tag `v1.05.00`.

Advertencia: triplicar la version en commit, archivo y tag aumenta la superficie de error si alguno se actualiza manualmente.

# Fuente principal de version (preferencia `release-version-source-hub`)

En el hub, tratar el ultimo tag Git valido `vX.XX.XX` como fuente principal de la version publicada; `HUB_VERSION` es espejo local; recurrir al historial local solo si faltan ambos.

EJEMPLO si el ultimo tag es `v1.04.08` pero `HUB_VERSION` sigue en `1.04.07`, prevalece el tag y `HUB_VERSION` se corrige en la misma publicacion.

# Commits de release formal del hub

Usan prefijo `[vX.XX.XX]`. En `sync push` ordinario del hub, no usar el prefijo (mismas reglas que proyectos externos).

# IDs de roadmap del hub

`docs/TODO.md` del hub usa IDs `HUB-XXX`. Antes de cerrar una release formal, marcar solo el item abierto que encaje de forma inequivoca con el diff real (preferencia `roadmap-check-before-release`).

# main como rama diaria en el hub

En el hub, `sync push` ordinario puede ocurrir en `main` porque `main` es tambien rama diaria de trabajo (no solo de integracion). Esto difiere de proyectos externos donde `main` suele estar protegida.

Esta concrecion permite main directo para trabajo rutinario cuando la tabla de [ramas.md](ramas.md) y los gates lo permiten. Para cambios GRANDE/SENSIBLE/RELEASE conserva rama, PR, revision, QA y autorizacion de integracion: una aprobacion aceptada tecnicamente por Guardian no sustituye ese flujo ni autoriza saltar sus controles. Tras una integracion comprobada, el cierre documental del mismo lote sigue el cierre Team-only de [SKILL.md](SKILL.md), sin introducir cambios funcionales nuevos ni una segunda integracion.

# Publicacion formal del hub

Para release formal del hub, priorizar `scripts/publish-hub.ps1` cuando corresponda. Tras la publicacion, regenerar `HUB_MANIFEST.json` y proyecciones segun el flujo canonico del hub.

# Sello regenerado dentro de un commit ordinario

Un lote que toca fuentes gestionadas (o `AGENTS.md`, o `HUB_MANIFEST.json`) hace que el gancho nativo regenere el sello DENTRO del commit. Practica medida el 2026-10-06 (TEAM_0203):

- Reserva `AGENTS.md` y `HUB_MANIFEST.json` como superficies en la coordinacion ANTES de guardar: el gate `--enforce-own-surfaces` bloquea si el lote cambia esas rutas sin reserva.
- Incluyelas en `--own` del guardado; si faltan, el gancho bloquea con la orden exacta que regenera el sello.
- El guardian devuelve a HEAD las entradas de indice que ese commit deje desfasadas (`index_repaired` en su salida). Si un guardado antiguo dejo `MM` en `AGENTS.md`/`HUB_MANIFEST.json`, `git reset -- AGENTS.md HUB_MANIFEST.json` lo limpia sin perder contenido.

# Scripts auxiliares

Los scripts son ayudas, no sustitutos del criterio ni reglas obligatorias universales:

- `configurar-github/scripts/get-next-version.ps1`: calcula la siguiente version del hub o de proyectos con formato compatible documentado. Solo hub o proyectos compatibles.
- `configurar-github/scripts/validate-git-operation.ps1`: valida una operacion de publicacion compleja (sync push o release). Recomendado para release o validacion rigurosa.
- `configurar-github/scripts/validate-branch-scope.ps1`: valida que la rama y el diff encajan. Recomendado si la rama y el diff pueden no encajar.
- `configurar-github/scripts/repo-setup.ps1`: bootstrap de repositorio (inicializacion, remoto, rama base). Solo creacion/bootstrap.

Si un script no aplica al proyecto externo, usar SSOT local y validacion manual equivalente.

# Coherencia con preferences.md

Las preferencias del hub (`release-version-source-hub`, `release-tagging-hub`) viven en [preferences.md](preferences.md) con alcance `solo CerebroOperativoIA`. Esta referencia no duplica las reglas: las detalla y ejemplifica.
