/**
 * lib/editions.ts — FeriaNet
 *
 * Helpers compartidos por las paginas de ediciones:
 *  - `formatEditionLabel`: nombre legible de una edicion en la UI.
 *  - `findConflictingActiveEdition`: deteccion de la regla de negocio
 *    "una sola edicion `active` por feria" (data-model §5.10). El
 *    backend NO enforcea esta regla; el frontend la protege visualmente
 *    en los 3 puntos donde se activa una edicion (dropdown de detalle,
 *    submit del alta, submit de la edicion).
 */

import type { FairEdition } from "@/types/domain";

/**
 * Nombre legible de una edicion. En v1 las ediciones solo tienen
 * `year`, asi que el formato es `Edicion <year>`.
 *
 * Si en el futuro se anade un campo `name` a `FairEdition`, este helper
 * es el unico punto a actualizar para mantener la coherencia visual.
 */
export function formatEditionLabel(edition: Pick<FairEdition, "year">): string {
  return `Edicion ${edition.year}`;
}

/**
 * Busca si ya hay otra edicion de la misma feria con `status === 'active'`.
 *
 * @param editions  Listado completo de ediciones de la feria.
 * @param selfId    ID de la edicion objetivo (la que queremos activar);
 *                  se ignora en la busqueda para no detectarse a si misma.
 * @returns         La otra edicion activa, o `undefined` si no hay conflicto.
 */
export function findConflictingActiveEdition(
  editions: FairEdition[],
  selfId: string,
): FairEdition | undefined {
  return editions.find(
    (e) => e.status === "active" && e.id !== selfId,
  );
}
