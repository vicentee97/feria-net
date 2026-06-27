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

/**
 * Tiempo relativo corto en espanol: "hace 5s", "hace 2 min", "hace 3 h",
 * o "recien" para menos de 5 segundos. Pensado para feedback de UI
 * ("ultima venta hace 5s").
 *
 * @param iso  Timestamp ISO 8601 UTC del backend. `null`/`undefined`
 *             o valor invalido devuelve `"-"`.
 */
export function formatRelativeTime(
  iso: string | null | undefined,
  now: Date = new Date(),
): string {
  if (!iso) return "-";
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "-";
  const diffMs = now.getTime() - then.getTime();
  if (diffMs < 0) return "recien";
  const sec = Math.floor(diffMs / 1000);
  if (sec < 5) return "recien";
  if (sec < 60) return `hace ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.floor(h / 24);
  return `hace ${days} d`;
}

/**
 * Devuelve la marca de tiempo de hace N segundos (util para invalidar
 * caches o construir URLs con timestamps). Pensado solo para tests y
 * casos puntuales; el flujo normal usa `new Date()` directo.
 */
export function secondsAgoISO(seconds: number): string {
  return new Date(Date.now() - seconds * 1000).toISOString();
}
