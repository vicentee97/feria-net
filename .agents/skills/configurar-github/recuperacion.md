# Recuperacion ante fallos parciales

Referencia de `configurar-github`. Define el playbook cuando una operacion Git/GitHub falla a medias.

# Principio base (regla dura)

**NEVER** repetir comandos a ciegas. **NEVER** usar force push, borrar tags remotos ni reescribir historia sin autorizacion explicita del usuario y `ejecutar-operaciones-sensibles`. Ante fallo parcial: diagnosticar estado local y remoto antes de reintentar, y no crear duplicados (commits, tags, PRs o releases).

# Playbook por tipo de fallo

## Falla commit

- Revisar staged files (`git status`, `git diff --cached`).
- Revisar mensaje (formato, longitud, prefijo versionado solo si aplica).
- Revisar causa (hooks de pre-commit, secrets detectados, validacion de co-autoria).
- Si fue un hook de secrets: nunca eludirlo; corregir la fuente.

## Falla push

- Revisar upstream (`git rev-parse --abbrev-ref @{u}`) y si la rama local tiene tracking.
- Revisar permisos (token, auth de gh, permisos del repo).
- Revisar divergencia (`git fetch` + `git log HEAD..origin/<rama>` y `git log origin/<rama>..HEAD`).
- Si hay divergencia: NO forzar; ver abajo "Divergencia y conflictos".
- Revisar estado del remoto (repo existe, rama remota protegida, rulesets).

## Tag local creado pero no remoto

- `git tag` para ver tags locales; `git ls-remote --tags origin` para ver remotos.
- Si el tag local no esta remoto: reportar y decidir limpiar (`git tag -d <tag>`) o reintentar el push del tag, sin crear otro.
- No inventar un nuevo tag con sufijo por inercia.

## Release falla tras tag

- Comprobar si la release quedo parcial en GitHub (`gh release view <tag>`).
- Si existe: editarla (`gh release edit`) o completarla, no crear otra.
- Si no existe: reintentar la creacion con el mismo tag, no crear tag nuevo.

## PR falla

- Comprobar si ya existe un PR para la rama (`gh pr list --head <rama>`).
- Si existe: no crear duplicado; reutilizar o actualizar el existente.
- Si fue por validacion de titulo/cuerpo: corregir y reintentar.

## Divergencia y conflictos

- Parar y explicar opciones al usuario: rebase, merge, o abortar.
- NO usar `git push --force` ni `git push --force-with-lease` por inercia.
- Si la divergencia es por trabajo paralelo no coordinado: aplicar Rule 25 (merge train, coordinacion por lease) antes de resolver.

# Operaciones destructivas (gate especial)

Las siguientes operaciones requieren @especialista-seguridad + `ejecutar-operaciones-sensibles` + autorizacion explicita del usuario. Nunca por iniciativa propia:

- `git push --force` o `git push --force-with-lease` (reescribir historia remota).
- `git push --delete origin <tag>` (borrar tag remoto).
- `git tag -d` masivo o `git branch -D` masivo.
- `git reset --hard` que descarta commits compartidos.
- Cualquier `git filter-branch` o `git rebase` que reescribe commits ya publicados.

# Salida tras fallo

Cuando una operacion falla a medias, la salida a @experto-github o al usuario debe incluir:

- Que operacion fallo y en que punto.
- Estado local actual (commits, staged, tags locales).
- Estado remoto actual (commits, tags, releases, PRs).
- Opciones diagnosticadas con su riesgo.
- Recomendacion de siguiente paso (no ejecucion automatica).
