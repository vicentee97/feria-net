/**
 * api/tauri.ts — FeriaNet
 *
 * Capa de invocacion de commands Tauri. Encapsula `invoke<T>()` con
 * tipos exactos y manejo de errores centralizado.
 *
 * Contrato:
 *  - Todas las funciones devuelven la forma serializada del backend.
 *  - Cualquier error se convierte a `AppError` via `toAppError`.
 *  - Los nombres de comandos son **snake_case** (los registra Rust).
 *    Tauri acepta argumentos en snake_case directamente desde TS.
 *  - Los argumentos se envuelven en `{ input }` o en un objeto con
 *    campos segun la firma del command (ver firmas en
 *    `src-tauri/src/commands/*.rs`).
 *
 * Epica 2 (este team): caja, oferta, venta, tickets pendientes.
 * Los sufijos `_cents` se preservan tal cual los emite el backend
 * (ver `src/types/domain.ts` para la justificacion).
 */

import { invoke } from "@tauri-apps/api/core";
import { toAppError } from "@/lib/errors";
import type {
  Attraction,
  CashSession,
  CloseCashSessionInput,
  CreateAttractionInput,
  CreateCashSessionInput,
  CreateFairEditionInput,
  CreateFairInput,
  CreateOfferInput,
  CreateSaleInput,
  Fair,
  FairEdition,
  FairEditionStatus,
  Offer,
  Sale,
  SaleWithLines,
  Ticket,
  UpdateAttractionInput,
  UpdateFairEditionInput,
  UpdateFairInput,
  UpdateOfferInput,
} from "@/types/domain";

// ============================================================
// Ferias
// ============================================================

export async function listFairs(): Promise<Fair[]> {
  try {
    return await invoke<Fair[]>("list_fairs");
  } catch (e) {
    throw toAppError(e);
  }
}

export async function getFair(id: string): Promise<Fair | null> {
  try {
    return await invoke<Fair | null>("get_fair", { id });
  } catch (e) {
    throw toAppError(e);
  }
}

export async function createFair(input: CreateFairInput): Promise<Fair> {
  try {
    return await invoke<Fair>("create_fair", { input });
  } catch (e) {
    throw toAppError(e);
  }
}

export async function updateFair(id: string, input: UpdateFairInput): Promise<Fair> {
  try {
    return await invoke<Fair>("update_fair", { id, input });
  } catch (e) {
    throw toAppError(e);
  }
}

export async function deleteFair(id: string): Promise<void> {
  try {
    await invoke<void>("delete_fair", { id });
  } catch (e) {
    throw toAppError(e);
  }
}

export async function suggestFairByName(name: string): Promise<Fair | null> {
  try {
    return await invoke<Fair | null>("suggest_fair_by_name", { name });
  } catch (e) {
    throw toAppError(e);
  }
}

// ============================================================
// Ediciones de feria
// ============================================================

/**
 * Lista las ediciones de una feria, ordenadas por ano descendente
 * (regla del backend, ver `src-tauri/src/commands/editions.rs`).
 */
export async function listFairEditions(fairId: string): Promise<FairEdition[]> {
  try {
    return await invoke<FairEdition[]>("list_fair_editions", { fairId });
  } catch (e) {
    throw toAppError(e);
  }
}

/**
 * Crea una nueva edicion dentro de la feria `fairId`.
 *
 * El backend valida:
 *  - `year` en [1900, 2100].
 *  - `start_date` / `end_date` en formato ISO 8601 `YYYY-MM-DD`.
 *  - `end_date >= start_date`.
 *  - UNIQUE `(fair_id, year)` -> `AppError("unique_violation", ...)`.
 *  - FK `fair_id` -> `AppError("not_found", ...)` si la feria no existe.
 */
export async function createFairEdition(
  fairId: string,
  input: CreateFairEditionInput,
): Promise<FairEdition> {
  try {
    return await invoke<FairEdition>("create_fair_edition", { fairId, input });
  } catch (e) {
    throw toAppError(e);
  }
}

/**
 * Actualiza una edicion existente. Campos `undefined` no se tocan.
 * `fair_id` NO es actualizable (no aparece en el input).
 */
export async function updateFairEdition(
  id: string,
  input: UpdateFairEditionInput,
): Promise<FairEdition> {
  try {
    return await invoke<FairEdition>("update_fair_edition", { id, input });
  } catch (e) {
    throw toAppError(e);
  }
}

/**
 * Elimina una edicion. Falla con `AppError("constraint_violation", ...)`
 * si tiene atracciones asociadas (`ON DELETE RESTRICT` en la FK).
 */
export async function deleteFairEdition(id: string): Promise<void> {
  try {
    await invoke<void>("delete_fair_edition", { id });
  } catch (e) {
    throw toAppError(e);
  }
}

/**
 * Cambia solo el estado de una edicion (`planned` | `active` | `closed`).
 *
 * El backend recibe el status como string y lo valida; un valor invalido
 * devuelve `AppError("invalid_input", ...)` con mensaje claro.
 *
 * IMPORTANTE: el backend NO enforcea la regla "una sola edicion active
 * por feria" (data-model §5.10). El frontend la protege visualmente
 * en los componentes que llaman a este helper; ver `ActivateEditionDialog`
 * y los componentes de detalle/alta/edicion de edicion.
 */
export async function changeFairEditionStatus(
  id: string,
  status: FairEditionStatus,
): Promise<FairEdition> {
  try {
    return await invoke<FairEdition>("change_fair_edition_status", {
      id,
      status,
    });
  } catch (e) {
    throw toAppError(e);
  }
}

// ============================================================
// Atracciones
// ============================================================

export async function listAttractionsByEdition(
  fairEditionId: string,
): Promise<Attraction[]> {
  try {
    return await invoke<Attraction[]>("list_attractions_by_edition", {
      fairEditionId,
    });
  } catch (e) {
    throw toAppError(e);
  }
}

export async function createAttraction(input: CreateAttractionInput): Promise<Attraction> {
  try {
    return await invoke<Attraction>("create_attraction", { input });
  } catch (e) {
    throw toAppError(e);
  }
}

export async function updateAttraction(
  id: string,
  input: UpdateAttractionInput,
): Promise<Attraction> {
  try {
    return await invoke<Attraction>("update_attraction", { id, input });
  } catch (e) {
    throw toAppError(e);
  }
}

export async function softDeleteAttraction(id: string): Promise<void> {
  try {
    await invoke<void>("soft_delete_attraction", { id });
  } catch (e) {
    throw toAppError(e);
  }
}

// ============================================================
// Cajas (epica 2)
// ============================================================

/**
 * Abre una caja para una atraccion en una fecha concreta. Falla con
 * `AppError("cash_session_already_open", ...)` si ya hay una caja
 * abierta para esa atraccion (regla data-model §5.2, enforced en BD
 * por el indice UNIQUE parcial V003).
 */
export async function openCashSession(
  input: CreateCashSessionInput,
): Promise<CashSession> {
  try {
    return await invoke<CashSession>("open_cash_session", { input });
  } catch (e) {
    throw toAppError(e);
  }
}

/**
 * Cierra una caja abierta. `closing_amount_cents` es el importe
 * declarado por el operador (no se obliga a coincidir con el teorico).
 * `total_amount_cents` se calcula en backend al cerrar.
 */
export async function closeCashSession(
  id: string,
  input: CloseCashSessionInput,
): Promise<CashSession> {
  try {
    return await invoke<CashSession>("close_cash_session", { id, input });
  } catch (e) {
    throw toAppError(e);
  }
}

/**
 * Devuelve la caja abierta de una atraccion (si la hay) o `null`.
 * Util para detectar si el operador ya inicio caja antes de ofrecer
 * "abrir nueva".
 */
export async function getOpenCashSession(
  attractionId: string,
): Promise<CashSession | null> {
  try {
    return await invoke<CashSession | null>("get_open_cash_session", {
      attractionId,
    });
  } catch (e) {
    throw toAppError(e);
  }
}

/**
 * Devuelve la caja de una atraccion en una fecha concreta (abierta o
 * cerrada), o `null` si no existe.
 *
 * El backend NO expone `get_cash_session_by_id` directo. Para cargar
 * una caja por id desde la UI, se usa esta funcion si se conoce la
 * fecha, o `list_cash_sessions_for_attraction` filtrando en cliente.
 */
export async function getCashSessionForAttractionOnDate(
  attractionId: string,
  date: string,
): Promise<CashSession | null> {
  try {
    return await invoke<CashSession | null>(
      "get_cash_session_for_attraction_on_date",
      { attractionId, date },
    );
  } catch (e) {
    throw toAppError(e);
  }
}

/**
 * Lista TODAS las cajas (abiertas y cerradas) de una atraccion,
 * ordenadas por fecha descendente.
 */
export async function listCashSessionsForAttraction(
  attractionId: string,
): Promise<CashSession[]> {
  try {
    return await invoke<CashSession[]>("list_cash_sessions_for_attraction", {
      attractionId,
    });
  } catch (e) {
    throw toAppError(e);
  }
}

// ============================================================
// Ventas (epica 2)
// ============================================================

/**
 * Crea una venta completa (sale + sale_lines + tickets +
 * ticket_delivery_attempt placeholder) de forma **transaccional y
 * atomica**. Si cualquier paso falla, ROLLBACK completo.
 *
 * Reglas backend (ver `sales::create_sale`):
 *  - Caja debe existir y estar abierta (si no: `cash_session_closed`).
 *  - `lines.length >= 1`.
 *  - Sin oferta: `total = sum(line_total_cents)`.
 *  - Con oferta: 1 sola linea con `quantity = offer.bundle_quantity`
 *    y `unit_price_cents = 0`; el cobro es `offer.bundle_price_cents`.
 *  - La oferta debe pertenecer a la misma edicion que la atraccion
 *    de la caja (si no: `invalid_sale`).
 */
export async function createSale(input: CreateSaleInput): Promise<SaleWithLines> {
  try {
    return await invoke<SaleWithLines>("create_sale", { input });
  } catch (e) {
    throw toAppError(e);
  }
}

/**
 * Lista las ventas (sin lineas ni tickets) de una caja, ordenadas
 * por `created_at` descendente.
 */
export async function listSalesByCashSession(
  cashSessionId: string,
): Promise<Sale[]> {
  try {
    return await invoke<Sale[]>("list_sales_by_cash_session", {
      cashSessionId,
    });
  } catch (e) {
    throw toAppError(e);
  }
}

/**
 * Devuelve una venta con sus lineas y tickets populados, o `null`
 * si no existe.
 */
export async function getSale(id: string): Promise<SaleWithLines | null> {
  try {
    return await invoke<SaleWithLines | null>("get_sale", { id });
  } catch (e) {
    throw toAppError(e);
  }
}

/**
 * Devuelve un ticket por id, o `null` si no existe.
 */
export async function getTicket(id: string): Promise<Ticket | null> {
  try {
    return await invoke<Ticket | null>("get_ticket", { id });
  } catch (e) {
    throw toAppError(e);
  }
}

/**
 * Lista los tickets pendientes de entregar de una caja. Filtra los
 * tickets cuyo ultimo `ticket_delivery_attempt` tiene `outcome =
 * 'failure'` (placeholder inicial creado por la venta).
 *
 * La epica 3 (modulo `ticket-delivery`) consulta este command para
 * reintentar la entrega sin tocar la venta. En epica 2 la UI lo usa
 * solo para mostrar el contador "X tickets pendientes de imprimir"
 * en el detalle de caja.
 */
export async function listPendingTicketsByCashSession(
  cashSessionId: string,
): Promise<Ticket[]> {
  try {
    return await invoke<Ticket[]>("list_pending_tickets_by_cash_session", {
      cashSessionId,
    });
  } catch (e) {
    throw toAppError(e);
  }
}

// ============================================================
// Ofertas (epica 2)
// ============================================================

/**
 * Crea una nueva oferta en una edicion de feria.
 */
export async function createOffer(input: CreateOfferInput): Promise<Offer> {
  try {
    return await invoke<Offer>("create_offer", { input });
  } catch (e) {
    throw toAppError(e);
  }
}

/**
 * Lista las ofertas de una edicion. Si `includeInactive` es `false`
 * (recomendado para UI operativa, p.ej. el TPV), oculta las
 * soft-deleted. Para el panel de gestion de ofertas, pasar `true`.
 */
export async function listOffersByEdition(
  fairEditionId: string,
  includeInactive: boolean,
): Promise<Offer[]> {
  try {
    return await invoke<Offer[]>("list_offers_by_edition", {
      fairEditionId,
      includeInactive,
    });
  } catch (e) {
    throw toAppError(e);
  }
}

/**
 * Actualiza una oferta existente. Campos `undefined` no se tocan.
 */
export async function updateOffer(
  id: string,
  input: UpdateOfferInput,
): Promise<Offer> {
  try {
    return await invoke<Offer>("update_offer", { id, input });
  } catch (e) {
    throw toAppError(e);
  }
}

/**
 * Soft-delete: marca la oferta como `is_active = false`. Las ventas
 * pasadas que la aplicaron siguen siendo validas (trazabilidad
 * historica intacta).
 */
export async function softDeleteOffer(id: string): Promise<void> {
  try {
    await invoke<void>("soft_delete_offer", { id });
  } catch (e) {
    throw toAppError(e);
  }
}
