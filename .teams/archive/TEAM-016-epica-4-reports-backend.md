# TEAM-016 — Épica 4 backend: informes (daily / feria / comparativa interanual)

- ID: TEAM-016
- Nombre: Épica 4 backend: queries agregadas + commands Tauri para informes
- Fecha creacion: 2026-06-28
- Estado: cerrado

## Descripcion

Cierra el backend de la épica 4 (Informes v1) implementando las queries
agregadas SQLite y los commands Tauri para los tres informes que el MVP
promete: informe por día, informe por feria (rango de fechas) y comparativa
interanual. NO incluye frontend (TEAM-017) ni smoke E2E (QA posterior).

## Objetivo

- Tipos de dominio para informes expuestos al frontend via Tauri IPC.
- 3 queries SQL agregadas correctas, robustas al cross-product del JOIN
  `sale -> sale_line` y compatibles con el soft-delete de atracciones.
- 3 commands Tauri registrados en `invoke_handler` con validación de
  entrada (UUIDs y fechas ISO 8601).
- Suite de tests `#[cfg(test)]` con BD in-memory que cubre los casos
  críticos (0 ventas, ventas normales, soft-delete, multiple ediciones).

## Contexto

- Docs leídos:
  - `docs/SSOT.md` (taxonomía y principios; "comparativa interanual es
    capacidad de v1").
  - `docs/data-model.md` §2.5–§2.9 (caja, venta, líneas, tickets).
  - `docs/TODO.md` épica 4 (Informes v1).
  - `docs/REGLAS_PROYECTO.md` (convenciones de commits y prohibido
    versionar).
- Supuestos:
  - Las migraciones V001–V003 son la fuente de verdad del esquema; no
    se añaden migraciones nuevas.
  - Money en céntimos INTEGER. Tickets 1 fila por ticket físico
    (V003 §ticket). Modelo bundle: `sale_line.unit_price_cents = 0`
    con oferta (V003 §sale_line).
  - `attraction.is_active = 0` (soft-delete) NO aparece en informes,
    coherente con el resto de listados operativos.
- Dependencias: `TEAM-009` (V003 TPV) y `TEAM-012` (`ticket-delivery`)
  ya cerradas; este TEAM solo lee datos.

## Trabajo realizado

- Tipos nuevos en `domain/report.rs`: `ReportTotals`, `AttractionReport`,
  `DayReport`, `DailyReport`, `FeriaReport`, `ComparativeEdition`,
  `ComparativeReport`. Todos `Serialize` para Tauri IPC.
- Repositorio `db/repository/reports.rs` con 3 funciones:
  - `get_daily_report(conn, edition_id, date)`.
  - `get_feria_report(conn, edition_id, from_date, to_date)`.
  - `get_comparative_report(conn, fair_id)`.
- CTE `sale_tickets` pre-agrega `sale_line.quantity` por `sale_id` para
  evitar el cross-product del LEFT JOIN `sale -> sale_line`. Sin esta
  CTE, `SUM(s.total_amount_cents)` se multiplicaba por el número de
  líneas de cada venta, descuadrando los totales.
- LEFT JOINs desde `attraction` (daily, comparativa) o `cash_session`
  (feria por día) para incluir entidades sin ventas con totales a 0.
- Filtro `attraction.is_active = 1` en todas las queries para respetar
  el soft-delete.
- 10 tests `#[cfg(test)]` con BD in-memory y migraciones reales
  aplicadas vía `rusqlite_migration::Migrations`. Verifica:
  - 0 ventas, ventas normales, soft-delete, rango vacío, agregación
    entre días, comparativa 1/N ediciones, división segura en
    `avg_daily_amount_cents`.
  - `NotFound` para `edition_id` y `fair_id` inexistentes.
- 3 commands Tauri `commands/reports.rs` con validación de UUIDs y
  fechas ISO 8601; `from_date <= to_date` en `get_feria_report`.
- Registro de los 3 commands en `lib.rs::invoke_handler` después de
  `cmd_delivery::*`, manteniendo el orden por dominio.

## Archivos tocados

- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\domain\report.rs` (nuevo)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\domain\mod.rs` (modificado)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\db\repository\reports.rs` (nuevo)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\db\repository\mod.rs` (modificado)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\commands\reports.rs` (nuevo)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\commands\mod.rs` (modificado)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\lib.rs` (modificado)

## Coordinacion

No aplica Rule 25: el trabajo se realizo en `main` siguiendo el patrón
de las épicas 1–3 (cada TEAM commit directo a `main` sin worktree, ya
que el proyecto no tenía paralelismo activo en esta máquina).

## Criterios de cierre

- [x] `cargo check --bin feria-net --tests` sin warnings.
- [x] `cargo build --bin feria-net` sin warnings.
- [x] `cargo test --lib` 31 tests pasan (10 nuevos + 21 previos).
- [x] 3 commands Tauri registrados en `invoke_handler`.
- [x] Tipos `Serialize` listos para frontend.
- [x] Sin migraciones nuevas, sin docs canónicos modificados, sin
      frontend tocado, sin dependencias añadidas.

## Riesgos

Ninguno material.

Riesgos menores (visibles pero no bloqueantes):
- El frontend aún no consume los 3 commands (TEAM-017 pendiente).
- No se ha hecho smoke E2E desde la app Tauri en ejecución; los
  tests unitarios cubren la lógica SQL y de agregación en Rust, pero
  no el handshake Tauri IPC. `@qa-validador` debe cubrir ese smoke.

## Decisiones materiales

- **CTE `sale_tickets`** (en vez del SQL de referencia del brief) para
  evitar cross-product del LEFT JOIN `sale -> sale_line`. Sin la CTE,
  `SUM(s.total_amount_cents)` se multiplicaba por el número de líneas
  por venta, dando totales incorrectos. P1 evitado, P2 reportado.
- **Filtro `is_active = 1`** en todas las queries: una atracción
  borrada lógicamente NO aparece en informes aunque tenga ventas
  históricas. Es coherente con el resto del proyecto (la UI tampoco
  muestra inactivas en listados operativos).
- **FeriaReport** usa dos queries en vez de una: una para el
  desglose `(date, attraction)` que agrupa en Rust, y otra para
  `by_attraction` (LEFT JOIN desde `attraction`). Permite incluir
  atracciones sin caja abierta en `by_attraction` y excluir días sin
  operación de `days`.
- **`days` solo lista días operados** (con caja abierta), no el
  calendario completo del rango. Un día sin operación no aparece;
  un "informe por feria" lista días con ventas, no días vacíos.
- **`by_attraction` en FeriaReport** sí incluye las atracciones sin
  caja abierta en el rango, con totales a 0. Es coherente con
  DailyReport (que también las lista).
- **No se modifica `sales.rs` ni `cash_sessions.rs`**, aunque las
  funciones de informe son esencialmente de solo lectura. Esto evita
  invasiones de responsabilidades y mantiene el repo como capa
  compartida para futuras épicas.

## Desviaciones del brief

- **P2 — Query SQL del brief (cross-product).** Las 3 queries del brief
  original producen totales incorrectos cuando una venta tiene varias
  líneas (`SUM(s.total_amount_cents)` cuenta varias veces). Se
  reescribieron con CTE `sale_tickets` para neutralizar el
  cross-product. No es un cambio de comportamiento para el usuario,
  es un fix de correctness.
- **P3 — Tests en módulo separado.** El brief sugiere un commit
  separado para tests (`test(reports): tests de las queries
  agregadas`). Como los tests viven dentro de `reports.rs`
  (`#[cfg(test)] mod tests`), van en el mismo commit que el repo
  (`feat(repo): ...`). Es la convención que usa el resto del proyecto
  (p. ej. `sales.rs`).

## Evidencia

- `cargo check --bin feria-net --tests` -> `Finished dev profile`,
  sin warnings.
- `cargo build --bin feria-net` -> `Finished dev profile`, sin
  warnings.
- `cargo test --lib` -> `31 passed; 0 failed; 0 ignored`.
  - 10 tests nuevos en `db::repository::reports::tests`.
  - 21 tests previos (delivery, etc.) siguen pasando.
- Commits en `main` (todos pusheados a `origin`):
  - `4a482c6` feat(domain): tipos para informes (DailyReport, FeriaReport, ComparativeReport)
  - `8cf8e09` feat(repo): queries SQL agregadas para informes + tests de cobertura
  - `0b8544d` feat(commands): commands Tauri get_daily_report, get_feria_report, get_comparative_report
  - `bcfc928` chore(tauri): registra los 3 nuevos commands en invoke_handler

## Proximo paso

@implementador arranca TEAM-017: frontend con `/informes`, 3 vistas
(diario / feria / comparativa), gráficos Recharts, exportación CSV
client-side sobre los 3 commands ya disponibles.
@qa-validador ejecuta smoke E2E de la épica 4.
@revisor revisa riesgos materiales.
@orquestador consolida y propone la épica 5 (sync).