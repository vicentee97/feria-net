/**
 * components/app/PendingTicketsCard.tsx — FeriaNet
 *
 * Card discreto para mostrar los tickets pendientes de imprimir
 * de una caja y permitir reintento manual.
 *
 * Comportamiento:
 *  - Solo se monta cuando hay al menos 1 ticket pendiente.
 *  - Lista compacta: id corto, fecha/hora, estado del ultimo intento
 *    (success/failure con `error_code`).
 *  - Boton "Reintentar todos" con feedback de toast tras el reintento.
 *  - Si tras un reintento exitoso no quedan pendientes, la card
 *    desaparece sola (React Query invalida `pending_tickets`).
 *
 * UX:
 *  - Aviso, NO alarma: amarillo (color "warning"), icono discreto.
 *    El operador ya sabe que puede haber tickets fallidos; es un
 *    flujo normal, no un error critico.
 *  - `aria-live="polite"` para que el lector de pantalla avise
 *    del cambio tras un reintento.
 */

import { useState } from "react";
import {
  AlertTriangle,
  CircleAlert,
  Loader2,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useRetryPendingTickets } from "@/hooks/queries/delivery";
import { usePendingTicketsByCashSession } from "@/hooks/queries/sales";
import { formatTimestamp } from "@/lib/datetime";
import type { Ticket } from "@/types/domain";

interface PendingTicketsCardProps {
  cashSessionId: string;
  className?: string;
}

export function PendingTicketsCard({
  cashSessionId,
  className,
}: PendingTicketsCardProps) {
  const pendingQuery = usePendingTicketsByCashSession(cashSessionId);
  const retryMutation = useRetryPendingTickets();
  const [lastSummary, setLastSummary] = useState<string | null>(null);

  const tickets = pendingQuery.data;
  const isLoading = pendingQuery.isPending;
  const count = tickets?.length ?? 0;

  // Solo mostrar si hay tickets (despues de cargar). Esto hace que
  // la card desaparezca sola tras un reintento exitoso.
  if (!isLoading && count === 0) return null;

  async function handleRetry() {
    if (!cashSessionId) return;
    setLastSummary(null);
    try {
      const result = await retryMutation.mutateAsync({
        cash_session_id: cashSessionId,
      });
      const summary =
        result.attempted === 0
          ? "No quedaban tickets pendientes."
          : `Reintentados: ${result.attempted}. Éxitos: ${result.succeeded}. Fallos: ${result.failed}.`;
      setLastSummary(summary);
      toast.success(summary);
    } catch {
      // El hook ya emitio el toast de error; no hacemos nada aqui.
      // El caller no necesita try/catch para mostrar el toast.
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle
            className="size-4 text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          />
          Tickets pendientes de impresión
        </CardTitle>
        <CardDescription>
          {isLoading
            ? "Comprobando tickets pendientes..."
            : `${count} ${count === 1 ? "ticket pendiente" : "tickets pendientes"} de esta caja.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : (
          <>
            {/* Lista compacta (no tabla; maximo ~10 tickets tipicos). */}
            <ul
              aria-live="polite"
              className="divide-y rounded-md border bg-background/50"
            >
              {tickets!.map((t) => (
                <PendingTicketRow key={t.id} ticket={t} />
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <p className="text-xs text-muted-foreground">
                {lastSummary ?? (
                  <>
                    Las ventas están registradas. Los tickets no se
                    imprimieron automáticamente; puedes reintentarlos
                    manualmente.
                  </>
                )}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRetry}
                disabled={retryMutation.isPending}
                aria-label="Reintentar todos los tickets pendientes"
              >
                {retryMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <RotateCw className="size-3.5" aria-hidden="true" />
                )}
                {retryMutation.isPending ? "Reintentando..." : "Reintentar todos"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PendingTicketRow({ ticket }: { ticket: Ticket }) {
  // El backend expone solo `Ticket` (sin historial de intentos
  // detallado) desde `list_pending_tickets_by_cash_session`. Cada
  // fila representa un ticket cuyo ULTIMO intento fue `failure`;
  // no mostramos `error_code` aqui porque el command no lo trae.
  // El operador ve el id corto y la hora; para detalles tecnicos
  // tendria que consultar la tabla `ticket_delivery_attempt` (post-MVP).
  const shortId = ticket.id.slice(0, 8);

  return (
    <li className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
      <div className="flex min-w-0 items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="border-transparent bg-amber-500/10 px-1.5 py-0 text-[10px] font-mono text-amber-700 dark:text-amber-300"
            >
              {shortId}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="font-mono text-xs">{ticket.id}</p>
          </TooltipContent>
        </Tooltip>
        <span className="truncate text-xs text-muted-foreground">
          {formatTimestamp(ticket.created_at)}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1 text-xs">
        <CircleAlert
          className="size-3.5 text-amber-600 dark:text-amber-400"
          aria-hidden="true"
        />
        <span className="text-amber-700 dark:text-amber-300">Pendiente</span>
      </div>
    </li>
  );
}