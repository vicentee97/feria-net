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
 */

import { invoke } from "@tauri-apps/api/core";
import { toAppError } from "@/lib/errors";
import type {
  Attraction,
  CreateAttractionInput,
  CreateFairEditionInput,
  CreateFairInput,
  Fair,
  FairEdition,
  FairEditionStatus,
  UpdateAttractionInput,
  UpdateFairEditionInput,
  UpdateFairInput,
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
