/**
 * hooks/queries/reports.ts — FeriaNet
 *
 * Hooks de React Query para los 3 informes de la epica 4 (TEAM-017).
 *
 * Keys jerarquicas (espejo del resto de hooks del proyecto):
 *  - `["reports", "daily", editionId, date]`            -> `DailyReport`.
 *  - `["reports", "feria", editionId, fromDate, toDate]` -> `FeriaReport`.
 *  - `["reports", "comparative", fairId]`               -> `ComparativeReport`.
 *
 * Decisiones operativas:
 *  - Los informes son de solo lectura y cambian poco durante la
 *    feria (las cajas se cierran al final del dia). Por eso
 *    `staleTime` es mayor que el resto: 60 s para daily/feria,
 *    300 s para comparative (no cambia entre dias).
 *  - Patron de errores: igual que el resto de queries, los errores
 *    se renderizan via `ErrorState` en la UI. NO emiten `toast.error`
 *    automaticamente (las queries no lo hacen; esto es deliberado y
 *    consistente con el resto del proyecto).
 *  - `enabled` sigue el patron ya usado: `false` hasta que los
 *    argumentos requeridos esten poblados.
 *
 * Sin `useMutation` ni invalidaciones cross-hook: la UI no crea
 * informes, solo los consulta.
 */

import { useQuery } from "@tanstack/react-query";

import {
  getComparativeReport,
  getDailyReport,
  getFeriaReport,
} from "@/api/tauri";

export const reportKeys = {
  daily: (editionId: string, date: string) =>
    ["reports", "daily", editionId, date] as const,
  feria: (editionId: string, fromDate: string, toDate: string) =>
    ["reports", "feria", editionId, fromDate, toDate] as const,
  comparative: (fairId: string) =>
    ["reports", "comparative", fairId] as const,
};

/**
 * Informe por dia: totales por atraccion + total general del dia.
 * Solo se activa cuando hay `editionId` y `date` validos.
 */
export function useDailyReport(
  editionId: string | null | undefined,
  date: string | null | undefined,
) {
  return useQuery({
    queryKey:
      editionId && date
        ? reportKeys.daily(editionId, date)
        : ["reports", "_disabled"],
    queryFn: () =>
      editionId && date
        ? getDailyReport({ edition_id: editionId, date })
        : Promise.resolve(null),
    enabled: Boolean(editionId) && Boolean(date),
    staleTime: 60 * 1000,
  });
}

/**
 * Informe por feria: totales agregados de una edicion sobre un rango
 * de fechas. Solo se activa con los 3 argumentos.
 */
export function useFeriaReport(
  editionId: string | null | undefined,
  fromDate: string | null | undefined,
  toDate: string | null | undefined,
) {
  return useQuery({
    queryKey:
      editionId && fromDate && toDate
        ? reportKeys.feria(editionId, fromDate, toDate)
        : ["reports", "_disabled"],
    queryFn: () =>
      editionId && fromDate && toDate
        ? getFeriaReport({
            edition_id: editionId,
            from_date: fromDate,
            to_date: toDate,
          })
        : Promise.resolve(null),
    enabled: Boolean(editionId) && Boolean(fromDate) && Boolean(toDate),
    staleTime: 60 * 1000,
  });
}

/**
 * Comparativa interanual: todas las ediciones de una misma feria.
 * Solo necesita `fairId` (no hay rango de fechas ni edicion concreta).
 *
 * `staleTime` mas alto (5 min): los comparativos rara vez cambian
 * entre dias; el feriante suele mirarlos al final de una feria.
 */
export function useComparativeReport(fairId: string | null | undefined) {
  return useQuery({
    queryKey: fairId
      ? reportKeys.comparative(fairId)
      : ["reports", "_disabled"],
    queryFn: () =>
      fairId ? getComparativeReport(fairId) : Promise.resolve(null),
    enabled: Boolean(fairId),
    staleTime: 5 * 60 * 1000,
  });
}