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
  CreateFairInput,
  Fair,
  FairEdition,
  UpdateAttractionInput,
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
 * NOTA: los commands de `FairEdition` (create, list, update, delete)
 * NO estan expuestos en el backend todavia (TEAM-003 cerro con
 * solo ferias + atracciones). Las funciones siguientes son **stubs**
 * que documentan la intencion y daran un error claro si se invocan.
 * Cuando backend exponga los commands, solo hay que reemplazar el
 * cuerpo de cada funcion.
 */

class NotImplementedError extends Error {
  constructor(command: string) {
    super(
      `El command Tauri "${command}" no esta implementado en el backend todavia. ` +
        `Ver TEAM-004 para el seguimiento.`,
    );
    this.name = "NotImplementedError";
  }
}

export async function listFairEditions(_fairId: string): Promise<FairEdition[]> {
  throw new NotImplementedError("list_fair_editions");
}

export async function createFairEdition(
  _fairId: string,
  _input: Omit<FairEdition, "id" | "fair_id" | "created_at">,
): Promise<FairEdition> {
  throw new NotImplementedError("create_fair_edition");
}

export async function updateFairEdition(
  _id: string,
  _input: Partial<Omit<FairEdition, "id" | "fair_id" | "created_at">>,
): Promise<FairEdition> {
  throw new NotImplementedError("update_fair_edition");
}

export async function deleteFairEdition(_id: string): Promise<void> {
  throw new NotImplementedError("delete_fair_edition");
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
