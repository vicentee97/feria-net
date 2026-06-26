-- ============================================================
-- V001__init.sql — FeriaNet epica 1
-- Esquema inicial: Fair, FairEdition, Attraction.
-- Mapea 1:1 con docs/data-model.md (capitulos 2.1, 2.2, 2.3).
--
-- Decisiones tecnicas:
-- - IDs en TEXT (UUID v4) para portabilidad maxima entre SQLite
--   local y el backend cloud (Supabase Postgres TEXT).
-- - Precios en INTEGER (centimos) para evitar errores de coma
--   flotante. La conversion a euros ocurre en la capa de
--   presentacion.
-- - Fechas como TEXT en ISO 8601 (YYYY-MM-DD para fechas locales
--   del operador; YYYY-MM-DDTHH:MM:SSZ para timestamps UTC).
-- - Soft-delete solo donde la SSOT lo define (Attraction.is_active).
-- - ON DELETE RESTRICT en claves foraneas: no se borra una feria
--   con ediciones, ni una edicion con atracciones. Esto protege
--   la trazabilidad historica.
-- ============================================================

-- ============================================================
-- Tabla: fair
-- Feria generica (sin año). Una Fair agrupa N FairEdition anuales.
-- Ver docs/data-model.md §2.1.
-- ============================================================
CREATE TABLE fair (
    id         TEXT PRIMARY KEY NOT NULL,
    name       TEXT NOT NULL CHECK(length(name) <= 120),
    created_at TEXT NOT NULL, -- ISO 8601 UTC, ej. 2026-06-26T18:00:00Z
    notes      TEXT CHECK(length(notes) <= 500)
);

-- Indice para busqueda case-insensitive en espanol (LOWER + LIKE).
-- Ver repo::fairs::suggest_fair_by_name.
CREATE INDEX idx_fair_name ON fair (name COLLATE NOCASE);

-- ============================================================
-- Tabla: fair_edition
-- Edicion anual concreta de una feria. Unidad organizativa del TPV.
-- Ver docs/data-model.md §2.2.
-- ============================================================
CREATE TABLE fair_edition (
    id         TEXT PRIMARY KEY NOT NULL,
    fair_id    TEXT NOT NULL REFERENCES fair(id) ON DELETE RESTRICT,
    year       INTEGER NOT NULL CHECK(year BETWEEN 1900 AND 2100),
    start_date TEXT NOT NULL, -- ISO 8601 YYYY-MM-DD (fecha local del operador)
    end_date   TEXT NOT NULL, -- ISO 8601 YYYY-MM-DD
    status     TEXT NOT NULL CHECK(status IN ('planned', 'active', 'closed')),
    created_at TEXT NOT NULL, -- ISO 8601 UTC
    -- Regla critica: misma feria + mismo año = una sola edicion.
    -- Es la base de la comparativa interanual.
    UNIQUE (fair_id, year),
    -- end_date no puede ser anterior a start_date.
    CHECK (end_date >= start_date)
);

CREATE INDEX idx_fair_edition_year   ON fair_edition (year);
CREATE INDEX idx_fair_edition_status ON fair_edition (status);
CREATE INDEX idx_fair_edition_fair   ON fair_edition (fair_id);

-- ============================================================
-- Tabla: attraction
-- Atraccion por edicion de feria. No hay atracciones globales.
-- Ver docs/data-model.md §2.3.
-- ============================================================
CREATE TABLE attraction (
    id                  TEXT PRIMARY KEY NOT NULL,
    fair_edition_id     TEXT NOT NULL REFERENCES fair_edition(id) ON DELETE RESTRICT,
    name                TEXT NOT NULL CHECK(length(name) <= 80),
    -- Color hex #RRGGBB. GLOB valida exactamente 6 digitos hex tras #.
    color               TEXT NOT NULL CHECK(color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
    -- Precio base del ticket en CENTIMOS. INTEGER para evitar floats.
    -- Conversion a euros en presentacion: euros = cents / 100.
    base_ticket_price   INTEGER NOT NULL CHECK(base_ticket_price >= 0),
    -- Soft-delete. 1 = activa, 0 = borrada logicamente.
    -- Por defecto 1 (activa) en toda creacion.
    is_active           INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1))
);

CREATE INDEX idx_attraction_edition ON attraction (fair_edition_id);
CREATE INDEX idx_attraction_active  ON attraction (is_active);
