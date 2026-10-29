# `listo para mergear` (gate de control)

Referencia de `configurar-github`. Define el gate anterior a cualquier integracion de rama: el punto donde la IA decide si puede fusionar automaticamente por autopiloto seguro o si debe proteger el trabajo y pedir autorizacion humana simple por riesgo material.

# Principio base

`listo para mergear` es **hermano bloqueante** de `listo para publicar`:

- `listo para mergear` = control de la **incorporacion de una rama a la rama oficial**, tanto en local como mediante GitHub.
- `listo para publicar` = control de la operacion remota pendiente (push de rama/main, PR o release), indicando su destino.

No son lo mismo: un cambio MEDIO transita `Estado/Gate: listo para mergear` solo si al cierre se protegió en una rama efimera; si se hizo local-first y el gate permite `main` directo, salta este gate igual que un TRIVIAL. Un cambio GRANDE requiere los controles de rama/PR y merge; la rama puede subirse antes de fusionar el PR en GitHub. No exigir merge local previo ni segundo merge tras fusionar en GitHub. Ver el contrato de destino y estados en [SKILL.md](SKILL.md).

Este gate no decide donde se implementa. En trabajo solitario sin concurrencia, el cambio se hace primero en el workspace local activo para que el usuario pueda probarlo. El gate entra despues, si Git Guardian necesita fusionar una rama o proteger el trabajo antes de publicar.

La ejecucion real del merge la hace **@experto-github**; esta referencia es POLITICA, no ejecuta comandos git por si misma.

# Requisitos del gate (todos obligatorios; sin uno, el estado queda `bloqueado`)

Cuando la integración se hará mediante un PR de GitHub en un repositorio que adoptó la plantilla canónica, el especialista valida la descripción antes de marcarlo `ready` y, después, invoca el Git Guardian con ese PR explícito (`--pr-ref`). Si el consumidor no tiene `scripts/git_guardian.py` local, usa el Git Guardian del Hub con `--root <raiz-del-repositorio-consumidor>`; no se amplía `dsh-guardian`. Si se modifica la descripción, se vuelve a consultar el mismo PR; no hace falta un commit nuevo para reevaluarlo. El formato no sustituye review, QA, CI, coordinación ni autorización aplicable. Un borrador puede permanecer abierto con pendientes y no tiene que superar este gate hasta prepararlo para integrar. La ausencia de PR explícito no añade un bloqueo a las rutas actuales de publicación directa.

1. **Semaforo verde** de `configurar-github` (verde; si dudas entre dos colores, usa el mayor).
2. **Validaciones proporcionales al tamano** (determinista):
   - TRIVIAL -> no pasa por este gate (commit directo a `main`).
   - MEDIO local-first con `main` directo permitido -> no pasa por este gate; usa validacion proporcional normal.
   - MEDIO protegido en rama -> `@revisor` **O** `@qa-validador` (uno basta, ver regla de delegacion real abajo).
   - GRANDE/SENSIBLE -> `@revisor` **Y** `@qa-validador` (+ `@especialista-seguridad` si toca auth/secretos/permisos/RLS/datos sensibles).
3. **Gate de coordinacion `clean`**: `python scripts/ai_coordination.py --integration` devuelve `clean` (exit 0). Si devuelve `blocked` (exit 2) por exclusiones abiertas relevantes al objetivo, el merge queda `bloqueado` hasta resolverlas o hasta que el humano acepte la exclusion de forma explicita. **NO** se declara limpio un merge con exclusiones por concurrencia abiertas.
4. **Sin conflictos materiales del lote entre ramas**: resolver solapes reales antes de integrar. Los umbrales 72h/7d/5 ramas son avisos de mantenimiento; el contador y las ramas ajenas no bloquean por si solos; ver [ramas.md](ramas.md).
5. **Autopiloto seguro o autorizacion humana simple**:
   - TRIVIAL/MEDIO limpio: con semaforo verde + validacion hecha (punto 2 cuando aplique) + coordinacion `clean` (punto 3), la IA puede integrar/proteger sin preguntar mecanica Git. Si main esta protegida o conviene trazabilidad, crea/actualiza PR draft/ready segun cierre.
   - GRANDE/SENSIBLE/RELEASE: siempre PR y autorizacion humana simple antes de mergear a `main` o publicar formalmente. Forma minima de orden valida: instruccion humana que mencione el resultado material (`integra`, `mergea`, `publica release`, `saca version`).

# Regla `uno basta` y delegacion real

"Uno basta" (@revisor **O** @qa-validador para MEDIO) presupone **delegacion real**: agente DISTINTO al ejecutor, en instancia/hilo separado.

- Si el runtime **si** soporta delegacion real -> uno basta.
- Si el runtime es single-thread / no expone subagentes / el "validador" es la misma IA que ejecuta -> el MEDIO protegido en rama no puede declararse ready por auto-validacion; queda protegido en rama/PR draft o exige validacion externa antes de mergear. Un MEDIO local-first de bajo riesgo puede quedar guardado/protegido sin prometer "review externa" si el cierre no exigia este gate. Coherente con `endurecer-skills` (el que hace no es el que califica) y con el blindaje de ojos-frescos no simulables.

La verificacion operativa es por auto-cita del ejecutor: "delegacion real: SI (instancia nueva, brief limpio) / NO (mismo hilo)". Ante duda, fallar hacia el control (orden humana), no hacia la automatizacion.

# Estrategia de integracion por regla (no por antojo)

| Tamano | Estrategia | Motivo |
|---|---|---|
| MEDIO | `git merge --ff-only` si el historial lo permite; si no, `git merge --no-ff` | Preserva nodo de merge si hace falta; la rama efimera suele tener 1-3 commits y squash pierde granularidad util. **No squash.** |
| GRANDE/SENSIBLE | **squash merge** | Historial de `main` lineal: 1 commit semantico por PR, con el cuerpo del PR como cuerpo del commit. |
| RELEASE formal | `git merge --no-ff` **+ tag** `vX.XX.XX` (hub) | Preserva el nodo de merge como hito de release. Tag segun [hub-versionado.md](hub-versionado.md). |

Preferencia asociada: `merge-policy`. Detalle de `--ff-only` / `--no-ff` / squash y motivo en esta referencia; no se duplica en [commits.md](commits.md).

# Squash merge y deteccion de huerfanas

Tras un **squash merge**, Git no crea nodo de merge, asi que `git branch --merged main` devuelve falso y la rama queda "zombi" aunque su contenido ya este en `main`. Regla operativa:

- **Huerfana / fusionable** = `git diff --quiet main..<rama>` exit 0 (contenido ya en `main`) **O** `git branch --merged main` verdadero (merge-node). La disyuncion cubre squash y `--no-ff`.
- **CERRAR**: antes de `git branch -d <rama>`, confirmar diff vacio. El `-d` ordinario solo borra si `--merged` es verdadero; si el diff esta vacio pero `--merged` es falso (caso squash), `-d` fallaria y el humano autoriza el cleanup. Nunca `-D` por inercia (operacion destructiva -> [recuperacion.md](recuperacion.md) + `ejecutar-operaciones-sensibles`).

# Mapeo de marcas del script `audit-branches.ps1` -> contrato

El script emite marcas deterministicas que el contrato nombra a veces distinto. Para que @experto-github y el humano parseen la auditoria sin ambiguedad (1:1 con las 7 marcas reales del script):

| Marca del script | Significado en el contrato |
|---|---|
| `fusionada` | rama ancestro de `main` con merge-node (`merge-base --is-ancestor` exit 0) -> contenido ya en main |
| `squash-safe` | `git diff main..<rama>` vacio -> contenido ya en main por squash (sin merge-node); sub-causa de cierre |
| `huerfana` | `fusionada` O `squash-safe` -> candidata a cierre/borrado (ver CERRAR en [ramas.md](ramas.md)) |
| `caducada-WIP` | viva > `CaducidadWipHoras` (default 72h) Y con commits fuera de main (TTL de trabajo agotado) |
| `caducada-stale` | inactiva > `CaducidadStaleDias` (default 7d) sin renovacion -> candidata a borrado |
| `divergente` | >= `$CommitsParaDivergente` (default 2) commits fuera de main Y no fusionable |
| `redundante(<otra>)` | solape de tokens >= 60% (Jaccard) frente a OTRA rama activa no huerfana |

Notas de parseo:

- `fusionada` y `squash-safe` son **sub-causas** de `huerfana`, no marcas de accion independiente: si ves una de ellas, la accion del contrato es **cierre**, no nuevo diagnostico.
- `redundante` indica entre parentesis la rama con la que solapa (p. ej. `redundante(feature/login)`).
- Orden de severidad de marcas solapadas (coherente con [ramas.md](ramas.md)): `caducada-stale` > `caducada-WIP` > `divergente` > `redundante`. Las marcas de cierre (`fusionada`/`squash-safe`/`huerfana`) no entran en la escala de severidad de desorden: se resuelven en CERRAR.
- Los umbrales (`CommitsParaDivergente`, `CaducidadWipHoras`, `CaducidadStaleDias`, `TopeRamas`) son defaults redefinibles por SSOT local; `TopeRamas` solo genera aviso.

# main protegida -> PR aunque en solitario

Si la rama objetivo (`main`) esta protegida por branch-protection de GitHub, `git push` directo es rechazado. Regla:

- **MEDIO en solitario** con main protegida -> **PR aunque en solitario** al publicar/proteger (no `git merge`+`push`). La implementacion puede seguir siendo local-first; main protegida sube el control al cierre.
- **TRIVIAL** con main protegida -> idem: PR (coherente con MEDIO).
- **Deteccion**: `gh api repos/{owner}/{repo}/branches/main/protection` -> HTTP 200 (protegida) / 404 (no). **Fallback sin `gh` o sin remoto**: en proyectos consumidores asumir protegida por defecto (regla de seguridad); en el hub (`main` diaria, sin branch-protection activa) asumir no protegida. Ver [hub-versionado.md](hub-versionado.md) (`main` como rama diaria).

# Exclusiones por concurrencia (Rule 25.1)

Una superficie material omitida porque otro lease la reserva **no** se presenta como "merge limpio". Si el gate `--integration` bloquea por exclusiones abiertas relevantes al objetivo, el `Estado/Gate` queda `bloqueado` con motivo, hasta resolverlas o aceptar la exclusion de forma explicita por el humano. Coherente con `@experto-github` (no declarar publicacion como cierre completo con exclusiones abiertas).

# Coherencia con Rule 24/25/26

- **Rule 25/26**: el gate exige coordinacion `clean`; ABRIR exige lease (ver [ramas.md](ramas.md)).
- **Rule 24**: el ciclo CERRAR invoca higiene de artefactos (clasificar el `.ai-work` del loop como `evidence` al cerrar).
- **Superficies `exclusive`**: tocar cualquier superficie (migraciones, lockfiles, auth/permisos, secretos, reglas globales, `HUB_VERSION`, `AGENTS.md`, ADRs, skills proyectadas, scripts de publicacion) -> clasificacion automatica GRANDE/SENSIBLE para publicacion/proteccion -> este gate exige PR + lease `exclusive` al cierre. No implica crear worktree antes de implementar si no hay concurrencia real.
