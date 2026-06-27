/**
 * hooks/queries/cash_sessions.ts — FeriaNet
 *
 * Hooks de React Query para cajas diarias. Keys jerarquicas:
 *  - `["cash_sessions", "attraction", attractionId]`
 *      -> listado completo de cajas (abiertas + cerradas) de una atraccion.
 *  - `["cash_sessions", "open", attractionId]`
 *      -> caja abierta de una atraccion (o `null`).
 *  - `["cash_sessions", "by_date", attractionId, date]`
 *      -> caja de una atraccion en una fecha concreta (o `null`).
 *
 * Decisiones de diseno:
 *  - No exponemos `useCashSessionById(id)` directo: el backend no tiene
 *    `get_cash_session_by_id`. Para cargar una caja por id desde la UI,
 *    se conoce su `attractionId` (pasado por URL o derivable del cache)
 *    y se usa `useCashSessionsForAttraction` filtrando en cliente. Ver
 *    `CajaDetallePage` para el patron concreto.
 *
 * Patron de toasts unificado (canonico para todos los hooks del proyecto):
 *  - El hook emite SIEMPRE `onError` con `toast.error(message)` usando
 *    el mensaje canonico del backend (viene del `AppError.message`
 *    serializado).
 *  - El hook NO emite `onSuccess`: el toast verde lo emite el caller
 *    porque el wording depende del contexto (p.ej. "Caja abierta para
 *    Noria" vs "Caja cerrada con 36 EUR").
 *  - El caller NO envuelve la mutacion en `try/catch` solo para mostrar
 *    el toast de error. Si necesita reaccionar al exito (navegar,
 *    recargar queries), usa el resultado de `await mutateAsync()` sin
 *    try/catch: los errores se propagan al `onError` del hook.
 *  - Excepcion documentada: cuando `onConfirm` se pasa a
 *    `ConfirmDestructiveDialog` o a un dialog que precise control de
 *    flujo, el caller mantiene `try/catch` para `throw` y evitar que el
 *    dialog se cierre, pero NO emite `toast.error` dentro del catch
 *    (lo hace el hook).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  closeCashSession,
  getCashSessionForAttractionOnDate,
  getOpenCashSession,
  listCashSessionsForAttraction,
  openCashSession,
} from "@/api/tauri";
import { errorMessage } from "@/lib/errors";
import type {
  CashSession,
  CloseCashSessionInput,
  CreateCashSessionInput,
} from "@/types/domain";

// Claves reutilizables para invalidaciones externas.
export const cashSessionKeys = {
  byAttraction: (attractionId: string) =>
    ["cash_sessions", "attraction", attractionId] as const,
  open: (attractionId: string) =>
    ["cash_sessions", "open", attractionId] as const,
  byDate: (attractionId: string, date: string) =>
    ["cash_sessions", "by_date", attractionId, date] as const,
};

/**
 * `useQuery` para el listado completo de cajas (abiertas + cerradas)
 * de una atraccion. Orden descendente por fecha (regla del backend).
 */
export function useCashSessionsForAttraction(attractionId: string | undefined) {
  return useQuery({
    queryKey: attractionId
      ? cashSessionKeys.byAttraction(attractionId)
      : ["cash_sessions", "_disabled"],
    queryFn: () =>
      attractionId
        ? listCashSessionsForAttraction(attractionId)
        : Promise.resolve([]),
    enabled: Boolean(attractionId),
    staleTime: 30 * 1000,
  });
}

/**
 * `useQuery` para la caja abierta de una atraccion. Devuelve `null`
 * si no hay ninguna abierta.
 */
export function useOpenCashSession(attractionId: string | undefined) {
  return useQuery({
    queryKey: attractionId
      ? cashSessionKeys.open(attractionId)
      : ["cash_sessions", "_disabled"],
    queryFn: () =>
      attractionId ? getOpenCashSession(attractionId) : Promise.resolve(null),
    enabled: Boolean(attractionId),
    staleTime: 10 * 1000,
  });
}

/**
 * `useQuery` para la caja de una atraccion en una fecha concreta.
 * Devuelve `null` si no existe (util para "abrir caja del dia" cuando
 * la UI detecta si ya hay una creada).
 */
export function useCashSessionForAttractionOnDate(
  attractionId: string | undefined,
  date: string | undefined,
) {
  return useQuery({
    queryKey:
      attractionId && date
        ? cashSessionKeys.byDate(attractionId, date)
        : ["cash_sessions", "_disabled"],
    queryFn: () =>
      attractionId && date
        ? getCashSessionForAttractionOnDate(attractionId, date)
        : Promise.resolve(null),
    enabled: Boolean(attractionId && date),
    staleTime: 30 * 1000,
  });
}

/**
 * `useMutation` para abrir caja. Invalida el listado de la atraccion,
 * la consulta de caja abierta y la consulta por fecha del dia.
 */
export function useOpenCashSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCashSessionInput) => openCashSession(input),
    onSuccess: (session) => {
      qc.invalidateQueries({
        queryKey: cashSessionKeys.byAttraction(session.attraction_id),
      });
      qc.invalidateQueries({
        queryKey: cashSessionKeys.open(session.attraction_id),
      });
      qc.invalidateQueries({
        queryKey: cashSessionKeys.byDate(session.attraction_id, session.date),
      });
    },
    onError: (e) => {
      toast.error(errorMessage(e));
    },
  });
}

/**
 * `useMutation` para cerrar caja. Invalida el listado y la consulta
 * de caja abierta (la caja recien cerrada ya no aparece como abierta).
 */
export function useCloseCashSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: CloseCashSessionInput;
    }) => closeCashSession(id, input),
    onSuccess: (session) => {
      qc.invalidateQueries({
        queryKey: cashSessionKeys.byAttraction(session.attraction_id),
      });
      qc.invalidateQueries({
        queryKey: cashSessionKeys.open(session.attraction_id),
      });
      qc.invalidateQueries({
        queryKey: cashSessionKeys.byDate(session.attraction_id, session.date),
      });
    },
    onError: (e) => {
      toast.error(errorMessage(e));
    },
  });
}
