# Formato de commits y diff mezclado

Referencia de `configurar-github`. Define como redactar commits y como decidir ante un diff que mezcla historias distintas.

# Principio base

El commit refleja el diff real observado (`git status` + `git diff`), no la memoria conversacional. Antes de redactar, reconstruir el contexto con evidencia (preferencia `commit-context-source`).

# Deteccion de diff mezclado

Un diff esta mezclado cuando combina historias distintas. Detectar estos bloques:

- UI + agentes/skills/reglas del hub.
- backend + docs generales no relacionadas.
- fix puntual + refactor amplio.
- cambios de otros chats.
- fuentes canonicas + proyecciones.
- release + cambios sin cierre.

Si esta mezclado:

1. Explicar bloques detectados.
2. Proponer commits separados si pertenecen al mismo flujo.
3. Proponer ramas separadas si son historias independientes.
4. Si el usuario pidio subir todo, se puede agrupar solo declarando alcance y riesgo explicitos (preferencia `push-all-pending-changes-on-request`).

# Formato de commit

Por defecto (preferencias `commit-body-default` y `git-metadata-language`):

- Redactar en espanol por defecto, salvo que el usuario pida otro idioma o el repo sea dominado por otro.
- Primera linea: `tipo: resumen de alto nivel` (que cambio, a nivel general).
- Cuerpo: bullets `- ` desglosando las piezas principales del diff.
- Cada bullet: verbo en infinitivo + que cambio + contexto breve si aplica.
- Separar primera linea y cuerpo con una linea en blanco.
- Omitir cuerpo solo en cambio menor, de un archivo y una sola clase de modificacion.

## Tipos de commit (alineados con Conventional Commits)

- `feat:` capacidad nueva o feature clara.
- `fix:` correccion de bug.
- `docs:` documentacion.
- `refactor:` refactor interno sin cambio de comportamiento.
- `chore:` mantenimiento, deps, tooling.
- `test:` tests.
- `perf:` mejora de rendimiento.
- `build:` sistema de build o dependencias.
- `ci:` configuracion de CI/CD.

## Prefijo versionado (solo release formal)

Usar `[vX.XX.XX] <tipo>: <resumen>` solo cuando la release formal del proyecto documente ese prefijo (preferencia `commit-format`). En `sync push`, PR ordinario o cambios sin version formal, usar `<tipo>: <resumen>` sin prefijo versionado.

- Release con prefijo local (hub): `[v1.04.08] feat: anade validador de memoria`.
- Sync push: `feat: anade validador de memoria`.

Advertencia: usar prefijos versionados en commits de sync genera ruido en el historial y confunde la trazabilidad de releases reales.

# Ejemplos

## Commit con cuerpo (cambio multi-archivo coherente)

```
feat: agrega notas olfativas -- migracion, admin, filtros catalogo y piramide olfativa

- Crea tablas notes y product_notes con migracion 014 + seed de notas iniciales
- Anade selector de notas en admin y CRUD completo con notas en productos
- Extiende filtros del catalogo con sidebar mejorado y chips de notas activas
- Mejora barra de busqueda y ordenacion con soporte para filtro de notas
- Implementa piramide olfativa visual en detalle de producto
```

## Commit sin cuerpo (cambio menor, un archivo, una clase de modificacion)

```
fix: corrige typo en etiqueta del boton de envio
```

## Commit de sync push en el hub (sin prefijo versionado)

```
chore(hub): canon de gate de cierre con auto-cita en crear-skills
```

## Commit de release formal del hub (con prefijo versionado)

```
[v1.05.00] feat(hub): formaliza el versionado del hub
```

# Coherencia con preferencias

Las preferencias relevantes (`commit-format`, `commit-body-default`, `git-metadata-language`, `commit-context-source`, `commit-link-after-push`) viven en [preferences.md](preferences.md) y se aplican segun su alcance. Esta referencia no duplica las reglas: las ejemplifica.
