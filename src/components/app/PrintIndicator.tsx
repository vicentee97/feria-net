/**
 * components/app/PrintIndicator.tsx — FeriaNet
 *
 * Indicador discreto del estado de impresion tras una venta.
 *
 * Tres estados visuales:
 *  - `idle`     -> no se imprime nada (default).
 *  - `printing` -> la venta se registro y se estan enviando tickets
 *                  al backend. Loader + contador de tickets.
 *  - `partial`  -> algunos tickets fallaron. Warning + contador.
 *
 * El chip se muestra en la cabecera del TPV (junto al subtitulo)
 * o en el detalle de caja (junto a la lista de pendientes). NO
 * bloquea la UI: es informativo, no critico.
 *
 * Decisiones UX:
 *  - Tamano pequeno y color discreto (no rojo alarmante) para no
 *    distraer del flujo principal del TPV.
 *  - Si el contador de tickets pendientes lo provee el padre
 *    (CajaDetalle), lo mostramos a la derecha del estado.
 *  - Accesibilidad: `role="status"` + `aria-live="polite"` para que
 *    el lector de pantalla avise del cambio sin interrumpir.
 */

import { CircleAlert, LoaderCircle, Printer } from "lucide-react";

import { cn } from "@/lib/utils";

export type PrintIndicatorState = "idle" | "printing" | "partial" | "failed";

interface PrintIndicatorProps {
  state: PrintIndicatorState;
  /** Tickets que se estan (o se intentaron) imprimir en este lote. */
  inFlight?: number;
  /** Tickets pendientes acumulados (tickets fallidos de la sesion). */
  pendingCount?: number;
  className?: string;
}

export function PrintIndicator({
  state,
  inFlight,
  pendingCount,
  className,
}: PrintIndicatorProps) {
  if (state === "idle") return null;

  // Visual unificado: un chip horizontal con icono + texto corto.
  // Color semantico consistente con el resto del design system
  // (Badge variants y Sidebar chips).
  const config = getConfig(state, inFlight, pendingCount);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs",
        config.classes,
        className,
      )}
    >
      <config.Icon
        className={cn(
          "size-3",
          state === "printing" && "animate-spin",
        )}
        aria-hidden="true"
      />
      <span>{config.label}</span>
    </div>
  );
}

function getConfig(
  state: PrintIndicatorState,
  inFlight?: number,
  pendingCount?: number,
): {
  Icon: typeof Printer;
  label: string;
  classes: string;
} {
  if (state === "printing") {
    const n = inFlight && inFlight > 0 ? inFlight : null;
    return {
      Icon: LoaderCircle,
      label: n ? `Imprimiendo ${n} ${n === 1 ? "ticket" : "tickets"}...` : "Imprimiendo...",
      classes:
        "border-transparent bg-sky-500/10 text-sky-700 dark:text-sky-300",
    };
  }
  if (state === "partial") {
    const n = pendingCount ?? 0;
    return {
      Icon: CircleAlert,
      label: n > 0 ? `${n} ticket${n === 1 ? "" : "s"} pendiente${n === 1 ? "" : "s"}` : "Impresion parcial",
      classes:
        "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-300",
    };
  }
  // failed: el command de impresion ni siquiera se pudo invocar
  // (muy raro; lo emite el caller si la mutation fallo de forma
  // atómica, p.ej. por error de capa IPC).
  return {
    Icon: CircleAlert,
    label: "Error al imprimir",
    classes: "border-transparent bg-rose-500/10 text-rose-700 dark:text-rose-300",
  };
}