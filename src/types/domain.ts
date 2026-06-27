/**
 * types/domain.ts — FeriaNet
 *
 * Espejo en TypeScript de los tipos del backend Rust
 * (src-tauri/src/domain/*.rs). Cualquier cambio aqui debe
 * coordinarse con un cambio equivalente en backend.
 *
 * Convenciones:
 *  - `id`: UUID v4 en formato string canonico (sin comillas, lowercase).
 *  - `created_at` / `opened_at` / `closed_at` / `issued_at`: timestamp
 *    ISO 8601 UTC con offset `Z`.
 *  - Fechas locales (`start_date`, `end_date`, `date`): YYYY-MM-DD.
 *  - `color`: hex `#RRGGBB` (6 digitos, sin alpha).
 *  - Importes monetarios: **centimos** (entero). Convertir a EUR en UI
 *    con `src/lib/money.ts`. El sufijo `_cents` del backend se mantiene
 *    en TS para reflejar literalmente las claves del JSON. Excepcion
 *    historica: `Ticket.total_cents` (sin sufijo, data-model §2.8).
 */

// ============================================================
// Entidades — Feria / Edicion / Atraccion (epica 1)
// ============================================================

export interface Fair {
  id: string;
  name: string;
  notes: string | null;
  created_at: string;
}

/**
 * Estado operativo de una edicion de feria.
 *  - `planned`: prevista para el futuro, aun no operativa.
 *  - `active`:  operativa (cajas abiertas o ventas en curso).
 *  - `closed`:  cerrada.
 */
export type FairEditionStatus = "planned" | "active" | "closed";

export interface FairEdition {
  id: string;
  fair_id: string;
  year: number;
  /** Fecha local del operador en formato YYYY-MM-DD. */
  start_date: string;
  /** Fecha local del operador en formato YYYY-MM-DD. */
  end_date: string;
  status: FairEditionStatus;
  created_at: string;
}

export interface Attraction {
  id: string;
  fair_edition_id: string;
  name: string;
  /** Hex `#RRGGBB`. Validado por CHECK en BD. */
  color: string;
  /** Precio base del ticket en CENTIMOS (entero). */
  base_ticket_price: number;
  is_active: boolean;
}

// ============================================================
// Entidades — Caja / Oferta / Venta (epica 2)
// ============================================================

/**
 * Caja diaria de una atraccion. Unidad operativa del TPV: las
 * ventas cuelgan de aqui. Ver `docs/data-model.md` §2.5.
 *
 * Reglas (enforced en backend):
 * - Una sola caja ABIERTA por atraccion simultaneamente.
 * - Una sola caja por atraccion y dia (cerrada o no).
 * - `closed_at IS NULL` => caja abierta.
 */
export interface CashSession {
  id: string;
  attraction_id: string;
  /** Fecha local del operador (YYYY-MM-DD). */
  date: string;
  /** Momento exacto de apertura (UTC ISO 8601). */
  opened_at: string;
  /** Momento exacto de cierre (UTC ISO 8601). `null` mientras abierta. */
  closed_at: string | null;
  /** Fondo inicial en CENTIMOS. */
  opening_amount_cents: number;
  /** Importe declarado al cierre en CENTIMOS. `null` mientras abierta. */
  closing_amount_cents: number | null;
  /**
   * Suma de ventas registradas, congelada al cerrar. `null` mientras
   * la caja sigue abierta.
   */
  total_amount_cents: number | null;
}

/**
 * Oferta / bundle. `N` tickets por un precio fijo. Vive dentro de
 * una edicion de feria. Ver `docs/data-model.md` §2.4.
 *
 * Una venta puede aplicar como mucho una oferta (data-model §5.4).
 */
export interface Offer {
  id: string;
  fair_edition_id: string;
  name: string;
  /** Numero de tickets del bundle. >= 1. */
  bundle_quantity: number;
  /** Precio total del bundle en CENTIMOS. >= 0. */
  bundle_price_cents: number;
  /** Soft-delete. `false` = borrado logico (no aparece en TPV). */
  is_active: boolean;
}

/**
 * Venta dentro de una caja. Contiene 1 o N `SaleLine`. Si tiene
 * `offer_id`, el total es el del bundle, no la suma de lineas.
 * Ver `docs/data-model.md` §2.6.
 *
 * Modelo bundle (decidido en backend V003):
 * - Sin oferta: `total_amount_cents = sum(line_total_cents)`.
 * - Con oferta: 1 sola `SaleLine` con `quantity = bundle_quantity`,
 *   `unit_price_cents = 0`, `line_total_cents = 0`; el cobro vive en
 *   `total_amount_cents = offer.bundle_price_cents`.
 */
export interface Sale {
  id: string;
  cash_session_id: string;
  /** `null` = venta sin oferta. */
  offer_id: string | null;
  /** Momento exacto de la venta (UTC ISO 8601). */
  created_at: string;
  /** Total cobrado en CENTIMOS. Inmutable tras crear la venta. */
  total_amount_cents: number;
}

/**
 * Linea de venta. Cantidad de tickets a un precio unitario.
 * Ver `docs/data-model.md` §2.7.
 *
 * Modelo bundle: con oferta aplicada, `unit_price_cents = 0` y
 * `line_total_cents = 0` (el cobro es el bundle en `Sale.total_amount_cents`).
 */
export interface SaleLine {
  id: string;
  sale_id: string;
  /** Numero de tickets. >= 1. */
  quantity: number;
  /** Precio por ticket en CENTIMOS. >= 0. */
  unit_price_cents: number;
  /** `quantity * unit_price_cents` (puede ser 0 con oferta). */
  line_total_cents: number;
}

/**
 * Ticket fisico emitido. UNA fila = UN ticket fisico. Una `SaleLine`
 * con `quantity = N` genera N filas en `ticket` (cada una con
 * `quantity = 1`).
 *
 * Ver `docs/data-model.md` §2.8. La epica 3 anadira `delivery_status`,
 * `delivery_attempts` y `last_delivery_error` via `ALTER TABLE ADD COLUMN`
 * (sin migracion destructiva).
 *
 * Decisiones tomadas en V003 (epica 2):
 * - Se denormalizan `sale_id`, `sale_line_id`, `cash_session_id`,
 *   `fair_edition_id` y `attraction_id` para que informes y sync lean
 *   sin joins profundos (data-model §2.8, §3).
 * - `total_cents` SIN sufijo `_cents` (mantenido por data-model canónico).
 */
export interface Ticket {
  id: string;
  sale_id: string;
  sale_line_id: string;
  /** Denormalizado: caja de origen (data-model §2.8). */
  cash_session_id: string;
  /** Denormalizado: edicion de la feria (data-model §2.8). */
  fair_edition_id: string;
  /** Denormalizado: atraccion (data-model §2.8). */
  attraction_id: string;
  created_at: string;
  /** Tickets representados por esta fila. Por defecto 1. */
  quantity: number;
  unit_price_cents: number;
  /** Importe del ticket en CENTIMOS. `unit_price_cents * quantity`. */
  total_cents: number;
}

/**
 * Venta completa con lineas y tickets populados. Devuelto por
 * `create_sale` y `get_sale`. La UI lo usa para mostrar el ticket /
 * comprobante de la venta.
 */
export interface SaleWithLines {
  sale: Sale;
  lines: SaleLine[];
  tickets: Ticket[];
}

// ============================================================
// Inputs (espejo de src-tauri/src/commands/*.rs)
// ============================================================

/** Input para `create_fair`. */
export interface CreateFairInput {
  name: string;
  notes?: string | null;
}

/**
 * Input para `update_fair`.
 *
 * El campo `notes` distingue 3 estados gracias al doble Option del backend:
 *  - `undefined`  -> no tocar.
 *  - `null`       -> poner a NULL (borrar notas).
 *  - `string`     -> actualizar a `s`.
 */
export interface UpdateFairInput {
  name?: string;
  notes?: string | null;
}

/** Input para `create_attraction`. */
export interface CreateAttractionInput {
  fair_edition_id: string;
  name: string;
  color: string;
  /** Precio en CENTIMOS. */
  base_ticket_price: number;
}

/** Input para `update_attraction`. Campos `undefined` no se tocan. */
export interface UpdateAttractionInput {
  name?: string;
  color?: string;
  base_ticket_price?: number;
}

/**
 * Input para `create_fair_edition`.
 *
 * NO contiene `fair_id`: llega como argumento separado del command
 * (`fair_id: String` en Rust). Encaja con la firma
 * `createFairEdition(fairId, input)` del frontend.
 */
export interface CreateFairEditionInput {
  year: number;
  /** ISO 8601 `YYYY-MM-DD` (fecha local del operador). */
  start_date: string;
  /** ISO 8601 `YYYY-MM-DD`. */
  end_date: string;
  status: FairEditionStatus;
}

/**
 * Input para `update_fair_edition`. Campos `undefined` no se tocan.
 * Refleja `Partial<Omit<FairEdition, "id" | "fair_id" | "created_at">>`.
 * `fair_id` no es actualizable: la edicion queda ligada a la feria
 * bajo la que fue creada.
 */
export interface UpdateFairEditionInput {
  year?: number;
  start_date?: string;
  end_date?: string;
  status?: FairEditionStatus;
}

/** Input para `open_cash_session`. */
export interface CreateCashSessionInput {
  attraction_id: string;
  /** ISO 8601 `YYYY-MM-DD` (fecha local del operador). */
  date: string;
  /** Fondo inicial en CENTIMOS. */
  opening_amount_cents: number;
}

/** Input para `close_cash_session`. */
export interface CloseCashSessionInput {
  /** Importe declarado por el operador al cierre en CENTIMOS. */
  closing_amount_cents: number;
}

/** Input para `create_offer`. */
export interface CreateOfferInput {
  fair_edition_id: string;
  name: string;
  /** Numero de tickets del bundle. >= 1. */
  bundle_quantity: number;
  /** Precio total del bundle en CENTIMOS. >= 0. */
  bundle_price_cents: number;
}

/**
 * Input para `update_offer`. Campos `undefined` no se tocan.
 * Refleja `Partial<CreateOfferInput>`.
 */
export interface UpdateOfferInput {
  name?: string;
  bundle_quantity?: number;
  bundle_price_cents?: number;
}

// ============================================================
// ticket-delivery (epica 3 / TEAM-012)
// ============================================================
//
// Espejo del modulo `src-tauri/src/domain/ticket_delivery_attempt.rs`
// y de los outputs de `src-tauri/src/commands/delivery.rs`.
// NO exponemos `TicketDeliveryAttempt` como entidad: el backend no
// expone un command para listar el historial de intentos, y la UI
// solo necesita `PrintTicketResult` + `RetryResult` para operar
// (auto-print en TPV + reintento manual desde el detalle de caja).

/**
 * Tipo de delivery activo. Espejo literal de `DeliveryKind` en Rust
 * (snake_case en BD; union literal en TS).
 *
 * - `thermal`: impresora termica ESC/POS (USB/Bluetooth).
 * - `file`:    depuracion; escribe el payload a un archivo.
 * - `noop`:    sin dispositivo fisico (modo demo / fallback por defecto).
 * - `rfid`:    futuro; grabador de fichas (epica 8).
 * - `unknown`: tipo no clasificado; emitido defensivamente por el
 *              backend si el enum interno cambia.
 */
export type DeliveryKind = "thermal" | "file" | "noop" | "rfid" | "unknown";

/** Resultado de un intento de entrega. Espejo de `DeliveryOutcome`. */
export type DeliveryOutcome = "success" | "failure";

/**
 * Resultado de `print_ticket` (espejo de `PrintTicketResult` en
 * `commands/delivery.rs`).
 *
 * El backend devuelve este objeto SIEMPRE, incluso cuando el
 * backend fallo. La venta nunca falla por la impresion (regla dura
 * de la epica 3; ver ARCHITECTURE.md §5.3 y TEAM-012).
 */
export interface PrintTicketResult {
  ticket_id: string;
  success: boolean;
  /** `'success' | 'failure'`. String para no atar la UI al enum interno. */
  outcome: DeliveryOutcome;
  /** `null` cuando `success = true`. */
  error_code: string | null;
  /** Mensaje legible del backend si fallo; `null` en exito. */
  error_detail: string | null;
  /** Latencia observada del intento en milisegundos. */
  latency_ms: number;
  /** `kind` del backend que respondio (util para logs y UI). */
  backend_kind: DeliveryKind;
}

/**
 * Resumen de `retry_pending_tickets` (espejo de `RetryResult` en
 * `commands/delivery.rs`). El backend procesa los tickets pendientes
 * de una caja en orden y devuelve un `PrintTicketResult` por ticket
 * dentro de `details`.
 */
export interface RetryResult {
  attempted: number;
  succeeded: number;
  failed: number;
  details: PrintTicketResult[];
}

/** Input para `print_ticket` (espejo de la firma Rust). */
export interface PrintTicketInput {
  ticket_id: string;
}

/** Input para `retry_pending_tickets` (espejo de la firma Rust). */
export interface RetryPendingTicketsInput {
  cash_session_id: string;
}

/** Input para una linea de `create_sale`. */
export interface CreateSaleLineInput {
  /** Numero de tickets. >= 1. */
  quantity: number;
  /** Precio unitario en CENTIMOS. >= 0. */
  unit_price_cents: number;
}

/**
 * Input para `create_sale`.
 *
 * Reglas (enforced en backend):
 * - `lines.length >= 1`.
 * - Sin oferta: `total = sum(line_total)`, cada linea con
 *   `unit_price_cents` real.
 * - Con oferta: exactamente 1 linea con `quantity = offer.bundle_quantity`
 *   y `unit_price_cents = 0`; el cobro es `offer.bundle_price_cents`.
 */
export interface CreateSaleInput {
  cash_session_id: string;
  /** `null` = venta sin oferta. */
  offer_id: string | null;
  lines: CreateSaleLineInput[];
}

// ============================================================
// Errores (espejo de src-tauri/src/errors.rs SerializableError)
// ============================================================

/**
 * Codigos de error serializados por el backend. **snake_case**, no
 * PascalCase. Coinciden con el `match kind` de `errors.rs`.
 *
 * Los 3 ultimos (`cash_session_already_open`, `cash_session_closed`,
 * `invalid_sale`) son nuevos en epica 2 (V003).
 */
export type SerializableErrorKind =
  | "not_found"
  | "invalid_input"
  | "unique_violation"
  | "constraint_violation"
  | "database"
  | "internal"
  | "cash_session_already_open"
  | "cash_session_closed"
  | "invalid_sale";

export interface SerializableError {
  kind: SerializableErrorKind;
  message: string;
}
