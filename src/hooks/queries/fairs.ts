/**
 * hooks/queries/fairs.ts — FeriaNet
 *
 * Hooks de React Query para ferias. Keys jerarquicas para que las
 * invalidaciones sean precisas:
 *  - `["fairs"]`                  -> listado completo.
 *  - `["fairs", id]`              -> una feria concreta.
 *  - `["fairs", "suggest", name]` -> sugerencia por nombre.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFair,
  deleteFair,
  getFair,
  listFairs,
  suggestFairByName,
  updateFair,
} from "@/api/tauri";
import type { CreateFairInput, UpdateFairInput } from "@/types/domain";

// Claves reutilizables para invalidaciones externas.
export const fairKeys = {
  all: ["fairs"] as const,
  detail: (id: string) => ["fairs", id] as const,
  suggest: (name: string) => ["fairs", "suggest", name] as const,
};

/** `useQuery` que devuelve todas las ferias. */
export function useFairs() {
  return useQuery({
    queryKey: fairKeys.all,
    queryFn: listFairs,
    staleTime: 5 * 60 * 1000,
  });
}

/** `useQuery` para una feria por id. */
export function useFair(id: string | undefined) {
  return useQuery({
    queryKey: id ? fairKeys.detail(id) : ["fairs", "_disabled"],
    queryFn: () => (id ? getFair(id) : Promise.resolve(null)),
    enabled: Boolean(id),
  });
}

/** `useQuery` para sugerencia de feria por nombre. Solo se activa si el nombre es no vacio. */
export function useSuggestFairByName(name: string, enabled = true) {
  return useQuery({
    queryKey: fairKeys.suggest(name),
    queryFn: () => suggestFairByName(name),
    enabled: enabled && name.trim().length >= 1,
    staleTime: 30 * 1000,
  });
}

/** `useMutation` para crear feria. Invalida el listado al cerrar. */
export function useCreateFair() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFairInput) => createFair(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: fairKeys.all });
    },
  });
}

/** `useMutation` para actualizar feria. Invalida el detalle y el listado. */
export function useUpdateFair() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateFairInput }) =>
      updateFair(id, input),
    onSuccess: (fair) => {
      qc.invalidateQueries({ queryKey: fairKeys.all });
      qc.invalidateQueries({ queryKey: fairKeys.detail(fair.id) });
    },
  });
}

/** `useMutation` para eliminar feria. Invalida el listado. */
export function useDeleteFair() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFair(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: fairKeys.all });
    },
  });
}
