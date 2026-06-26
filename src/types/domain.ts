/**
 * types/domain.ts — FeriaNet
 *
 * Espejo en TypeScript de los tipos del backend Rust
 * (src-tauri/src/domain/*.rs). Cualquier cambio aqui debe
 * coordinarse con un cambio equivalente en backend.
 *
 * Convenciones:
 *  - `id`: UUID v4 en formato string canonico (sin comillas, lowercase).
 *  - `created_at`: timestamp ISO 8601 UTC con offset `Z`.
 *  - Fechas locales (`start_date`, `end_date`): YYYY-MM-DD.
 *  - `color`: hex `#RRGGBB` (6 digitos, sin alpha).
 *  - `base_ticket_price`: INTEGER en centimos. Convertir a EUR en UI.
 */

// ============================================================
// Entidades
// ============================================================

export interface Fair {
  id: string;
  name: string;
  notes: string | null;
  created_at: string;
}

/**
 * Estado operativo de una edicion de feria.
 *  - `planned`: prevista para el futuro, aun no operativa.
 *  - `active`:  operativa (cajas abiertas o ventas en curso).
 *  - `closed`:  cerrada.
 */
export type FairEditionStatus = "planned" | "active" | "closed";

export interface FairEdition {
  id: string;
  fair_id: string;
  year: number;
  /** Fecha local del operador en formato YYYY-MM-DD. */
  start_date: string;
  /** Fecha local del operador en formato YYYY-MM-DD. */
  end_date: string;
  status: FairEditionStatus;
  created_at: string;
}

export interface Attraction {
  id: string;
  fair_edition_id: string;
  name: string;
  /** Hex `#RRGGBB`. Validado por CHECK en BD. */
  color: string;
  /** Precio base del ticket en CENTIMOS (entero). */
  base_ticket_price: number;
  is_active: boolean;
}

// ============================================================
// Inputs (espejo de src-tauri/src/commands/*.rs)
// ============================================================

/** Input para `create_fair`. */
export interface CreateFairInput {
  name: string;
  notes?: string | null;
}

/**
 * Input para `update_fair`.
 *
 * El campo `notes` distingue 3 estados gracias al doble Option del backend:
 *  - `undefined`  -> no tocar.
 *  - `null`       -> poner a NULL (borrar notas).
 *  - `string`     -> actualizar a `s`.
 */
export interface UpdateFairInput {
  name?: string;
  notes?: string | null;
}

/** Input para `create_attraction`. */
export interface CreateAttractionInput {
  fair_edition_id: string;
  name: string;
  color: string;
  /** Precio en CENTIMOS. */
  base_ticket_price: number;
}

/** Input para `update_attraction`. Campos `undefined` no se tocan. */
export interface UpdateAttractionInput {
  name?: string;
  color?: string;
  base_ticket_price?: number;
}

// ============================================================
// Errores (espejo de src-tauri/src/errors.rs SerializableError)
// ============================================================

/**
 * Codigos de error serializados por el backend. **snake_case**, no
 * PascalCase. Coinciden con el `match kind` de `errors.rs`.
 */
export type SerializableErrorKind =
  | "not_found"
  | "invalid_input"
  | "unique_violation"
  | "constraint_violation"
  | "database"
  | "internal";

export interface SerializableError {
  kind: SerializableErrorKind;
  message: string;
}
