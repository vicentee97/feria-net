/**
 * lib/errors.ts — FeriaNet
 *
 * Error tipado que la UI puede mostrar. Envuelve cualquier error
 * lanzado por `invoke<T>()` (que rechaza con el `SerializableError`
 * serializado por backend).
 *
 * Uso tipico en la capa API:
 *   try { await invoke(...) } catch (e) { throw toAppError(e); }
 */

import type { SerializableError } from "@/types/domain";

export class AppError extends Error {
  readonly kind: string;
  readonly detail: string;

  constructor(kind: string, message: string) {
    super(message);
    this.name = "AppError";
    this.kind = kind;
    this.detail = message;
  }

  /**
   * Mensaje amigable para mostrar al usuario segun el `kind`.
   * Si el backend devuelve uno explicito, se prioriza.
   */
  toUserMessage(): string {
    // Si el mensaje del backend ya es razonable, devolverlo tal cual.
    // (Los mensajes del backend estan en espanol y son claros.)
    return this.detail;
  }
}

/**
 * Convierte cualquier valor rechazado por `invoke()` en `AppError`.
 * Tauri serializa los errores del command como objeto plano
 * `{ kind, message }`. Si llega otra cosa (por ejemplo, un error de red
 * o JS puro), se clasifica como `internal`.
 */
export function toAppError(raw: unknown): AppError {
  if (raw instanceof AppError) return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as Partial<SerializableError> & { message?: unknown; kind?: unknown };
    if (typeof obj.kind === "string" && typeof obj.message === "string") {
      return new AppError(obj.kind, obj.message);
    }
  }
  if (raw instanceof Error) {
    return new AppError("internal", raw.message || "Error inesperado");
  }
  return new AppError("internal", "Error inesperado");
}

/** Mensaje legible para mostrar al usuario desde un error arbitrario. */
export function errorMessage(raw: unknown): string {
  return toAppError(raw).toUserMessage();
}
