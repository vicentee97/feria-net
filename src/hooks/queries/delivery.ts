/**
 * hooks/queries/delivery.ts — FeriaNet
 *
 * Hooks de React Query para el modulo `ticket-delivery` (epica 3).
 * Keys jerarquicas:
 *  - `["delivery", "health"]`
 *      -> health check del backend activo (polling cada 30s).
 *  - `["delivery", "devices"]`
 *      -> listado de dispositivos del backend activo (polling cada 60s).
 *
 * Para `print_ticket` y `retry_pending_tickets` no hay query: son
 * mutaciones puras. `usePrintTicket` es single-ticket y `usePrintTickets`
 * es un batch best-effort que el TPV usa tras una venta. El batch NO
 * emite toast: devuelve el array de resultados y el caller (TPV) decide
 * como presentar el resumen (parcial vs total vs fallo).
 *
 * Patron de toasts unificado (canonico del proyecto; ver
 * `hooks/queries/cash_sessions.ts` y el JSDoc de cabecera de los demas
 * hooks de queries):
 *  - `usePrintTicket`        -> hook emite `onError`; caller emite `onSuccess`.
 *  - `usePrintTickets`       -> NO emite toast. Batch errors los presenta
 *                               el caller segun el resumen (cantos).
 *  - `useRetryPendingTickets`-> hook emite `onError`; caller emite `onSuccess`
 *                               con el resumen (X succeedidos, Y fallaron).
 *  - `useDeliveryHealthCheck`-> query sin toasts (estado global, no accion).
 *  - `useDeliveryDevices`    -> query sin toasts (estado global, no accion).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  deliveryHealthCheck,
  listDeliveryDevices,
  printTicket,
  retryPendingTickets,
} from "@/api/tauri";
import { errorMessage } from "@/lib/errors";
import type { PrintTicketResult } from "@/types/domain";

// ============================================================
// Keys (exportadas para invalidaciones externas si hicieran falta)
// ============================================================

export const deliveryKeys = {
  health: () => ["delivery", "health"] as const,
  devices: () => ["delivery", "devices"] as const,
};

// ============================================================
// Mutations
// ============================================================

/**
 * `useMutation` para imprimir UN ticket. El caller decide el toast
 * de exito segun el contexto (en el TPV: solo emite toast si el
 * ticket fallo, no si tuvo exito, para no saturar).
 *
 * `print_ticket` **no** falla la venta: si el backend falla,
 * `printTicket` resuelve con `success: false`. Esta mutacion solo
 * lanza si la llamada al command en si falla (capa IPC).
 */
export function usePrintTicket() {
  return useMutation({
    mutationFn: printTicket,
    onError: (e) => {
      toast.error(errorMessage(e));
    },
  });
}

/**
 * `useMutation` para imprimir VARIOS tickets en paralelo (best-effort).
 * Usa `Promise.allSettled` para que un fallo individual no aborte al
 * resto. NO emite toast: el caller (TPV) presenta el resumen.
 *
 * Devuelve un array de `{ ticket_id, result, error }` con la misma
 * longitud que el input, en el mismo orden. `result` es `null` si
 * el command lanzo error (raro); `error` es `null` si tuvo exito o
 * si el backend devolvio `success: false` (eso va en `result.success`).
 */
export interface BatchPrintRow {
  ticket_id: string;
  /** `null` si el command lanzo error. `PrintTicketResult` si se ejecuto. */
  result: PrintTicketResult | null;
  /** Mensaje de error si el command lanzo; `null` si OK o si el backend devolvio `success=false`. */
  error: string | null;
}

export function usePrintTickets() {
  return useMutation({
    mutationFn: async (ticketIds: string[]): Promise<BatchPrintRow[]> => {
      // `allSettled` evita que un rechazo aborte al resto. Importante
      // para el principio "best-effort" de la epica 3 (la impresion
      // no bloquea la venta ni a si misma).
      const settled = await Promise.allSettled(
        ticketIds.map((id) => printTicket(id)),
      );
      return settled.map((s, i) => {
        if (s.status === "fulfilled") {
          return { ticket_id: ticketIds[i], result: s.value, error: null };
        }
        return {
          ticket_id: ticketIds[i],
          result: null,
          error: errorMessage(s.reason),
        };
      });
    },
    // Sin `onError`: el batch NO falla de forma atómica. El caller
    // cuenta `result === null` para detectar fallos del command.
    // Sin `onSuccess`: el caller decide el toast segun el resumen.
  });
}

/**
 * `useMutation` para reintentar TODOS los tickets pendientes de una
 * caja. Tras el exito, invalida:
 *  - `saleKeys.pendingTickets(cashSessionId)` -> refresca la lista de
 *    pendientes (algunos ya no estaran).
 *  - `cashSessionKeys.byAttraction` y `open` de la atraccion implicada:
 *    el "ultimo intento" de los tickets cambia, aunque no afecta al
 *    estado de la caja en si. Mantener la invalidad por consistencia
 *    si en el futuro se expone `delivery_status` por caja.
 *
 * Nota: NO tenemos acceso directo al `attractionId` desde el `RetryResult`
 * (el backend solo devuelve `details`). El caller (CajaDetallePage)
 * invalida manualmente su cache de pendientes despues del exito para
 * mantener este hook independiente de la atraccion.
 */
export function useRetryPendingTickets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { cash_session_id: string }) =>
      retryPendingTickets(input.cash_session_id),
    onSuccess: () => {
      // Refrescar pendientes de esta caja. El caller invalida
      // otras queries adicionales (attraction lists) si las necesita.
      qc.invalidateQueries({
        queryKey: ["sales", "pending_tickets"],
      });
    },
    onError: (e) => {
      toast.error(errorMessage(e));
    },
  });
}

// ============================================================
// Queries (estado global del backend de impresion)
// ============================================================

/**
 * Health check del backend activo. Refetch cada 30s para que el
 * indicador de la cabecera refleje cambios (impresora desconectada,
 * reconectada, etc) sin intervencion del operador.
 *
 * `retry: false` porque si el backend esta caido no queremos
 * generar ruido: el indicador simplemente se queda rojo y el
 * operador ve el problema. Un refetch periodico ya cubre la
 * reconexion.
 */
export function useDeliveryHealthCheck() {
  return useQuery({
    queryKey: deliveryKeys.health(),
    queryFn: deliveryHealthCheck,
    refetchInterval: 30 * 1000,
    retry: false,
    staleTime: 15 * 1000,
  });
}

/**
 * Lista de dispositivos del backend activo. Refetch cada 60s.
 * El backend ya cachea o recalcula barato, asi que el polling
 * no impacta.
 */
export function useDeliveryDevices() {
  return useQuery({
    queryKey: deliveryKeys.devices(),
    queryFn: listDeliveryDevices,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}

// ============================================================
// Helper: derivar estado de salud para el indicador
// ============================================================

/**
 * Estados posibles del indicador de salud del backend de impresion.
 *  - `unknown`: todavia no se ha hecho el primer health check.
 *  - `ok`:      health OK + hay dispositivos listados.
 *  - `noop`:    health OK pero el unico "dispositivo" es NoOp
 *               (modo demo / fallback). Aviso discreto.
 *  - `error`:   health falla (impresora desconectada, error de I/O, etc).
 */
export type DeliveryHealthStatus = "unknown" | "ok" | "noop" | "error";

/**
 * Deriva el estado del indicador a partir del resultado de las dos
 * queries. Pensado para ser consumido por el chip de la cabecera y
 * por el tooltip del icono de impresora en el TPV.
 *
 * Reglas (decision senior; ver JSDoc del TEAM-013):
 *  - Si `health` esta cargando -> "unknown".
 *  - Si `health` fallo        -> "error".
 *  - Si `health` OK + devices lista contiene solo "NoOp ..." -> "noop".
 *  - Si `health` OK + devices lista tiene entradas reales      -> "ok".
 *  - Si `health` OK + devices vacio (carga aun)               -> "unknown".
 */
export function deriveDeliveryHealthStatus(args: {
  healthIsPending: boolean;
  healthIsError: boolean;
  devices: string[] | undefined;
}): DeliveryHealthStatus {
  if (args.healthIsPending) return "unknown";
  if (args.healthIsError) return "error";
  if (!args.devices) return "unknown";
  if (args.devices.length === 0) return "unknown";
  // Deteccion de NoOp: la unica entrada y empieza por "NoOp".
  const onlyNoop =
    args.devices.length === 1 &&
    args.devices[0].toLowerCase().startsWith("noop");
  return onlyNoop ? "noop" : "ok";
}