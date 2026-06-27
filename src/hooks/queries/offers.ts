/**
 * hooks/queries/offers.ts — FeriaNet
 *
 * Hooks de React Query para ofertas / bundles. Keys jerarquicas:
 *  - `["offers", "edition", fairEditionId, includeInactive]`
 *      -> listado de ofertas de una edicion.
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
  createOffer,
  listOffersByEdition,
  softDeleteOffer,
  updateOffer,
} from "@/api/tauri";
import { errorMessage } from "@/lib/errors";
import type { CreateOfferInput, Offer, UpdateOfferInput } from "@/types/domain";

export const offerKeys = {
  byEdition: (fairEditionId: string, includeInactive: boolean) =>
    ["offers", "edition", fairEditionId, includeInactive] as const,
};

/**
 * `useQuery` para las ofertas de una edicion.
 *
 * Por defecto solo devuelve ofertas activas (recomendado para UI
 * operativa, p.ej. el selector de oferta en el TPV). Para el panel
 * de gestion, pasar `includeInactive = true` para ver tambien las
 * soft-deleted.
 */
export function useOffersByEdition(
  fairEditionId: string | undefined,
  includeInactive = false,
) {
  return useQuery({
    queryKey: fairEditionId
      ? offerKeys.byEdition(fairEditionId, includeInactive)
      : ["offers", "_disabled"],
    queryFn: () =>
      fairEditionId
        ? listOffersByEdition(fairEditionId, includeInactive)
        : Promise.resolve([] as Offer[]),
    enabled: Boolean(fairEditionId),
    staleTime: 30 * 1000,
  });
}

/** `useMutation` para crear oferta. Invalida ambos listados (activas y todas). */
export function useCreateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOfferInput) => createOffer(input),
    onSuccess: (offer) => {
      qc.invalidateQueries({
        queryKey: ["offers", "edition", offer.fair_edition_id],
      });
    },
    onError: (e) => {
      toast.error(errorMessage(e));
    },
  });
}

/** `useMutation` para actualizar oferta. Invalida ambos listados. */
export function useUpdateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateOfferInput;
    }) => updateOffer(id, input),
    onSuccess: (offer) => {
      qc.invalidateQueries({
        queryKey: ["offers", "edition", offer.fair_edition_id],
      });
    },
    onError: (e) => {
      toast.error(errorMessage(e));
    },
  });
}

/** `useMutation` para soft-delete de oferta. Invalida ambos listados. */
export function useSoftDeleteOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, editionId }: { id: string; editionId: string }) =>
      softDeleteOffer(id).then(() => ({ id, editionId })),
    onSuccess: ({ editionId }) => {
      qc.invalidateQueries({
        queryKey: ["offers", "edition", editionId],
      });
    },
    onError: (e) => {
      toast.error(errorMessage(e));
    },
  });
}
