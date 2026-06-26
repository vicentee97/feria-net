/**
 * lib/datetime.ts — FeriaNet
 *
 * Helpers para formato de fechas segun SSOT (EUR, es-ES, fecha local).
 *  - `created_at`: timestamp UTC ISO 8601 -> se formatea con locale.
 *  - Fechas operativas (`start_date`, `end_date`): YYYY-MM-DD ya local.
 *
 * Usamos `date-fns` con locale `es` instalado por defecto.
 */

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

/** Regex YYYY-MM-DD estricto. */
export const LOCAL_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Timestamp UTC ISO 8601 -> "dd/MM/yyyy HH:mm" en es-ES. */
export function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return format(d, "dd/MM/yyyy HH:mm", { locale: es });
  } catch {
    return "-";
  }
}

/** Timestamp UTC ISO 8601 -> "dd/MM/yyyy" en es-ES. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return format(d, "dd/MM/yyyy", { locale: es });
  } catch {
    return "-";
  }
}

/** "YYYY-MM-DD" local -> "dd/MM/yyyy" en es-ES. */
export function formatLocalDate(yyyymmdd: string | null | undefined): string {
  if (!yyyymmdd) return "-";
  try {
    const d = parseISO(yyyymmdd);
    if (Number.isNaN(d.getTime())) return "-";
    return format(d, "dd/MM/yyyy", { locale: es });
  } catch {
    return "-";
  }
}

/** Rango legible: "20/01/2026 - 27/01/2026". */
export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  const s = formatLocalDate(start);
  const e = formatLocalDate(end);
  if (s === "-" && e === "-") return "-";
  if (s === e) return s;
  return `${s} - ${e}`;
}

/** Devuelve la fecha actual como YYYY-MM-DD (local del operador). */
export function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
