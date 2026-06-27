/**
 * hooks/queries/sales.ts — FeriaNet
 *
 * Hooks de React Query para ventas. Keys jerarquicas:
 *  - `["sales", "session", cashSessionId]`
 *      -> listado de ventas (sin lineas) de una caja.
 *  - `["sales", "detail", saleId]`
 *      -> una venta con lineas y tickets.
 *  - `["sales", "pending_tickets", cashSessionId]`
 *      -> tickets pendientes de imprimir de una caja.
 *
 * Patron de toasts unificado (ver `hooks/queries/editions.ts` para el
 * detalle completo): hook emite `onError`, caller emite `onSuccess`.
 * Caller NO envuelve la mutacion en `try/catch` solo para mostrar
 * el toast de error; si lo necesita para control de flujo del dialog,
 * re-lanza el error sin emitir toast (el hook ya lo hace).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createSale,
  listPendingTicketsByCashSession,
  listSalesByCashSession,
} from "@/api/tauri";
import { errorMessage } from "@/lib/errors";
import type { CreateSaleInput, Sale } from "@/types/domain";

export const saleKeys = {
  byCashSession: (cashSessionId: string) =>
    ["sales", "session", cashSessionId] as const,
  pendingTickets: (cashSessionId: string) =>
    ["sales", "pending_tickets", cashSessionId] as const,
};

/**
 * `useQuery` para las ventas de una caja (sin lineas ni tickets),
 * ordenadas por `created_at` descendente. Suficiente para listados
 * operativos (la pantalla de detalle no necesita cada `SaleWithLines`
 * salvo que el operador quiera reimprimir).
 */
export function useSalesByCashSession(cashSessionId: string | undefined) {
  return useQuery({
    queryKey: cashSessionId
      ? saleKeys.byCashSession(cashSessionId)
      : ["sales", "_disabled"],
    queryFn: () =>
      cashSessionId
        ? listSalesByCashSession(cashSessionId)
        : Promise.resolve([] as Sale[]),
    enabled: Boolean(cashSessionId),
    staleTime: 10 * 1000,
  });
}

/**
 * `useQuery` para los tickets pendientes de imprimir de una caja.
 * El backend filtra los tickets cuyo ultimo `ticket_delivery_attempt`
 * sigue con `outcome = 'failure'` (placeholder inicial creado por la
 * venta; la epica 3 los reintenta via el modulo `ticket-delivery`).
 */
export function usePendingTicketsByCashSession(
  cashSessionId: string | undefined,
) {
  return useQuery({
    queryKey: cashSessionId
      ? saleKeys.pendingTickets(cashSessionId)
      : ["sales", "_disabled"],
    queryFn: () =>
      cashSessionId
        ? listPendingTicketsByCashSession(cashSessionId)
        : Promise.resolve([]),
    enabled: Boolean(cashSessionId),
    staleTime: 10 * 1000,
  });
}

/**
 * `useMutation` para crear una venta (transaccional: `sale` +
 * `sale_lines` + `tickets` + `ticket_delivery_attempt` placeholder).
 *
 * Tras exito invalida:
 *  - Listado de ventas de la caja.
 *  - Tickets pendientes de la caja (aumenta el contador).
 *  - Lista de cajas de la atraccion (para refrescar el "estado
 *    derivado" si se quisiera en algun panel de listado).
 */
export function useCreateSale(cashSessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSaleInput) => createSale(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: saleKeys.byCashSession(cashSessionId) });
      qc.invalidateQueries({
        queryKey: saleKeys.pendingTickets(cashSessionId),
      });
    },
    onError: (e) => {
      toast.error(errorMessage(e));
    },
  });
}
