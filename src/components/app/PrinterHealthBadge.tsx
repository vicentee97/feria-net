/**
 * components/app/PrinterHealthBadge.tsx — FeriaNet
 *
 * Chip discreto en la cabecera del layout que refleja el estado
 * del backend de impresion (`ticket-delivery`).
 *
 * Estados posibles (deriva `deriveDeliveryHealthStatus`):
 *  - `unknown` -> gris, "Comprobando...".
 *  - `ok`      -> verde, "Impresora OK" + primer device.
 *  - `noop`    -> ambar, "Modo demo" (no hay hardware real).
 *  - `error`   -> rojo, "Error de impresora" (reconectar / revisar).
 *
 * El chip NO bloquea la UI. Es informativo. El operador ya sabe
 * que tiene un problema si la venta se registra pero los tickets
 * no salen.
 *
 * Tooltip: muestra la lista completa de devices (p.ej. varias
 * impresoras USB detectadas o el path del directorio File).
 */

import { CircleCheck, CircleAlert, CircleX, HelpCircle, Printer } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DeliveryHealthStatus } from "@/hooks/queries/delivery";

interface PrinterHealthBadgeProps {
  status: DeliveryHealthStatus;
  devices: string[] | undefined;
  className?: string;
}

export function PrinterHealthBadge({
  status,
  devices,
  className,
}: PrinterHealthBadgeProps) {
  const cfg = getConfig(status, devices);
  const Icon = cfg.Icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`Estado de la impresora: ${cfg.label}`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs transition-colors",
            "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            cfg.classes,
            className,
          )}
        >
          <Icon className="size-3" aria-hidden="true" />
          <span className="hidden sm:inline">{cfg.label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="end" className="max-w-xs">
        {cfg.tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

function getConfig(
  status: DeliveryHealthStatus,
  devices: string[] | undefined,
): {
  Icon: typeof Printer;
  label: string;
  classes: string;
  tooltip: React.ReactNode;
} {
  // Tooltip con la lista de dispositivos.
  const deviceList = devices ?? [];
  const deviceBlock = (
    <>
      <p className="font-medium">Dispositivos detectados:</p>
      {deviceList.length === 0 ? (
        <p className="text-muted-foreground">(aun sin datos)</p>
      ) : (
        <ul className="mt-1 list-disc pl-4 text-xs">
          {deviceList.map((d, i) => (
            <li key={i} className="break-all">
              {d}
            </li>
          ))}
        </ul>
      )}
    </>
  );

  if (status === "unknown") {
    return {
      Icon: HelpCircle,
      label: "Impresora: comprobando...",
      classes:
        "border-transparent bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
      tooltip: (
        <div className="space-y-1">
          <p>Esperando primer health check del backend de impresion.</p>
          {deviceBlock}
        </div>
      ),
    };
  }

  if (status === "error") {
    return {
      Icon: CircleX,
      label: "Impresora: error",
      classes:
        "border-transparent bg-rose-500/10 text-rose-700 dark:text-rose-300",
      tooltip: (
        <div className="space-y-1">
          <p className="font-medium">No se pudo conectar con la impresora.</p>
          <p className="text-xs text-muted-foreground">
            Las ventas se registran igualmente; los tickets quedaran
            como pendientes y podras reintentarlos desde el detalle de caja.
          </p>
          {deviceBlock}
        </div>
      ),
    };
  }

  if (status === "noop") {
    return {
      Icon: CircleAlert,
      label: "Impresora: modo demo",
      classes:
        "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-300",
      tooltip: (
        <div className="space-y-1">
          <p className="font-medium">Modo NoOp activo.</p>
          <p className="text-xs text-muted-foreground">
            No hay dispositivo fisico configurado. Las ventas se
            registran correctamente; los tickets se marcan como
            entregados sin imprimir.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Para activar una impresora, configura las variables
            <code className="mx-1 rounded bg-muted px-1">FERIANET_PRINTER</code>
            o
            <code className="mx-1 rounded bg-muted px-1">FERIANET_TICKETS_DIR</code>
            y reinicia la app.
          </p>
          {deviceBlock}
        </div>
      ),
    };
  }

  // status === "ok"
  const firstDevice = devices?.[0] ?? "dispositivo activo";
  return {
    Icon: CircleCheck,
    label: "Impresora OK",
    classes:
      "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    tooltip: (
      <div className="space-y-1">
        <p className="font-medium">Backend de impresion operativo.</p>
        <p className="text-xs text-muted-foreground">
          Activo: <span className="font-mono">{firstDevice}</span>
        </p>
        {deviceList.length > 1 && deviceBlock}
      </div>
    ),
  };
}