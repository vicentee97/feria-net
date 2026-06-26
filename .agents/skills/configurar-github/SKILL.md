---
name: configurar-github
description: "Gestiona git y GitHub con criterio operativo: repositorio remoto, ramas, commits, push, release, versionado y flujo de publicacion usando gh y la politica del proyecto. TRIGGERS: subir, push, publicar, github, commit, release, tag, version, sincronizar, sube cambios, haz push."
---

# Configurar GitHub

# Objetivo
Gestionar Git y GitHub con criterio profesional, separando la politica comun aplicable a casi todos los repos de la concrecion local de cada proyecto y de las reglas exclusivas del hub `CerebroOperativoIA`.

# Reglas duras
Estas reglas prevalecen sobre briefs, recetas o preferencias mal aplicadas:

1. Antes de mutar Git o GitHub, construir una `decision de publicacion`.
2. Clasificar siempre como `listo para publicar`, `sync push`, `PR` o `release formal`.
3. `Validado`, `ok` o `esta bien` no autorizan commit, push, PR ni release; hace falta orden explicita de publicar.
4. Si el usuario pide subir/publicar sin hablar de version, release o tag, tratarlo como `sync push`.
5. `sync push` no crea version, tag, GitHub Release ni commit versionado.
6. `release formal` es el unico flujo que puede resolver version, tocar fuente formal de version y crear tag/release.
7. El commit debe reflejar el diff real observado, no solo la memoria conversacional.
8. No mezclar cambios no relacionados sin avisar y sin decidir estrategia.
9. Si una operacion falla a medias, diagnosticar estado local/remoto antes de reintentar y no crear duplicados.
10. Tras push, PR o release, devolver salida auditable con tipo, rama, commit, version, tag, PR y enlace.

# Alcance y limites
- Incluye: estado Git, ramas, commits, push, PRs, tags, releases, versionado, bootstrap de repositorio y explicacion humana de la decision.
- Excluye: implementar codigo, revisar riesgos materiales, cerrar QA, crear CI por defecto o ejecutar operaciones destructivas sin `ejecutar-operaciones-sensibles`.
- Si falta cierre tecnico, pedir `validar-calidad` o @qa-validador.
- Si falta review material, pedir `revisar-cambios` o @revisor.
- Si el cambio toca auth, permisos, secretos, datos sensibles o superficie publica sensible, pedir `auditar-seguridad` o @especialista-seguridad antes de publicar.

# Inputs / contexto obligatorio
- `docs/SSOT.md` local del proyecto.
- `configurar-github/preferences.md`, si existe.
- Estado real: `git status`, diff, rama, remoto, commits recientes y tags.
- Estado de coordinacion de IAs si existe `scripts/ai_coordination.py`: leases activos, worktree actual, superficies reservadas y solapes.
- Fuente local de version solo si la SSOT la documenta: por ejemplo `VERSION.json`, `package.json`, `HUB_VERSION` u otra.
- Roadmap local (`docs/TODO.md`) solo si existe y esta suficientemente estructurado.
- Contexto remoto proporcional si `gh` esta disponible: auth, PRs recientes, releases/tags y checks cuando aplique.

## Preferencias y alcance
Las preferencias acumuladas son utiles, pero no todas aplican a todos los repos.

- Aplicar preferencias con `Alcance: global` en cualquier repo.
- Aplicar preferencias con `Alcance: si SSOT local lo define` solo cuando el proyecto documente esa fuente o convencion.
- Aplicar preferencias con `Alcance: solo CerebroOperativoIA` solo dentro del hub.
- Si una preferencia referencia una ruta inexistente (`HUB_VERSION`, `.teams/`, `docs/TODO.md`, etc.) y la SSOT local no la define, tratarla como no aplicable y reportarlo brevemente cuando afecte a la decision.

# Comportamiento esperado
- Separar siempre politica comun, concrecion local y reglas exclusivas del hub.
- Reconstruir estado real antes de decidir cualquier operacion Git/GitHub.
- Emitir una decision de publicacion antes de mutar.
- Aplicar CI, PR, versionado y scripts de forma proporcional al riesgo y a la SSOT local.
- Devolver una salida entendible para usuario no experto y auditable por otro agente.

# Politica comun

## Decision de publicacion
Antes de `git add`, `git commit`, `git push`, `gh pr create`, tags, releases o versionado, construir esta decision:

- **Tipo:** `listo para publicar`, `sync push`, `PR` o `release formal`.
- **Semaforo:** `verde`, `amarillo` o `rojo`, con motivo.
- **Rama:** actual, objetivo y si encaja con el diff.
- **Alcance:** cambios incluidos y si hay bloques no relacionados.
- **Commit:** unico o varios commits logicos.
- **PR:** no aplica, draft o ready.
- **Version/tag:** sin cambios o version formal prevista.
- **Validaciones:** hechas, requeridas y riesgo residual.
- **Autorizacion:** orden explicita o falta de autorizacion.

Si falta autorizacion, la decision queda en `listo para publicar`.

## Semaforo de riesgo
- **Verde:** cambio pequeno, coherente, bajo riesgo, rama correcta, validacion proporcional y sin version/tag.
- **Amarillo:** diff amplio, cambios mezclados pero explicables, validacion parcial, rama candidata o PR recomendable.
- **Rojo:** release formal, tags/versionado, force push, conflictos, secretos, permisos, rama incoherente, operacion sensible, CI fallando o publicacion a medias.

Si dudas entre dos colores, usa el mayor. No uses rojo para asustar por rutina: debe haber riesgo real.

## Resumen humano previo
Antes de una publicacion autorizada, explicar en simple:

```text
Decision:
- Voy a hacer: <sync push | PR draft | PR ready | release formal | dejar listo>.
- No voy a hacer: <sin tag | sin version | sin release | sin merge | etc.>.
- Rama: <actual -> objetivo> y motivo.
- Commits: <uno | varios> porque <motivo>.
- Riesgo: <verde | amarillo | rojo> - <motivo corto>.
- Validacion: <hecha | pendiente | no aplica>.
```

El usuario no debe necesitar saber Git avanzado para entenderlo.

## Reconstruccion de contexto
Antes de redactar commit, PR o release:

1. Revisar `git status`.
2. Revisar `git diff` y, si hay staged files, `git diff --cached`.
3. Revisar rama, remoto y upstream.
4. Revisar commits recientes y tags cuando aplique.
5. Revisar SSOT local para rama de integracion, versionado, checks y excepciones.
6. Si existe `scripts/ai_coordination.py`, ejecutar gate de coordinacion antes de publicar:
   - `python scripts/ai_coordination.py --root . gate --allow-no-lease` para `sync push` o PR ordinario.
   - `python scripts/ai_coordination.py --root . gate --integration --allow-no-lease` antes de merge/release cuando haya trabajo paralelo.
7. Revisar `.teams/` solo si existe.
8. Revisar `docs/TODO.md` solo si existe y se necesita roadmap/release.
9. Si `gh` esta disponible y hay remoto GitHub, revisar PRs/releases/checks proporcionalmente.

Fallback si no existe `.teams/`:
- no bloquear la operacion;
- usar diff, status, commits recientes, SSOT y TODO si existe;
- reportar `sin TEAM verificable` si la trazabilidad importa.

Prioridad factual:
1. `git status` y diff;
2. SSOT local;
3. TEAM activo si existe;
4. memoria conversacional.

## Higiene de ramas
Antes de cualquier publicacion, reconstruir y verificar el estado completo de ramas del repositorio, no solo la rama activa.

1. **Listar todas las ramas** (locales y remotas) durante la reconstruccion de contexto:
   - `git branch -a` para un listado rapido.
   - `git for-each-ref --format=%(refname:short) %(committerdate:iso) refs/heads refs/remotes` para un inventario detallado con fechas.
2. **Detectar ramas sospechosas** y marcarlas como candidatas a limpieza:
   - **Ya fusionadas en main**: `git merge-base` == tip de la rama, o `git branch --merged main` (o `origin/main`). Candidatas a borrar.
   - **Viejas sin actividad**: mas de 30 dias sin commit, o con varios commits divergiendo de main. Candidatas a cerrar o fusionar.
   - **Nombre solapado con la rama activa**: tokens comunes >=60% del total de tokens unicos. Probablemente duplicadas o redundantes.
   - **Misma finalidad que otra rama abierta**: pedir confirmacion de la rama canonica antes de seguir.
3. **Reportar el estado de higiene ANTES de pedir autorizacion** para `sync push`, `PR` o `release formal`. Indicar cuantas ramas hay en cada categoria.
4. **No publicar si hay desorden material**: si detectas ramas huerfanas, divergentes o redundantes, bloquea la peticion de autorizacion y pregunta al usuario que quiere hacer con ellas (cerrar, fusionar, mantener, ignorar) antes de continuar.
5. **Regla canonica: una sola rama de trabajo activa por tema**. Cualquier rama extra abierta para el mismo tema es desorden y debe cerrarse al crear la nueva.
6. **Pre-check obligatorio antes de `release formal`**: confirmar que solo hay una rama abierta por tema y que no hay ramas huerfanas o duplicadas con el mismo alcance. Si las hay, no autorizar el release.
7. **Ciclo de vida de las ramas**: al abrir una rama nueva para un tema, cerrar la rama vieja del mismo tema si existe. Documentar en `.teams/` si la limpieza de ramas requirio coordinacion.

## Diff mezclado e historial profesional
Detectar si el diff mezcla historias distintas:
- UI + agentes/skills/reglas del hub;
- backend + docs generales no relacionadas;
- fix puntual + refactor amplio;
- cambios de otros chats;
- fuentes canonicas + proyecciones;
- release + cambios sin cierre.

Si esta mezclado:
- explicar bloques detectados;
- proponer commits separados si pertenecen al mismo flujo;
- proponer ramas separadas si son historias independientes;
- si el usuario pidio subir todo, se puede agrupar solo declarando alcance y riesgo.

Commits:
- preferir un commit cuando el cambio sea una unidad logica;
- preferir varios commits cuando el diff tenga bloques independientes;
- redactar en espanol por defecto;
- primera linea con formato `tipo: resumen de alto nivel` (que cambio, a nivel general);
- cuerpo con bullets `- ` desglosando las piezas principales del diff;
- cada bullet: verbo en infinitivo + que cambio + contexto breve si aplica (ej: "Anade selector de notas en admin");
- separar primera linea y cuerpo con una linea en blanco;
- omitir cuerpo solo en cambio menor, de un archivo y una sola clase de modificacion.

Ejemplo de commit con cuerpo:
```
feat: agrega notas olfativas -- migracion, admin, filtros catalogo y piramide olfativa

- Crea tablas notes y product_notes con migracion 014 + seed de notas iniciales
- Anade selector de notas en admin y CRUD completo con notas en productos
- Extiende filtros del catalogo con sidebar mejorado y chips de notas activas
- Mejora barra de busqueda y ordenacion con soporte para filtro de notas
- Implementa piramide olfativa visual en detalle de producto
```

Ejemplo de commit sin cuerpo (cambio menor):
```
fix: corrige typo en etiqueta del boton de envio
```

## Ramas y PR
- `main` es rama de integracion por defecto salvo excepcion local.
- Ramas nuevas: kebab-case con prefijo corto (`feature/`, `fix/`, `docs/`, `chore/`, `refactor/`, `release/` o equivalente local).
- No publicar cambios transversales en una rama tematica estrecha por inercia.
- Si hay varias IAs o IDEs trabajando a la vez, preferir `git worktree` por tarea y registrar lease con `scripts/ai_coordination.py`; rama sin worktree no protege el working tree fisico.
- PR es opcional en proyectos de una persona, pero recomendado para cambios grandes, transversales, sensibles, de arquitectura o release formal.
- PR draft si falta QA, review, CI o cierre material.
- PR ready solo cuando el cierre sea suficiente.

## Concurrencia de IAs
Antes de `commit`, `push`, PR, merge o release en un repo con leases activos:
- no publicar si el gate de `scripts/ai_coordination.py` devuelve `blocked`;
- no tocar superficies reservadas por otro TEAM sin coordinacion explicita;
- no hacer merge de varias ramas paralelas a la vez: usar merge train;
- tratar migraciones, lockfiles, auth/permisos, reglas globales y scripts de publicacion como superficies `exclusive`;
- reportar en la decision de publicacion si no existe lease propio, si hay leases caducados o si el gate se omitio porque el proyecto aun no tiene script de coordinacion.

## CI/CD proporcional
Antes de PR ready, release formal o publicacion sensible:
- detectar si existe `.github/workflows`;
- si existe CI y `gh` esta disponible, revisar runs/checks relevantes (`gh run list`, checks de PR o estado de branch cuando aplique);
- si CI falla o esta pendiente, no marcar PR ready ni release como cerrada sin explicar el riesgo;
- si no existe CI, no crearlo por defecto desde esta skill: reportar ausencia y derivar a `configurar-testing`, @qa-validador o @arquitecto si el riesgo lo justifica;
- permitir `sync push` pequeno y de bajo riesgo sin exigir CI cuando la validacion local sea proporcional.

## Recuperacion ante fallos parciales
No repetir comandos a ciegas.

- Falla commit: revisar staged files, mensaje y causa.
- Falla push: revisar upstream, permisos, divergencia y remoto.
- Tag local creado pero no remoto: reportar y decidir limpiar/reintentar sin crear otro.
- Release falla tras tag: comprobar release parcial y completar/editar o limpiar con autorizacion.
- PR falla: comprobar si ya existe PR para la rama.
- Divergencia/conflictos: parar y explicar opciones.

No usar force push, borrar tags remotos ni reescribir historia sin autorizacion explicita y `ejecutar-operaciones-sensibles`.

# Flujos

## `listo para publicar`
Usar cuando el trabajo parece validado pero falta orden explicita de publicar.

Salida:
- que queda preparado;
- que falta para publicar;
- riesgo residual;
- recomendacion de siguiente paso.

## `sync push`
Usar cuando el usuario pide subir/publicar sin version, release ni tag.

Contrato:
- no tocar version formal;
- no crear tag;
- no crear GitHub Release;
- no usar prefijo versionado;
- incluir por defecto todo el estado pendiente del repo salvo que el usuario limite alcance;
- compartir enlace al commit o rama.

## `PR`
Usar cuando aporta trazabilidad o control.

Contrato minimo:
- titulo en idioma del proyecto;
- contexto, cambios, validacion y riesgos/notas;
- draft si falta cierre;
- ready solo con cierre suficiente;
- no mezclar PR incompleto con release formal.

## `release formal`
Usar solo si el usuario pide version/release/tag o la SSOT local lo exige.

Contrato:
- resolver version con la fuente local documentada;
- decidir `major`, `minor` o `patch` con criterio conservador;
- crear tag cuando la politica local lo exija;
- actualizar fuente local de version solo si esta documentada;
- actualizar roadmap solo si hay match inequivoco y el proyecto lo usa;
- GitHub Release/notas cuando el hito lo justifique o la SSOT lo pida.

Bump por defecto:
- `patch`: fixes, docs, ajustes acotados, refactors internos compatibles.
- `minor`: capacidad nueva, skill/agente nuevo, feature clara o bloque de roadmap.
- `major`: ruptura de contrato, API incompatible o reestructura material.

Ante duda, elegir el nivel menor.

# Concrecion local por proyecto
La politica comun vive en el hub. Cada proyecto solo concreta, si difiere del default:

- rama de integracion;
- fuente de version;
- formato de tag/version;
- checks obligatorios;
- politica de PR/release notes;
- comandos locales de validacion.

Si falta concrecion local, usar defaults compartidos y reportar las suposiciones relevantes.

# Solo CerebroOperativoIA
Estas reglas no se aplican a otros proyectos salvo que su SSOT las adopte explicitamente:

- Version formal del hub: tags `vX.XX.XX` y archivo `HUB_VERSION` con `X.XX.XX`.
- `vX.XX.XX` es SemVer adaptada del hub: `X` major, bloque central minor con dos digitos, bloque final patch con dos digitos.
- Commits de release formal del hub usan prefijo `[vX.XX.XX]`.
- `docs/TODO.md` del hub usa IDs `HUB-XXX`.
- En el hub, `sync push` ordinario puede ocurrir en `main` porque `main` es tambien rama diaria de trabajo.
- Para release formal del hub, priorizar `scripts/publish-hub.ps1` cuando corresponda.

# Scripts auxiliares
Los scripts son ayudas, no sustitutos del criterio ni reglas obligatorias universales:

- `configurar-github/scripts/get-next-version.ps1`: solo hub o proyectos con formato compatible documentado.
- `configurar-github/scripts/validate-git-operation.ps1`: recomendado para publicacion compleja, release o validacion de sync/release.
- `configurar-github/scripts/validate-branch-scope.ps1`: recomendado si rama y diff pueden no encajar.
- `configurar-github/scripts/repo-setup.ps1`: solo creacion/bootstrap de repositorio.

Si un script no aplica al proyecto externo, usar SSOT local y validacion manual equivalente.

# Regla: verificar contexto de equipo antes de sugerir PR
Antes de proponer un PR, verificar si el proyecto tiene más colaboradores:
- Si el usuario trabaja solo (equipo de 1 persona), fusionar ramas directamente con `git merge` + `git push`. No sugerir PR ni code review.
- Si hay más colaboradores o el SSOT indica flujo por PR, entonces proponer PR.
- Si no está claro, preguntar una vez y documentar la preferencia en la SSOT del proyecto.

# Memoria aprendible
Puede guardar preferencias confirmadas sobre:
- commits;
- ramas;
- PRs;
- idioma;
- versionado;
- publicacion explicita;
- salida tras publicar.

Cada preferencia debe incluir alcance. No guardar preferencias temporales ni reglas que pertenezcan a la SSOT local.

# Flujo recomendado
1. Leer SSOT local y `preferences.md`.
2. Reconstruir estado real Git/GitHub.
3. Separar politica comun, concrecion local y reglas hub-only.
4. Detectar diff mezclado y coherencia de rama.
5. Revisar validacion local/CI proporcional.
6. Emitir decision de publicacion.
7. Ejecutar solo el flujo autorizado.
8. Si algo falla, recuperar con diagnostico.
9. Devolver salida auditable.

# Salida obligatoria
Tras cualquier preparacion, push, PR o release, devolver:

- Tipo.
- Semaforo.
- Que he subido o que queda preparado.
- Que NO he hecho.
- Rama.
- Commit.
- Version.
- Tag.
- PR.
- Enlace.
- Validacion.
- Riesgo residual.

# Criterio de resultado bueno
- La operacion respeta la SSOT local y la politica comun.
- No se aplican reglas del hub a proyectos externos por accidente.
- `sync push` no crea version/tag/release.
- `release formal` queda versionada de forma coherente.
- El historial queda legible.
- CI/checks se consideran de forma proporcional.
- El usuario entiende que paso y donde verlo.

## Triggers
- **Keywords:** subir, push, publicar, github, commit, release, tag, version, sincronizar, sube, commitea
- **Patrones de usuario:** "sube los cambios", "haz push", "publica", "crea un repo", "haz un release", "commitea esto", "version nueva", "sincroniza con github"
- **Encadenamiento:** despues de `revisar-cambios`, `validar-calidad` o `auditar-seguridad` cuando la publicacion lo requiera

# Ejemplos de activacion
"Configura GitHub para este proyecto."
"Sube estos cambios sin sacar release."
"Prepara una release formal siguiendo la SSOT local."
