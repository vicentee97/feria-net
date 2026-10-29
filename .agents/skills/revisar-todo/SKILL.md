---
name: revisar-todo
description: "Usar cuando el roadmap (docs/TODO.md) pueda estar desfasado respecto al codigo, los commits o el registro de coordinacion: AUDITA y REPORTA inconsistencias (marcado publicado sin commit, pendiente con codigo ya en main, workstreams sin coordinacion) con severidad, sin editar el roadmap; la correccion la ejecuta gestionar-roadmap. TRIGGERS: revisa el TODO, contrasta TODO, el TODO esta desfasado, auditar roadmap, roadmap desfasado, TODO no cuadra con codigo."
---

# Revisar TODO

# Frontera de la skill: AUDITA el roadmap, no lo corrige (LEER PRIMERO)

Esta skill es de auditoria del roadmap, no de ejecucion. La frontera es estricta:

- **REPORTA** inconsistencias entre el roadmap (`docs/TODO.md` o equivalente), el historial Git y el registro de coordinacion, con severidad `P1`/`P2`/`P3`.
- **NEVER** edita el roadmap, **NEVER** commitea, **NEVER** crea ni cierra entradas, **NEVER** mueve estados. La correccion la ejecuta `gestionar-roadmap`; la publicacion, `configurar-github`.
- Si el usuario pide corregir tras la auditoria, se cambia a `gestionar-roadmap`; esta skill no ejecuta la correccion.

Razon: una auditoria que corrige pierde su valor como checkpoint neutral. Ver [auditar-proyecto-tecnico/SKILL.md](../auditar-proyecto-tecnico/SKILL.md) para la misma frontera aplicada a configs y dependencias.

# Objetivo

Detectar drift entre el roadmap, el codigo y la coordinacion real del proyecto, reportando hallazgos con evidencia antes de que una entrada mal marcada induzca una publicacion, un cierre falso o trabajo duplicado.

# Anti-patrones y su correccion

Cada sesgo fuerte del entrenamiento base necesita su par MAL -> BIEN -> EJEMPLO.

- **Auditoria que corrige:** MAL empezar a tachar, mover o reescribir entradas del roadmap al detectar drift. BIEN reportar cada hallazgo con evidencia y derivar la correccion a `gestionar-roadmap`. EJEMPLO ver `[x]` sin commit y borrarlo a mano -> P1 de frontera; lo correcto es reportarlo.
- **Asumir convencion de commit sin verificar:** MAL marcar P1 "sin commit" sin haber grep'eado el `<ID-prefix>` en `git log`. BIEN buscar el `<commit-ref-format>` real antes de declarar inconsistencia. EJEMPLO reportar "TAREA-14 sin commit" sin correr `git log --grep "TAREA-14"` -> falso P1.
- **Confundir progreso con publicacion:** MAL tratar `<marcador-progreso>` (trabajo activo) como `<marcador-cierre>` (publicacion efectiva). BIEN distinguir los roles de la maquina de estados antes de clasificar. EJEMPLO `[~]` no implica commit de publicacion; `[x]` si lo exige.
- **Inflar lo cosmetico a critico:** MAL elevar un P3 (leyenda ausente) a P1. BIEN aplicar la puerta de materialidad: solo es P1 lo que puede inducir una publicacion, un cierre falso o trabajo duplicado. EJEMPLO "falta leyenda de marcadores" -> P3, no P1.
- **Opinar sin leer el roadmap real:** MAL dictaminar "el TODO esta desfasado" leyendo solo `git log --stat`. BIEN inventariar el roadmap completo, el `<registro-coordinacion>` y el log antes de clasificar. EJEMPLO auditoria sin abrir `docs/TODO.md` -> invalida.

# Maquina de estados: quien trabaja vs quien publica

El roadmap mezcla dos progresiones que la IA tiende a colapsar. Distinguirlas es la regla central de esta skill.

Roles abstractos (no importa el nombre concreto del agente en cada proyecto):

- `entry-owner`: define y mantiene la entrada (ID estable, descripcion accionable).
- `progress-marker`: marca que hay trabajo activo con `<marcador-progreso>` (p.ej. `[~]`). NO es publicacion.
- `publisher`: marca cierre/publicacion efectiva con `<marcador-cierre>` (p.ej. `[x]`) y debe dejar commit bajo `<commit-ref-format>`.
- `reviewer`: valida antes de publicar.

Regla critica: marcar progreso NO es publicar. Una entrada con `<marcador-progreso>` puede tener codigo en main (trabajo del `progress-marker`), pero solo el `<marcador-cierre>` exige commit de publicacion. Confundir ambos roles produce falsos cierres.

# Parametros del proyecto

Esta skill es generica. Antes de auditar, fijar los marcadores y convenciones del proyecto concreto (si no estan documentados, es ya un hallazgo P3):

- `<ID-prefix>`: prefijo de los identificadores de tarea (p.ej. `TASK-`, `ISSUE-`, `PRJ-`, `HUB-`, `TICKET-`).
- `<commit-ref-format>`: como se referencia una tarea en un commit (p.ej. `[TASK-XXX]`, `TASK-123:`, `feat: ... [TASK-XXX]`).
- `<marcador-pendiente>`: marca de entrada sin empezar (p.ej. `[ ]`).
- `<marcador-progreso>`: marca de trabajo activo, no publicacion (p.ej. `[~]`, `[-]`).
- `<marcador-cierre>`: marca de cerrado/publicado (p.ej. `[x]`).
- `<registro-coordinacion>`: donde vive el trabajo activo (p.ej. `.teams/active/`, issues del tracker, board del proyecto).
- `<scope-de-trabajo>`: ambito o modulo al que pertenece la entrada.

# Alcance y limites

- Audita el roadmap contrastandolo con `git log` y el `<registro-coordinacion>`.
- Reporta inconsistencias de marcadores, trazabilidad commit/entrada y correspondencia workstream/coordinacion.
- NEVER edita el roadmap ni commitea; derivar a `gestionar-roadmap`.
- No sustituye a `revisar-cambios` (audita el diff, no el roadmap) ni a `gestionar-roadmap` (corrige el roadmap).
- No audita configs ni dependencias (eso es `auditar-proyecto-tecnico`); no audita delegacion (eso es `auditar-orquestacion`).

# Inputs / contexto obligatorio

- [SSOT del repositorio](../docs/SSOT.md) y roadmap canonico (`docs/TODO.md` o equivalente declarado en la SSOT).
- `git log` reciente con el `<commit-ref-format>` del proyecto.
- `<registro-coordinacion>` activo (p.ej. `.teams/active/`) y `.questions/` si aplica.
- Leyenda de marcadores y convencion de commit, si estan documentadas en el propio roadmap.
- Skills hermanas: [gestionar-roadmap](../gestionar-roadmap/SKILL.md) (corrige), [auditar-proyecto-tecnico](../auditar-proyecto-tecnico/SKILL.md) (patron report-only), [revisar-cambios](../revisar-cambios/SKILL.md) (review del diff).

# Comportamiento esperado

## Fase 1 - Inventario

Leer el roadmap completo, fijar los parametros del proyecto (marcadores, `<ID-prefix>`, `<commit-ref-format>`, `<registro-coordinacion>`) y listar entradas por estado y `<scope-de-trabajo>`. Si los parametros no estan documentados en el propio roadmap, anotarlo como P3.

## Fase 2 - Cruce roadmap x git x coordinacion

Para cada entrada relevante: grep del `<ID-prefix>` en `git log`; cruzar workstreams activos del roadmap con el `<registro-coordinacion>`; verificar que cada `<marcador-cierre>` tiene commit y cada `<marcador-progreso>` esta respaldado por trabajo real.

## Fase 3 - Validaciones concretas

- `P1`: entrada con `<marcador-cierre>` (p.ej. `[x]`) sin commit bajo `<commit-ref-format>` en `git log`. Falso cierre.
- `P1`: entrada con `<marcador-pendiente>` (p.ej. `[ ]`) cuyo `<ID-prefix>` aparece en commits ya integrados en main. Cierre no registrado.
- `P2`: workstream activo en el roadmap sin correspondencia en el `<registro-coordinacion>`, o entrada del `<registro-coordinacion>` sin item en el roadmap. Trazabilidad rota.
- `P3`: falta leyenda de marcadores/estados al inicio del roadmap.
- `P3`: convencion `<commit-ref-format>` usada en commits pero no documentada en el roadmap.

## Fase 4 - Reporte

1. `Hallazgos` por severidad (`P1`/`P2`/`P3`), cada uno con ID, marcador y evidencia (commit ausente/presente, entrada del registro). Si no hay, decir "No he encontrado inconsistencias materiales".
2. `Estado`: `drift critico` (hay P1), `drift acotado` (solo P2/P3) o `alineado`.
3. `Siguiente paso`: correccion a `gestionar-roadmap`; cierre/publicacion a revisar con `configurar-github`.

# Cierre OBLIGATORIO: gate de auto-cita

Antes de declarar la auditoria lista, declarar (auto-cita con evidencia, no auto-evaluacion). Maximo 7 items:

- [ ] **Declaro** que lei el roadmap completo, `git log` y el `<registro-coordinacion>` reales (no memoria).
- [ ] **Declaro** que cada P1 cita el ID concreto, el marcador y la evidencia (commit ausente o presente bajo `<commit-ref-format>`).
- [ ] **Declaro** que distingui `<marcador-progreso>` de `<marcador-cierre>` (maquina de estados) antes de clasificar severidad.
- [ ] **Declaro** que aplique la puerta de materialidad (no infle cosmetico a P1) y evite cada anti-patron listado arriba.
- [ ] **Declaro** que NO edite el roadmap, NO commitee, NO cree ni cierre entradas; el siguiente paso queda en `gestionar-roadmap` o `configurar-github`.
- [ ] **Declaro** el resultado del gate de segunda IA (ver abajo).

## Gate de segunda IA (OBLIGATORIO, no sugerencia)

El agente que audita no es el que califica el impacto de la publicacion. Antes de cerrar:

- Si detecta entradas `<marcador-cierre>` sin commit -> escalar OBLIGATORIAMENTE a **@experto-github** (publicacion) o **@revisor** (riesgo material) antes de cualquier cierre.
- Si el drift revela roadmap estructuralmente roto (muchos P1, workstreams huerfanos) -> derivar a `gestionar-roadmap` para saneado, no cerrar como "solo reporte".
- Si es lectura puntual sin P1 -> sin segunda IA obligatoria (no burocracia innecesaria).

# Flujo recomendado

- [ ] Fijar parametros del proyecto (`<ID-prefix>`, `<commit-ref-format>`, marcadores, `<registro-coordinacion>`); anotar P3 si no estan documentados.
- [ ] Inventario completo del roadmap por estado y scope.
- [ ] Cruce roadmap x `git log` x `<registro-coordinacion>`; aplicar las validaciones P1/P2/P3.
- [ ] Resolver el gate de auto-cita y el gate de segunda IA.
- [ ] Emitir reporte con severidad, evidencia y siguiente paso; no editar ni publicar.

# Criterio de resultado bueno

Cierre valido cuando el gate de auto-cita de arriba se cumple con evidencia observable y el gate de segunda IA esta resuelto segun la tipificacion. Esta seccion no anade reglas: es el mirror declarativo del gate, repetido aqui solo porque `validate-hub-skills.ps1` exige el header. La senal observable es que cada hallazgo cita ID, marcador y evidencia, y que el roadmap no fue modificado.

## Triggers

- Keywords: revisa el TODO, contrasta TODO, el TODO esta desfasado, auditar roadmap, TODO desincronizado, roadmap desfasado, TODO no cuadra con codigo, roadmap no refleja el codigo, drift roadmap.
- Patrones de usuario: "revisa el TODO a ver si esta desfasado", "contrasta el roadmap con lo que hay commiteado", "el TODO no refleja el codigo real", "audita el roadmap antes de publicar", "hay entradas cerradas sin commit?".
- Encadenamiento: despues de `gestionar-roadmap` (mantiene el TODO) para verificar; antes de `configurar-github` para confirmar que los cierres tienen commit; hermana de `auditar-proyecto-tecnico` (mismo patron report-only) y `revisar-cambios` (review del diff).

# Ejemplos de activacion

- "Revisa el TODO a ver si esta desfasado respecto a lo que hay en main."
- "Contrasta el roadmap con los ultimos commits y dime inconsistencias, sin tocar nada."
- "El TODO esta desfasado: auditalo y reporta P1/P2/P3."
- "Antes de publicar, verifica que las entradas cerradas del roadmap tienen commit asociado."
