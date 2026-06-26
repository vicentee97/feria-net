/**
 * lib/money.ts — FeriaNet
 *
 * Helpers para conversion EUR <-> centimos. El backend almacena los
 * precios en CENTIMOS (entero) para evitar errores de coma flotante.
 * La UI captura, muestra y valida en EUR con 2 decimales.
 *
 * Reglas operativas:
 *  - Conversion EUR -> centimos: `Math.round(eur * 100)`.
 *  - Conversion centimos -> EUR: `cents / 100` (mostrar con `Intl.NumberFormat`).
 *  - Validacion: 0 <= precio <= 999999.99 EUR.
 */

const MIN_EUR = 0;
const MAX_EUR = 999999.99;

/**
 * Convierte EUR (decimal con 2 decimales) a centimos (entero).
 *  - `null` / `undefined` / cadena vacia -> `null`.
 *  - `NaN` -> `null`.
 *  - Fuera de rango -> lanza `RangeError` (la validacion debe ocurrir antes).
 */
export function eurToCents(eur: number | string | null | undefined): number | null {
  if (eur === null || eur === undefined || eur === "") return null;
  const n = typeof eur === "string" ? Number(eur) : eur;
  if (!Number.isFinite(n)) return null;
  if (n < MIN_EUR || n > MAX_EUR) {
    throw new RangeError(`Precio fuera de rango: ${n} (rango ${MIN_EUR}-${MAX_EUR} EUR).`);
  }
  return Math.round(n * 100);
}

/**
 * Convierte centimos (entero) a EUR (numero). Devuelve 0 para valores
 * invalidos para no romper la UI; usar solo en lectura.
 */
export function centsToEur(cents: number | null | undefined): number {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) return 0;
  return cents / 100;
}

/**
 * Formatea centimos como EUR con locale `es-ES` y 2 decimales.
 *  - `null` / `undefined` -> `"-"`.
 */
export function formatEur(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) return "-";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

/** Limites exportados para reutilizar en validacion Zod. */
export const EUR_LIMITS = { min: MIN_EUR, max: MAX_EUR } as const;
