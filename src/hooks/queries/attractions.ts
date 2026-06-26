/**
 * hooks/queries/attractions.ts — FeriaNet
 *
 * Hooks de React Query para atracciones. Keys jerarquicas:
 *  - `["attractions", editionId]`  -> listado de una edicion.
 *
 * Patron de toasts unificado (ver `hooks/queries/editions.ts` para el
 * detalle completo):
 *  - `onError` lo emite el hook (mensaje canonico del backend).
 *  - `onSuccess` lo emite el caller (wording dependiente de contexto).
 *  - El caller NO envuelve la mutacion en `try/catch` solo para mostrar
 *    el toast de error. Si lo necesita para control de flujo del dialog,
 *    re-lanza el error sin emitir toast (el hook ya lo hace).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createAttraction,
  listAttractionsByEdition,
  softDeleteAttraction,
  updateAttraction,
} from "@/api/tauri";
import { errorMessage } from "@/lib/errors";
import type { CreateAttractionInput, UpdateAttractionInput } from "@/types/domain";

export const attractionKeys = {
  byEdition: (editionId: string) => ["attractions", editionId] as const,
};

/** `useQuery` para el listado de atracciones activas de una edicion. */
export function useAttractionsByEdition(editionId: string | undefined) {
  return useQuery({
    queryKey: editionId
      ? attractionKeys.byEdition(editionId)
      : ["attractions", "_disabled"],
    queryFn: () =>
      editionId ? listAttractionsByEdition(editionId) : Promise.resolve([]),
    enabled: Boolean(editionId),
    staleTime: 30 * 1000,
  });
}

export function useCreateAttraction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAttractionInput) => createAttraction(input),
    onSuccess: (attraction) => {
      qc.invalidateQueries({
        queryKey: attractionKeys.byEdition(attraction.fair_edition_id),
      });
    },
    onError: (e) => {
      toast.error(errorMessage(e));
    },
  });
}

export function useUpdateAttraction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateAttractionInput;
    }) => updateAttraction(id, input),
    onSuccess: (attraction) => {
      qc.invalidateQueries({
        queryKey: attractionKeys.byEdition(attraction.fair_edition_id),
      });
    },
    onError: (e) => {
      toast.error(errorMessage(e));
    },
  });
}

export function useSoftDeleteAttraction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, editionId }: { id: string; editionId: string }) =>
      softDeleteAttraction(id).then(() => ({ id, editionId })),
    onSuccess: ({ editionId }) => {
      qc.invalidateQueries({
        queryKey: attractionKeys.byEdition(editionId),
      });
    },
    onError: (e) => {
      toast.error(errorMessage(e));
    },
  });
}
