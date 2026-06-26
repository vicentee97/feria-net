/**
 * lib/schemas.ts — FeriaNet
 *
 * Esquemas Zod para los formularios de feria, edicion y atraccion.
 * Son la **fuente unica de validacion en cliente**: RHF los aplica
 * con `zodResolver`, y los mismos limites estructurales aparecen en
 * el backend (CHECK constraints en BD). Si un limite cambia aqui,
 * hay que actualizarlo en `src-tauri/migrations/`.
 *
 * Mensajes en espanol, claros y orientados al feriante.
 */

import { z } from "zod";
import { EUR_LIMITS } from "@/lib/money";
import { LOCAL_DATE_REGEX } from "@/lib/datetime";

// ============================================================
// Feria (Fair)
// ============================================================

/**
 * `notes` con doble sentido para soportar el contrato del backend:
 *  - `""` (cadena vacia) -> el formulario lo envia como `null` (borrar notas).
 *  - string no vacia -> actualizar.
 *
 * La transformacion a `null` se hace en el submit del formulario, no aqui.
 * Aqui solo validamos longitud y obligatoriedad.
 */
export const fairFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(120, "Maximo 120 caracteres."),
  notes: z
    .string()
    .max(500, "Maximo 500 caracteres.")
    .optional()
    .or(z.literal("")),
});

export type FairFormValues = z.infer<typeof fairFormSchema>;

/** Schema para `update_fair` (todos los campos opcionales, sin tocar si undefined). */
export const updateFairSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(120, "Maximo 120 caracteres.")
    .optional(),
  notes: z
    .union([
      z.string().max(500, "Maximo 500 caracteres."),
      z.null(),
    ])
    .optional(),
});

export type UpdateFairValues = z.infer<typeof updateFairSchema>;

// ============================================================
// Edicion de feria (FairEdition)
// ============================================================

export const fairEditionFormSchema = z
  .object({
    year: z.coerce
      .number()
      .int("El ano debe ser un numero entero.")
      .min(1900, "El ano debe ser >= 1900.")
      .max(2100, "El ano debe ser <= 2100."),
    start_date: z
      .string()
      .regex(LOCAL_DATE_REGEX, "Fecha invalida (usa el selector de fecha)."),
    end_date: z
      .string()
      .regex(LOCAL_DATE_REGEX, "Fecha invalida (usa el selector de fecha)."),
    status: z.enum(["planned", "active", "closed"], {
      message: "Estado no valido.",
    }),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "La fecha de fin no puede ser anterior a la fecha de inicio.",
    path: ["end_date"],
  });

export type FairEditionFormValues = z.infer<typeof fairEditionFormSchema>;

// ============================================================
// Atraccion (Attraction)
// ============================================================

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export const attractionFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(80, "Maximo 80 caracteres."),
  color: z
    .string()
    .regex(HEX_COLOR_REGEX, "Color invalido (formato #RRGGBB)."),
  /** Precio en EUR (decimal). Se convierte a centimos al enviar al backend. */
  base_ticket_price_eur: z.coerce
    .number()
    .min(EUR_LIMITS.min, `El precio no puede ser negativo.`)
    .max(EUR_LIMITS.max, `El precio maximo es ${EUR_LIMITS.max} EUR.`),
  is_active: z.boolean().default(true),
});

export type AttractionFormValues = z.infer<typeof attractionFormSchema>;
