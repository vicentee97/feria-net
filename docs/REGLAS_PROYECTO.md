# Reglas del proyecto — FeriaNet

Reglas operativas **locales** de FeriaNet. No sustituyen las reglas globales del hub
definidas en `AGENTS.md`; las complementan con convenciones especificas del proyecto.

## Naming canonico

Toda la documentacion, codigo, UI y mensajes usan la taxonomia cerrada en
[`docs/SSOT.md` seccion "Taxonomia canonica"](SSOT.md). Resumen operativo:

- `FeriaNet` (producto) / `Feria` (evento generico) / `Edicion de feria` (instancia anual).
- `Atraccion` (no "ride", no "puesto") / `Caja` / `Ticket` (no "recibo", no "entrada") / `Oferta` / `TPV` / `Feriante`.

## Fuente de verdad por tema

| Tema | Documento canonico |
|---|---|
| Identidad de producto y taxonomia | `docs/SSOT.md` |
| Capacidades y roadmap | `docs/product-map.md` + `docs/TODO.md` |
| Decisiones tecnicas | `docs/ARCHITECTURE.md` |
| Modelo de datos | `docs/data-model.md` |
| Reglas locales del proyecto | `docs/REGLAS_PROYECTO.md` (este doc) |
| Coordinacion y equipos | `.teams/` |
| Preguntas abiertas | `.questions/` |

Si dos documentos contradicen un mismo punto, gana el de la fila superior. Si la
contradiccion no se resuelve, se abre una `QUESTION-NNN`.

## Convenciones de commits

Mensajes en espanol, imperativo, primera linea de **maximo 72 caracteres**.
Formato sugerido:

```
tipo(scope): descripcion corta
```

Tipos aceptados (alineados con Conventional Commits, en espanol):

- `feat`: capacidad nueva visible para el usuario.
- `fix`: correccion de bug.
- `chore`: tarea interna sin cambio funcional (deps, tooling, CI).
- `docs`: solo documentacion.
- `refactor`: cambio interno sin cambio funcional.
- `test`: anadir o corregir tests.
- `style`: formato, sin cambio logico.
- `perf`: mejora de rendimiento.

Las reglas finas de commit, rama, PR y release las formaliza `@experto-github`
con la skill `configurar-github` cuando se cree el remoto. Esta seccion es el
acuerdo minimo de partida.

## Prohibido versionar

- Secretos, claves, tokens, `.env`, `.env.local`, `*.pem`, `*.key`.
- `node_modules/`, artefactos compilados (`dist/`, `build/`, `.vite/`).
- `src-tauri/target/`, `src-tauri/gen/`, `*.pdb`.
- Bases de datos locales (`*.db`, `*.db-wal`, `*.db-shm`, `*.sqlite*`).
- Temporales del hub y de IA: `.ai-work/`, `*.tmp`, `*.bak`, `*.restore_*`, `.restore/`.
- Logs (`*.log`, `npm-debug.log*`).

El detalle completo esta en `.gitignore` (raiz del proyecto).

## Overrides sobre el hub

**Ninguno por ahora.** Este proyecto respeta todas las reglas globales del hub.
Si en algun momento una regla local entra en conflicto con una regla global,
se documenta aqui con:

- la regla del hub afectada,
- la regla local que la matiza,
- el motivo,
- y desde que fecha aplica.
