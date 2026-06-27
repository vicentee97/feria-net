-- ============================================================
-- V003__epica2_tpv.sql — FeriaNet epica 2 (caja diaria + TPV)
-- Esquema de venta local: cash_session, offer, sale, sale_line,
-- ticket y ticket_delivery_attempt.
--
-- Mapea 1:1 con docs/data-model.md §2.4..§2.9. Las decisiones
-- no triviales estan justificadas bloque a bloque mas abajo.
--
-- Decisiones tecnicas generales (consistentes con V001):
-- - IDs en TEXT (UUID v4). Permite portabilidad SQLite -> Postgres.
-- - Importes en INTEGER (centimos). Sin coma flotante, conversion
--   a euros en capa de presentacion.
-- - Fechas locales del operador en TEXT `YYYY-MM-DD` (cash_session.date).
-- - Timestamps UTC en TEXT ISO 8601 RFC 3339 (opened_at, created_at...).
-- - ON DELETE RESTRICT en todas las FK: protege trazabilidad
--   historica (no se borra una caja con ventas, etc.).
-- - Foreign keys enforced por `PRAGMA foreign_keys = ON` aplicado
--   en `db/pool.rs` al abrir la BD.
-- - Soft-delete solo donde la SSOT lo exige (Offer.is_active).
-- ============================================================


-- ============================================================
-- Tabla: cash_session
-- Caja diaria de una atraccion en una fecha concreta.
-- Unidad operativa del TPV: las ventas cuelgan de aqui.
-- Ver docs/data-model.md §2.5.
-- ============================================================
CREATE TABLE cash_session (
    id                  TEXT PRIMARY KEY NOT NULL,
    attraction_id       TEXT NOT NULL REFERENCES attraction(id) ON DELETE RESTRICT,
    date                TEXT NOT NULL,                   -- YYYY-MM-DD local
    opened_at           TEXT NOT NULL,                   -- ISO 8601 UTC
    closed_at           TEXT,                            -- ISO 8601 UTC, NULL mientras abierta
    opening_amount      INTEGER NOT NULL DEFAULT 0 CHECK(opening_amount >= 0),
    closing_amount      INTEGER CHECK(closing_amount >= 0),    -- NULL mientras abierta
    total_amount        INTEGER CHECK(total_amount >= 0),      -- NULL mientras abierta; congelado al cerrar

    -- Regla data-model §5.1: una sola caja por atraccion y dia.
    UNIQUE (attraction_id, date),

    -- Regla data-model §2.5 atributos: closed_at consistente.
    CHECK (closed_at IS NULL OR closed_at >= opened_at)
);

-- Indice UNIQUE parcial para "una sola caja ABIERTA por atraccion"
-- (data-model §5.2). Solo las filas con `closed_at IS NULL`
-- cuentan para la unicidad; las cerradas no.
-- Mensaje de error esperado: `UNIQUE constraint failed:
-- cash_session.attraction_id` (mismo patron que V002). El repo
-- `cash_sessions.rs` traduce ese mensaje a `AppError::CashSessionAlreadyOpen`.
CREATE UNIQUE INDEX idx_cash_session_one_open_per_attraction
  ON cash_session (attraction_id)
  WHERE closed_at IS NULL;

CREATE INDEX idx_cash_session_date ON cash_session (date);


-- ============================================================
-- Tabla: offer
-- Bundle con precio especial dentro de una edicion de feria.
-- Una venta puede aplicar como maximo una oferta (data-model §2.4).
-- Ver docs/data-model.md §2.4.
-- ============================================================
CREATE TABLE offer (
    id                  TEXT PRIMARY KEY NOT NULL,
    fair_edition_id     TEXT NOT NULL REFERENCES fair_edition(id) ON DELETE RESTRICT,
    name                TEXT NOT NULL CHECK(length(name) <= 80),
    bundle_quantity     INTEGER NOT NULL CHECK(bundle_quantity >= 1),
    bundle_price_cents  INTEGER NOT NULL CHECK(bundle_price_cents >= 0),
    is_active           INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1))
);

CREATE INDEX idx_offer_edition       ON offer (fair_edition_id);
CREATE INDEX idx_offer_edition_active ON offer (fair_edition_id, is_active);


-- ============================================================
-- Tabla: sale
-- Transaccion de venta dentro de una caja.
-- `total_amount` se calcula al crear la venta y se congela
-- (inmutable: no se modifica despues, ver data-model §2.6).
-- Si `offer_id` IS NOT NULL, el total es el precio del bundle
-- (no la suma de lineas). Ver repositorio `sales.rs`.
-- Ver docs/data-model.md §2.6.
-- ============================================================
CREATE TABLE sale (
    id                  TEXT PRIMARY KEY NOT NULL,
    cash_session_id     TEXT NOT NULL REFERENCES cash_session(id) ON DELETE RESTRICT,
    offer_id            TEXT REFERENCES offer(id) ON DELETE RESTRICT,    -- NULL = sin oferta
    created_at          TEXT NOT NULL,                                    -- ISO 8601 UTC
    total_amount_cents  INTEGER NOT NULL CHECK(total_amount_cents >= 0)
);

CREATE INDEX idx_sale_cash_session ON sale (cash_session_id);
CREATE INDEX idx_sale_offer        ON sale (offer_id);
CREATE INDEX idx_sale_created_at   ON sale (created_at);


-- ============================================================
-- Tabla: sale_line
-- Linea de venta: N tickets a un precio unitario.
-- Modelo aplicado (decision documentada en repositorio):
-- - Sin oferta: `line_total_cents = quantity * unit_price_cents`.
-- - Con oferta: la unica linea tiene `unit_price_cents = 0`
--   y `quantity = offer.bundle_quantity`; el cobro lo totaliza
--   la oferta (ver §5.4 data-model). Esto simplifica reglas de
--   integridad: el cobro siempre vive en `sale.total_amount_cents`.
-- Ver docs/data-model.md §2.7.
-- ============================================================
CREATE TABLE sale_line (
    id                  TEXT PRIMARY KEY NOT NULL,
    sale_id             TEXT NOT NULL REFERENCES sale(id) ON DELETE RESTRICT,
    quantity            INTEGER NOT NULL CHECK(quantity >= 1),
    unit_price_cents    INTEGER NOT NULL CHECK(unit_price_cents >= 0),
    line_total_cents    INTEGER NOT NULL CHECK(line_total_cents >= 0)
);

CREATE INDEX idx_sale_line_sale ON sale_line (sale_id);


-- ============================================================
-- Tabla: ticket
-- Representacion logica del ticket fisico entregado al cliente.
-- Una linea con quantity N genera N filas en `ticket`
-- (una por ticket fisico, quantity=1 por fila). Esto hace que
-- `ticket.id` sea la clave de idempotencia del modulo
-- `ticket-delivery` (reimprimir uno, no un bloque).
--
-- La venta NUNCA entrega directamente: el `ticket-delivery`
-- (epica 3) consulta estos tickets y registra intentos en
-- `ticket_delivery_attempt`.
--
-- Decisiones de campos:
-- - `delivery_status`, `delivery_attempts`, `last_delivery_error`
--   NO se incluyen en esta migracion. La epica 3 los anade por
--   una migracion V00X con ALTER TABLE ADD COLUMN (sin ALTER
--   destructivo). Mantener V003 limpia evita lock-in.
-- - Se denormalizan `cash_session_id`, `fair_edition_id` y
--   `attraction_id` para que informes y sync lean de una sola
--   tabla sin joins profundos (data-model §2.8 nota + §3).
--
-- Ver docs/data-model.md §2.8.
-- ============================================================
CREATE TABLE ticket (
    id                  TEXT PRIMARY KEY NOT NULL,
    sale_id             TEXT NOT NULL REFERENCES sale(id) ON DELETE RESTRICT,
    sale_line_id        TEXT NOT NULL REFERENCES sale_line(id) ON DELETE RESTRICT,
    -- Denormalizaciones para informes rapidos y sync (data-model §2.8).
    cash_session_id     TEXT NOT NULL REFERENCES cash_session(id) ON DELETE RESTRICT,
    fair_edition_id     TEXT NOT NULL REFERENCES fair_edition(id) ON DELETE RESTRICT,
    attraction_id       TEXT NOT NULL REFERENCES attraction(id) ON DELETE RESTRICT,
    created_at          TEXT NOT NULL,                                -- ISO 8601 UTC
    quantity            INTEGER NOT NULL DEFAULT 1 CHECK(quantity >= 1),
    unit_price_cents    INTEGER NOT NULL CHECK(unit_price_cents >= 0),
    total_cents         INTEGER NOT NULL CHECK(total_cents >= 0)
);

CREATE INDEX idx_ticket_sale_line       ON ticket (sale_line_id);
CREATE INDEX idx_ticket_sale            ON ticket (sale_id);
CREATE INDEX idx_ticket_cash_session    ON ticket (cash_session_id);
CREATE INDEX idx_ticket_attraction      ON ticket (attraction_id);
CREATE INDEX idx_ticket_fair_edition    ON ticket (fair_edition_id);


-- ============================================================
-- Tabla: ticket_delivery_attempt
-- Historial de intentos de entrega por ticket. La venta registra
-- UN placeholder inicial (delivery_kind='noop', outcome='failure',
-- error_code='unknown', error_detail='pending') para que el modulo
-- `ticket-delivery` (epica 3) lo consulte y actualice. El contrato
-- sigue docs/data-model.md §2.9: la epica 3 escribe mas filas sin
-- necesitar migracion.
--
-- Notas de diseno:
-- - `delivery_kind` y `outcome` son TEXT con CHECK para mantener
--   la lista cerrada y detectar valores no esperados en desarrollo.
--   Los valores siguen docs/data-model.md §2.9 al pie de la letra:
--     delivery_kind IN ('thermal', 'rfid', 'noop', 'file', 'unknown')
--     outcome      IN ('success', 'failure')
--     error_code   IN ('offline', 'out_of_paper', 'jammed',
--                      'timeout', 'unknown', 'none')
-- - `error_code = 'none'` significa "no hubo error" (un success
--   sin codigo). Asi se distingue de `error_code = 'unknown'`
--   que indica exito parcial / falta de codigo concreto.
-- - `payload` queda como BLOB para soportar los bytes crudos
--   que el driver ESC/POS envie (data-model §2.9).
-- - Tamanio del payload capado a 4 KB con CHECK (alineado con
--   data-model §2.9; SQLite no valida longitud de BLOB nativamente,
--   se valida en capa de aplicacion al insertar).
--
-- Ver docs/data-model.md §2.9.
-- ============================================================
CREATE TABLE ticket_delivery_attempt (
    id                  TEXT PRIMARY KEY NOT NULL,
    ticket_id           TEXT NOT NULL REFERENCES ticket(id) ON DELETE RESTRICT,
    attempted_at        TEXT NOT NULL,                                -- ISO 8601 UTC
    delivery_kind       TEXT NOT NULL CHECK(delivery_kind IN
                            ('thermal', 'rfid', 'noop', 'file', 'unknown')),
    outcome             TEXT NOT NULL CHECK(outcome IN ('success', 'failure')),
    error_code          TEXT NOT NULL CHECK(error_code IN
                            ('offline', 'out_of_paper', 'jammed', 'timeout',
                             'unknown', 'none')),
    error_detail        TEXT CHECK(error_detail IS NULL OR length(error_detail) <= 300),
    payload             BLOB                                           -- bytes ESC/POS o similar
);

CREATE INDEX idx_ticket_delivery_attempt_ticket       ON ticket_delivery_attempt (ticket_id);
CREATE INDEX idx_ticket_delivery_attempt_attempted_at ON ticket_delivery_attempt (attempted_at);