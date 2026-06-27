/**
 * lib/schemas.ts — FeriaNet
 *
 * Esquemas Zod para los formularios de feria, edicion, atraccion,
 * caja, oferta y venta. Son la **fuente unica de validacion en
 * cliente**: RHF los aplica con `zodResolver`, y los mismos limites
 * estructurales aparecen en el backend (CHECK constraints en BD).
 * Si un limite cambia aqui, hay que actualizarlo en
 * `src-tauri/migrations/`.
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

// ============================================================
// Caja (CashSession)
// ============================================================

/**
 * Schema para apertura de caja (`open_cash_session`).
 *
 * El usuario introduce el fondo inicial en EUR; convertimos a centimos
 * en el submit antes de enviar al backend.
 */
export const openCashSessionFormSchema = z.object({
  /** ISO 8601 `YYYY-MM-DD`. */
  date: z
    .string()
    .regex(LOCAL_DATE_REGEX, "Fecha invalida (usa el selector de fecha)."),
  /** Fondo inicial en EUR (>= 0). Convertido a centimos en submit. */
  opening_amount_eur: z.coerce
    .number()
    .min(0, "El fondo inicial no puede ser negativo.")
    .max(EUR_LIMITS.max, `El fondo maximo es ${EUR_LIMITS.max} EUR.`),
});

export type OpenCashSessionFormValues = z.infer<
  typeof openCashSessionFormSchema
>;

/**
 * Schema para cierre de caja (`close_cash_session`).
 *
 * El importe declarado al cierre puede NO coincidir con el teorico
 * (la diferencia es visible en informes). Validamos >= 0.
 */
export const closeCashSessionFormSchema = z.object({
  /** Importe declarado al cierre en EUR (>= 0). Convertido a centimos en submit. */
  closing_amount_eur: z.coerce
    .number()
    .min(0, "El importe no puede ser negativo.")
    .max(EUR_LIMITS.max, `El importe maximo es ${EUR_LIMITS.max} EUR.`),
});

export type CloseCashSessionFormValues = z.infer<
  typeof closeCashSessionFormSchema
>;

// ============================================================
// Oferta (Offer)
// ============================================================

export const offerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(80, "Maximo 80 caracteres."),
  /** Numero de tickets del bundle. >= 1. */
  bundle_quantity: z.coerce
    .number()
    .int("La cantidad debe ser un numero entero.")
    .min(1, "Minimo 1 ticket por pack.")
    .max(10000, "Maximo 10000 tickets por pack."),
  /** Precio total del bundle en EUR (>= 0). Convertido a centimos en submit. */
  bundle_price_eur: z.coerce
    .number()
    .min(0, "El precio no puede ser negativo.")
    .max(EUR_LIMITS.max, `El precio maximo es ${EUR_LIMITS.max} EUR.`),
});

export type OfferFormValues = z.infer<typeof offerFormSchema>;

/**
 * Schema para edicion de oferta. Mismos campos, todos editables.
 * Reutilizamos `offerFormSchema` directamente: el backend acepta el
 * mismo shape y los campos `undefined` no se tocan (en update_offer).
 */
export const updateOfferFormSchema = offerFormSchema;
export type UpdateOfferFormValues = OfferFormValues;

// ============================================================
// Venta (Sale)
// ============================================================

/**
 * Schema para una linea de venta (parte de `create_sale`).
 *
 * En la UI del TPV el operador no introduce directamente el `unit_price`
 * (lo calcula la app desde `attraction.base_ticket_price` o desde la
 * oferta seleccionada). Este schema se usa internamente para validar
 * el `CreateSaleLineInput` justo antes de invocar `create_sale`.
 */
export const createSaleLineSchema = z.object({
  quantity: z.number().int().min(1).max(10000),
  unit_price_cents: z.number().int().min(0),
});

export const createSaleSchema = z.object({
  cash_session_id: z.string().uuid(),
  /** `null` = venta sin oferta. */
  offer_id: z.string().uuid().nullable(),
  lines: z.array(createSaleLineSchema).min(1, "Minimo una linea por venta."),
});

export type CreateSaleLine = z.infer<typeof createSaleLineSchema>;
export type CreateSaleSchema = z.infer<typeof createSaleSchema>;
