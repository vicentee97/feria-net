# Higiene de ramas, ciclo de vida y PR

Referencia de `configurar-github`. Define el modelo de flujo, el ciclo de vida estricto de rama (ABRIR/VIVIR/MERGER/CERRAR), los limites de acumulacion y cuando proponer PR vs push directo.

# Principio base

Antes de cualquier publicacion (`sync push`, `PR`, `release formal`), reconstruir el estado de ramas. Bloquean los conflictos materiales del lote; la acumulacion o el mantenimiento de ramas ajenas se informa sin impedir el cierre propio.

El modelo de flujo del hub es **local-first + GitHub Flow adaptado + escalado trunk-based**: una sola rama long-lived (`main`), trabajo solitario primero en el workspace local activo, ramas efimeras short-lived para proteger cambios MEDIO cuando aporten control o main lo exija, ramas/PR para GRANDE/SENSIBLE/RELEASE y commit directo a `main` para TRIVIAL. Fuente de autoridad: AWS Well-Architected `DL.SCM.2` ("trunk-based development paired with a pull request workflow utilizing short-lived feature branches") y Atlassian/Mergify para el descarte de GitFlow (overkill para una persona + IAs).

Regla de experiencia local: la tabla siguiente clasifica la **proteccion/publicacion**, no el lugar inicial donde se implementa. Si no hay concurrencia real ni lease solapado, la IA edita en el workspace local activo para que el usuario pueda refrescar el navegador y ver el cambio antes de PR/merge.

# Modelo hibrido por tamano (clasificacion determinista antes de abrir rama)

Clasificar ANTES de abrir rama con checklist objetivo. Defaults canonicos del hub; redefinibles por SSOT local.

| Tamano | Definicion (checklist) | Ruta de publicacion |
|---|---|---|
| **TRIVIAL** | Cumple **TODAS**: (a) <=1 archivo (o <=2 puramente cosmeticos en el mismo contexto); (b) tipo = typo, docs cosmética, link roto, formato; (c) **no** toca superficie `exclusive`; (d) **no** cambia lineas no comentadas en skill/agente/script ni un contrato de funcion documentado; (e) 1 agente/sesion, sin concurrencia real. | Commit directo a `main`. Sin rama, sin PR (salvo main protegida). |
| **MEDIO** | **No** es trivial y cumple cualquiera: (a) 2-8 archivos en 1 modulo (1 directorio de skill/agente/script); (b) feature/hotfix funcional; (c) cambia comportamiento; (d) docs estructural (toca `docs/SSOT`, `docs/AI_GLOBAL_RULES.md`, ADR o plantilla de team). | Desarrollo local-first. Al cierre: `main` directo si el gate es verde y main no esta protegida; rama efimera + gate `listo para mergear` si aporta control, hay validacion pendiente o main lo exige; PR opcional salvo main protegida. |
| **GRANDE/SENSIBLE/RELEASE** | Cumple **cualquiera**: (a) toca superficie `exclusive`; (b) `release formal` (version/tag); (c) transversal (>=2 de: skills, agentes, scripts, `docs/SSOT`, reglas globales, plantillas); (d) refactor de fronteras entre agentes/skills; (e) >8 archivos; (f) >=2 agentes/sesiones con leases activos. | Desarrollo local-first si no hay concurrencia. Al cierre: rama + PR **obligatorio** + gate `listo para mergear` bloqueante + autorizacion humana simple antes de integrar/publicar formalmente. |

**Regla de desempate**: si un cambio cumple criteria de dos tamanos, gana el **mayor** (coherente con el semaforo de `configurar-github`: "si dudas entre dos colores, usa el mayor").

**Anclaje de superficies `exclusive`**: tocar cualquiera (migraciones, lockfiles, auth/permisos, secretos/config sensible, reglas globales, scripts de publicacion, releases, cambios estructurales dificiles de revertir; y en el hub: `HUB_VERSION`/`HUB_MANIFEST.json`, `scripts/agent-prompts.json`, `docs/AI_GLOBAL_RULES.md`, `AGENTS.md`, ADRs, skills proyectadas, scripts de publicacion/proyeccion) -> clasificacion automatica GRANDE/SENSIBLE.

# Inventario de ramas

Durante la reconstruccion de contexto:

- `git branch -a` para un listado rapido.
- `git for-each-ref --format=%(refname:short) %(committerdate:iso) refs/heads refs/remotes` para inventario detallado con fechas.

# Ciclo de vida estricto: ABRIR / VIVIR / MERGER / CERRAR

## ABRIR (solo cuando la rama es necesaria; requisitos obligatorios)

No abras rama para empezar a implementar en una sesion solitaria solo porque el cambio podria ser MEDIO. Abre rama cuando Git Guardian o la clasificacion de cierre la necesiten: main protegida, validacion externa pendiente, cambio grande/sensible/release, concurrencia real, o necesidad clara de aislar/proteger antes de publicar.

1. **Objetivo fijado** en 1 frase en el TEAM asociado o en el primer commit de la rama.
2. **Dueno declarado**: agente responsable (p. ej. `@implementador`) o sesion.
3. **TTL declarado**: timestamp de caducidad (default 72h desde el ultimo commit; ver VIVIR).
4. **Ticket/TEAM asociado**: `.teams/active/TEAM_XXX_*` o entrada `HUB-XXX` de `docs/TODO.md`.
5. **Nombre kebab-case con prefijo** (preferencia `branch-naming`): `feature/`, `fix/`, `docs/`, `chore/`, `refactor/`, `release/`.
6. **Lease** si toca superficie `exclusive` o hay concurrencia: `exclusive`/`write` en `scripts/ai_coordination.py` (Rule 25).
7. **Coherencia rama<->diff** (preferencia `branch-scope-coherence`): no abrir rama tematica estrecha para diff transversal.

## VIVIR

- **Aviso de acumulacion**: mas de **5** ramas activas (local + remoto) avisa; no impide abrir una rama necesaria, guardar, publicar ni cerrar (preferencia `branch-limit`).
- **Caducidad automatica**: 72h sin commit -> marcada `caducada`. 7 dias sin renovacion -> `candidata a borrado` (preferencia `branch-ttl`). La caducidad **marca, no borra**: la rama de trabajo de una persona no se retira sola (operacion destructiva -> `ejecutar-operaciones-sensibles` + autorizacion humana). Lo unico que si se retira solo es la rama automatica de una tarea ya integrada, y solo por el barrendero `sweep --safe` con sus 5 garantias encadenadas (rama ya en `main`, arbol limpio, `cerebro/auto/*`, tag `rescate/` creado antes y mas de 24 h sin actividad); si falla una, se preserva. Detalle en [coordinar-sesiones-multi-ia](../coordinar-sesiones-multi-ia/SKILL.md).
- **Renovacion**: cualquier commit nuevo reinicia el TTL.
- **Evitar duplicados por tema**: preferir reutilizar la rama propia compatible; abrir otra no autoriza borrar ni cerrar trabajo ajeno.

## MERGER

Gate **`listo para mergear`** (hermano de `listo para publicar`). TRIVIAL/MEDIO limpio puede seguir autopiloto seguro; GRANDE/SENSIBLE/RELEASE queda protegido y no se integra sin autorizacion humana simple. Requisitos, semaforo, validaciones por tamano, estrategia de integracion (ff-only/--no-ff/squash), exclusiones por concurrencia y la regla `uno basta` en [merge-gate.md](merge-gate.md).

## CERRAR

Antes de fusionar o volver a main, acreditar la revision final de la rama fuente en el registro de coordinacion mediante heartbeat con identidad/fence propios desde esa rama. El cierre declarativo `complete integrated` debe comprobar una prueba nativa valida de esa revision; una rama main actual o un PR citado sin evidencia no la sustituyen. Sin prueba verificable conservar la tarea y declarar el pendiente; no inventar integracion ni usar el cierre como permiso de limpieza. Los controles de retirada de worktrees/ramas siguen siendo independientes y estrictos.

1. **Evaluar la rama tras fusionar**: incorporacion no implica borrado automatico. Conservarla si el propietario sigue trabajando o la equivalencia no esta demostrada; la politica de operaciones sensibles y la autorizacion aplicable gobiernan cualquier retirada. Comprobar contenido integrado, actividad y ownership antes de `git branch -d <rama>`; el borrado remoto requiere autorizacion especifica. Tras squash, `-d` puede rechazar aunque el contenido sea equivalente: no sustituir por `-D` por inercia.
2. El PR (si lo hubo) se cierra automaticamente al fusionar.
3. **Liberar el lease** en `ai_coordination.py` (`close --lease-id`).
4. Marcar el TEAM/`HUB-XXX`/issue como cerrado si el cambio lo completa.
5. En el hub: si fue release formal, regenerar `HUB_MANIFEST.json` + proyecciones (`globalize.ps1`/`sync-agent-projections.ps1`) antes de cerrar el TEAM.

# Deteccion de ramas sospechosas (umbrales deterministicos)

Marcar como candidatas a limpieza:

- **Caducada (>72h sin commit)** y **candidata a borrado (>7d sin renovacion)**: timestamp diff del ultimo commit (`git log -1 --format=%cI <rama>`).
- **Huerfana / fusionable**: `git diff --quiet main..<rama>` exit 0 (contenido en `main`) **O** `git branch --merged main` verdadero (merge-node). La disyuncion cubre squash (P2-1); ver [merge-gate.md](merge-gate.md).
- **Divergente (varios commits fuera de main, no fusionable)**: `git log main..<rama> --oneline | wc -l` >= `$CommitsParaDivergente` del script `audit-branches.ps1` (default **2**, `varios`); redefinible por SSOT local.
- **Nombre solapado con la rama activa**: tokens comunes >=60% del total de tokens unicos. **Algoritmo de tokenizacion (P3-V3)**: split del nombre por `/` y `-`, lower-case, coeficiente de Jaccard `|interseccion| / |union| >= 0.60`.
- **Misma finalidad que otra rama abierta**: pedir confirmacion de la rama canonica antes de seguir.
- **Umbral de mantenimiento superado**: mas de 5 ramas no fusionadas/cerradas; aviso, nunca veto por si solo.

**Orden de severidad de marcas solapadas** (una rama puede ser varias a la vez; reportar la mas severa + las secundarias): `candidata a borrado` > `caducada` > `divergente` > `redundante`.

# Reporte de higiene

Antes de integrar/publicar, reportar el inventario y distinguir avisos de mantenimiento de conflictos materiales del lote. Solo estos conflictos bloquean; superar el umbral o conservar ramas ajenas nunca obliga a limpiarlas para continuar. Los borrados siguen siendo operacion sensible.

# Nomenclatura de ramas nuevas (preferencia `branch-naming`)

- Kebab-case con prefijo semantico corto: `feature/`, `fix/`, `docs/`, `chore/`, `refactor/`, `release/` o equivalente local.
- No publicar cambios transversales en una rama tematica estrecha por inercia (preferencia `branch-scope-coherence`).
- Si hay varias IAs o IDEs editando a la vez, `git worktree` por tarea es obligatorio y debe registrarse lease con `scripts/ai_coordination.py`; rama sin worktree no protege el working tree fisico. Varias ramas en la misma carpeta no son paralelismo seguro.

EJEMPLO si la rama es `codex/heroui` pero el diff toca bootstrap, agentes y docs generales, mover el cambio a `main` o a una rama mas amplia antes de publicar.

# PR vs push directo (preferencia `solo-work-pr-policy`, evoluciona por tamano)

Espiritu: **trabajar solo != trabajar sin control; en solitario != sin trazabilidad**. El control se gradua por tamano, no se apaga.

| Situacion | Control obligatorio |
|---|---|
| TRIVIAL en solitario | `main` directo. Sin rama, sin PR. Si main protegida -> PR. |
| MEDIO en solitario | Desarrollo local-first. Al cierre, `main` directo si gate verde y main no protegida; rama efimera + gate `listo para mergear` si aporta control o hay validacion pendiente; PR si main protegida. |
| GRANDE/SENSIBLE/RELEASE (siempre, tambien en solitario) | PR obligatorio + gate `listo para mergear` + autorizacion humana simple antes de integrar/publicar formalmente. |
| Multi-colaborador o SSOT indica flujo por PR | PR siempre (regla preservada). |

**Forma minima de autorizacion humana por tamano**: MEDIO limpio no necesita preguntar mecanica Git si el gate esta verde; GRANDE/RELEASE -> toda instruccion que mencione el resultado material (`integra`, `mergea`, `publica release`, `saca version`) cuenta como explicita.

# Estados de PR

- `main` es rama de integracion por defecto salvo excepcion local.
- PR draft si falta QA, review, CI o cierre material.
- PR ready solo cuando el cierre sea suficiente.
- No mezclar PR incompleto con release formal.

# Coherencia con Rule 24/25/26

La concurrencia real entre IAs (leases, worktrees, merge train, superficies `exclusive`) esta definida en Rule 24/25/26 de `docs/AI_GLOBAL_RULES.md` y en la skill `coordinar-sesiones-multi-ia`. Esta referencia no duplica esas reglas: las invoca cuando la publicacion requiere coordinacion.
