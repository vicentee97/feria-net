/**
 * hooks/queries/editions.ts — FeriaNet
 *
 * Hooks de React Query para ediciones de feria. Keys jerarquicas:
 *  - `["editions", fairId]`            -> listado de ediciones de una feria.
 *  - `["editions", "detail", id]`      -> una edicion concreta (filtrada
 *                                         en cliente desde el listado; el
 *                                         backend no expone `get_edition`).
 *
 * Patron de toasts unificado (canonico para todos los hooks del proyecto):
 *  - El hook emite SIEMPRE `onError` con `toast.error(message)` usando
 *    el mensaje canonico del backend (viene del `AppError.message`
 *    serializado).
 *  - El hook NO emite `onSuccess`: el toast verde lo emite el caller
 *    porque el wording depende del contexto (p.ej. "Edicion 2026 creada"
 *    vs "Estado cambiado a active").
 *  - El caller NO envuelve la mutacion en `try/catch` solo para mostrar
 *    el toast de error. Si necesita reaccionar al exito (navegar,
 *    recargar queries), usa el resultado de `await mutateAsync()` sin
 *    try/catch: los errores se propagan al `onError` del hook.
 *  - Excepcion documentada: cuando `onConfirm` se pasa a
 *    `ConfirmDestructiveDialog` o a un dialog que precise control de
 *    flujo, el caller mantiene `try/catch` para `throw` y evitar que el
 *    dialog se cierre, pero NO emite `toast.error` dentro del catch
 *    (lo hace el hook). El mismo patron aplica a `handleDialogConfirm`
 *    en las paginas de edicion: el try/catch mantiene el dialog
 *    abierto si falla, pero el toast lo emite el hook.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  changeFairEditionStatus,
  createFairEdition,
  deleteFairEdition,
  listFairEditions,
  updateFairEdition,
} from "@/api/tauri";
import { errorMessage } from "@/lib/errors";
import type {
  CreateFairEditionInput,
  FairEdition,
  FairEditionStatus,
  UpdateFairEditionInput,
} from "@/types/domain";

// Claves reutilizables para invalidaciones externas.
export const editionKeys = {
  byFair: (fairId: string) => ["editions", fairId] as const,
  detail: (id: string) => ["editions", "detail", id] as const,
};

/** `useQuery` que devuelve las ediciones de una feria. */
export function useEditionsByFair(fairId: string | undefined) {
  return useQuery({
    queryKey: fairId ? editionKeys.byFair(fairId) : ["editions", "_disabled"],
    queryFn: () => (fairId ? listFairEditions(fairId) : Promise.resolve([])),
    enabled: Boolean(fairId),
    staleTime: 30 * 1000,
  });
}

/**
 * `useQuery` para una edicion por id. Como el backend no expone
 * `get_edition` (solo `list_fair_editions`), se carga el listado de
 * la feria correspondiente y se filtra en cliente. Esto encaja con
 * el patron actual de la app (cache del listado siempre disponible)
 * y evita N+1 requests cuando se navega al detalle.
 *
 * Requiere `fairId` + `editionId` para poder filtrar.
 */
export function useEdition(
  fairId: string | undefined,
  editionId: string | undefined,
) {
  const query = useEditionsByFair(fairId);
  const edition = editionId
    ? query.data?.find((e) => e.id === editionId) ?? null
    : null;
  return {
    ...query,
    data: edition,
  };
}

/** `useMutation` para crear edicion. Invalida el listado de la feria. */
export function useCreateEdition(fairId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFairEditionInput) =>
      createFairEdition(fairId, input),
    onSuccess: (edition) => {
      qc.invalidateQueries({ queryKey: editionKeys.byFair(fairId) });
      qc.invalidateQueries({ queryKey: editionKeys.detail(edition.id) });
    },
    onError: (e) => {
      toast.error(errorMessage(e));
    },
  });
}

/** `useMutation` para actualizar edicion. Invalida listado y detalle. */
export function useUpdateEdition(fairId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateFairEditionInput }) =>
      updateFairEdition(id, input),
    onSuccess: (edition) => {
      qc.invalidateQueries({ queryKey: editionKeys.byFair(fairId) });
      qc.invalidateQueries({ queryKey: editionKeys.detail(edition.id) });
    },
    onError: (e) => {
      toast.error(errorMessage(e));
    },
  });
}

/** `useMutation` para eliminar edicion. Invalida el listado. */
export function useDeleteEdition(fairId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFairEdition(id),
    onSuccess: (_void, id) => {
      qc.invalidateQueries({ queryKey: editionKeys.byFair(fairId) });
      qc.invalidateQueries({ queryKey: editionKeys.detail(id) });
    },
    onError: (e) => {
      toast.error(errorMessage(e));
    },
  });
}

/** `useMutation` para cambiar el estado de una edicion. */
export function useChangeEditionStatus(fairId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: FairEditionStatus }) =>
      changeFairEditionStatus(id, status),
    onSuccess: (edition) => {
      qc.invalidateQueries({ queryKey: editionKeys.byFair(fairId) });
      qc.invalidateQueries({ queryKey: editionKeys.detail(edition.id) });
    },
    onError: (e) => {
      toast.error(errorMessage(e));
    },
  });
}

// Re-export para no obligar al caller a importar el tipo.
export type { FairEdition };
