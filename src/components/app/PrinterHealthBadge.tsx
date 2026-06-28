/**
 * components/app/PrinterHealthBadge.tsx — FeriaNet
 *
 * Chip discreto en la cabecera del layout que refleja el estado
 * del backend de impresion (`ticket-delivery`). Consume
 * `useDeliveryStatus` directamente (1 sola llamada al backend) y
 * deriva el visual desde los 6 campos del snapshot
 * (`DeliveryStatus`).
 *
 * 5 estados visuales + 1 estado de carga:
 *  - `init_error != null`               -> ROJO   "Impresora rota".
 *                                         Backend intento inicializarse
 *                                         y fallo. El operador DEBE
 *                                         enterarse (antes de TEAM-014
 *                                         era "Impresora OK" enganoso).
 *  - `attempted_kind != null && noop`   -> AMBAR  "Sin impresora".
 *                                         Fallback explicito sin error
 *                                         visible. Caso borde.
 *  - `healthy && kind != noop`          -> VERDE  "Impresora OK".
 *  - `!healthy && init_error == null`   -> ROJO   "Impresora con error".
 *                                         Health check falla en runtime
 *                                         (USB desconectado, path borrado).
 *  - `kind = noop` default              -> AMBAR  "Sin impresora".
 *                                         Modo demo / sin config.
 *  - `data === undefined` (cargando)    -> GRIS   "Comprobando...".
 *
 * El chip NO bloquea la UI. Es informativo. La venta NUNCA falla
 * por la impresion (regla dura de la epica 3).
 *
 * Tooltip: muestra `backend_label` del backend (ya formateado) mas
 * `init_error` verbatim si aplica. Texto plano -> React escapa por
 * defecto, sin riesgo XSS aunque `init_error` contenga paths/HTML.
 */

import {
  CircleAlert,
  CircleCheck,
  CircleX,
  HelpCircle,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDeliveryStatus } from "@/hooks/queries/delivery";
import type { DeliveryStatus } from "@/types/domain";

interface BadgeConfig {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  classes: string;
  tooltip: React.ReactNode;
  /** Texto completo para `aria-label` del boton. */
  ariaLabel: string;
}

export function PrinterHealthBadge({ className }: { className?: string }) {
  const statusQuery = useDeliveryStatus();
  const cfg = getConfig(statusQuery.data, statusQuery.isPending);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={cfg.ariaLabel}
          aria-live="polite"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs transition-colors",
            "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            cfg.classes,
            className,
          )}
        >
          <cfg.Icon className="size-3" aria-hidden="true" />
          <span className="hidden sm:inline">{cfg.label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="end" className="max-w-xs">
        {cfg.tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Resuelve el visual del chip segun el snapshot del backend.
 *
 * Reglas en orden de prioridad (ver JSDoc del componente y brief
 * de TEAM-015). Las 4 primeras reglas son las que el operador
 * necesita ver para entender que pasa con su impresora.
 */
function getConfig(
  status: DeliveryStatus | undefined,
  isPending: boolean,
): BadgeConfig {
  // Estado de carga: sin datos todavia. Gris neutro, sin alarmar.
  if (isPending || !status) {
    return {
      Icon: HelpCircle,
      label: "Impresora: comprobando...",
      classes:
        "border-transparent bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
      ariaLabel: "Estado de la impresora: comprobando",
      tooltip: (
        <p>Esperando primer estado del backend de impresion.</p>
      ),
    };
  }

  // Regla 1 (prioridad maxima): init_error != null.
  // El backend intento inicializarse (File / Thermal) y fallo: el
  // operador DEBE ver esto. Antes de TEAM-014 era el "fallback
  // silencioso" que cerraba el H1 del QA de la epica 3.
  if (status.init_error !== null) {
    return {
      Icon: CircleX,
      label: "Impresora rota",
      classes:
        "border-transparent bg-rose-500/10 text-rose-700 dark:text-rose-300",
      ariaLabel: "Estado de la impresora: rota, hay un error de inicializacion",
      tooltip: (
        <div className="space-y-1">
          <p className="font-medium">
            ⚠️ Backend de impresión no funciona: {status.init_error}.
          </p>
          <p className="text-xs text-muted-foreground">
            Los tickets NO se están guardando. Revisa{" "}
            <code className="rounded bg-muted px-1">FERIANET_TICKETS_DIR</code>{" "}
            o{" "}
            <code className="rounded bg-muted px-1">FERIANET_PRINTER</code>.
          </p>
          <p className="text-xs text-muted-foreground">
            Backend activo: <span className="font-mono">{status.backend_label}</span>
          </p>
        </div>
      ),
    };
  }

  // Regla 2: attempted_kind != null && kind === 'noop'.
  // Fallback explicito sin init_error visible (caso borde en el
  // codigo actual, pero el brief lo pide por contrato).
  if (status.attempted_kind !== null && status.kind === "noop") {
    return {
      Icon: CircleAlert,
      label: "Sin impresora",
      classes:
        "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-300",
      ariaLabel: `Estado de la impresora: sin impresora (fallback desde ${status.attempted_kind})`,
      tooltip: (
        <div className="space-y-1">
          <p className="font-medium">
            ⚠️ Backend configurado {status.attempted_kind} inválido. Usando NoOp.
          </p>
          <p className="text-xs text-muted-foreground">
            Los tickets NO se imprimen. Revisa la configuración.
          </p>
          <p className="text-xs text-muted-foreground">
            Backend activo: <span className="font-mono">{status.backend_label}</span>
          </p>
        </div>
      ),
    };
  }

  // Regla 3: backend activo, sano y no NoOp.
  if (status.healthy && status.kind !== "noop") {
    return {
      Icon: CircleCheck,
      label: "Impresora OK",
      classes:
        "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      ariaLabel: "Estado de la impresora: OK",
      tooltip: (
        <div className="space-y-1">
          <p className="font-medium">
            Impresora OK · {status.devices.join(", ") || "dispositivo activo"}
          </p>
          <p className="text-xs text-muted-foreground">
            Backend: <span className="font-mono">{status.backend_label}</span>
          </p>
        </div>
      ),
    };
  }

  // Regla 4: !healthy pero sin init_error -> fallo en runtime del
  // backend (Thermal/File). NO es fallback: el operador configuro
  // algo real pero ahora no responde.
  if (!status.healthy) {
    return {
      Icon: CircleX,
      label: "Impresora con error",
      classes:
        "border-transparent bg-rose-500/10 text-rose-700 dark:text-rose-300",
      ariaLabel: `Estado de la impresora: error en backend ${status.kind}`,
      tooltip: (
        <div className="space-y-1">
          <p className="font-medium">
            ⚠️ Health check del backend {status.kind} falló.
          </p>
          <p className="text-xs text-muted-foreground">
            La venta funciona pero los tickets no se imprimen.
          </p>
          <p className="text-xs text-muted-foreground">
            Backend activo: <span className="font-mono">{status.backend_label}</span>
          </p>
        </div>
      ),
    };
  }

  // Regla 5 (default): kind = noop, sin attempted, sin error.
  // Modo demo / sin configuracion. Ambar discreto: avisa pero no
  // alarma. Es el estado "natural" al instalar sin variables de
  // entorno.
  return {
    Icon: CircleAlert,
    label: "Sin impresora",
    classes:
      "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-300",
    ariaLabel: "Estado de la impresora: sin impresora (modo NoOp)",
    tooltip: (
      <div className="space-y-1">
        <p className="font-medium">Modo NoOp activo. Los tickets no se imprimen.</p>
        <p className="text-xs text-muted-foreground">
          Configura{" "}
          <code className="rounded bg-muted px-1">FERIANET_PRINTER</code> o{" "}
          <code className="rounded bg-muted px-1">FERIANET_TICKETS_DIR</code>{" "}
          para activar impresión.
        </p>
        <p className="text-xs text-muted-foreground">
          Backend: <span className="font-mono">{status.backend_label}</span>
        </p>
      </div>
    ),
  };
}