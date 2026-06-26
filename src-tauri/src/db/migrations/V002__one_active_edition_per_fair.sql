-- ============================================================
-- V002__one_active_edition_per_fair.sql — FeriaNet
-- Garantiza la invariante data-model §2.2 y §5.10:
--   "Una sola edición por feria puede estar `active` simultáneamente."
--
-- Implementación: índice UNIQUE parcial en SQLite.
-- Atomicidad: si una operacion intenta activar dos ediciones de la
-- misma feria, SQLite devuelve UNIQUE constraint failed y aborta la
-- transaccion, sin posibilidad de inconsistencia.
--
-- Antes de esta migracion la regla solo estaba protegida en la UI
-- (ActivateEditionDialog) y la secuencia "cerrar otra + activar" no
-- era transaccional. Con V002 la regla es estructural.
--
-- Soporte: indices parciales existen en SQLite desde 3.8.0
-- (2013-08-26). El rusqlite que usa el proyecto (feature `bundled`)
-- embebe SQLite estatico reciente, sin restricciones.
--
-- Notas de diseno:
-- - El predicado `status = 'active'` hace que `planned` y `closed`
--   no entren en el indice. Por la regla UNIQUE de SQLite, una fila
--   no indexada (NULL en la entrada del indice) no cuenta para la
--   unicidad, por lo que pueden coexistir N ediciones no-activas.
-- - El indice se nombra `idx_fair_edition_one_active_per_fair` para
--   identificarlo en logs y en el mensaje de error. SQLite no incluye
--   el nombre del indice en el error de UNIQUE sobre columnas (solo
--   sobre indices con expresiones); por eso `repository/editions.rs`
--   diferencia este caso del UNIQUE `(fair_id, year)` por el formato
--   de las columnas, no por el nombre del indice.
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_fair_edition_one_active_per_fair
  ON fair_edition (fair_id)
  WHERE status = 'active';