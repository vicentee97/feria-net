/**
 * pages/CajasListadoPage.tsx — FeriaNet
 *
 * Listado global de cajas: agrupa por dia (hoy / recientes / antiguas)
 * y muestra para cada caja la atraccion, la fecha, la apertura, el
 * cierre (o "Abierta") y el total si esta cerrada.
 *
 * Carga via fan-out (`useAllCashSessionsWithContext`): fairs ->
 * editions -> attractions -> cash_sessions. React Query deduplica y
 * cachea cada nivel, asi paginas vecinas no duplican peticiones.
 *
 * Decisiones de diseno:
 *  - El CTA "Abrir caja" navega a `/cajas/nueva` (formulario propio
 *    con su propio selector de atraccion). No hay pre-seleccion aqui.
 *  - Cada fila es un link al detalle (`/cajas/:id`) con la atraccion
 *    accesible desde el cache del listado.
 *  - El contador "X tickets pendientes" sale del listado de ventas
 *    + tickets pendientes; en esta vista mostramos el total de la caja
 *    si esta cerrada (que es lo que el operador consulta a menudo).
 */

import { Link } from "react-router";
import {
  ArrowLeftRight,
  ChevronRight,
  CircleDot,
  Plus,
  ReceiptText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { ListSkeleton } from "@/components/app/LoadingState";
import { ErrorState } from "@/components/app/ErrorState";

import { useAllCashSessionsWithContext } from "@/hooks/queries/cash_sessions";
import { formatLocalDate, todayLocalISO } from "@/lib/datetime";
import { formatEur } from "@/lib/money";
import type { Attraction, CashSession, Fair, FairEdition } from "@/types/domain";

/** Fechas que mostramos en el listado. Hoy + ultimos 7 dias + resto. */
const RECENT_DAYS = 7;

/**
 * Devuelve la fecha (YYYY-MM-DD local) de hace `days` dias.
 * Usado para decidir si una caja es "reciente".
 */
function daysAgoLocalISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface SessionRow {
  session: CashSession;
  attractionName: string;
  attractionColor: string;
  editionYear: number | null;
  fairName: string | null;
}

function buildRow(
  session: CashSession & { _attractionId: string },
  attractionById: Record<string, Attraction>,
  editionByAttractionId: Record<string, FairEdition>,
  fairByEditionId: Record<string, Fair>,
): SessionRow {
  const attr = attractionById[session._attractionId];
  if (!attr) {
    return {
      session,
      attractionName: "Atraccion desconocida",
      attractionColor: "#888888",
      editionYear: null,
      fairName: null,
    };
  }
  const ed = editionByAttractionId[attr.id];
  const f = ed ? fairByEditionId[ed.id] : undefined;
  return {
    session,
    attractionName: attr.name,
    attractionColor: attr.color,
    editionYear: ed?.year ?? null,
    fairName: f?.name ?? null,
  };
}

export function CajasListadoPage() {
  const ctx = useAllCashSessionsWithContext();

  // Construir filas con contexto (atraccion, edicion, feria).
  const isReady = !ctx.isPending && !ctx.isError;
  const rows: SessionRow[] = isReady
    ? ctx.sessions.map((s) =>
        buildRow(s, ctx.attractionById, ctx.editionByAttractionId, ctx.fairByEditionId),
      )
    : [];

  // Ordenar por fecha descendente, luego por hora de apertura desc.
  rows.sort((a, b) => {
    if (a.session.date !== b.session.date) {
      return a.session.date < b.session.date ? 1 : -1;
    }
    return a.session.opened_at < b.session.opened_at ? 1 : -1;
  });

  // Buckets por fecha.
  const today = todayLocalISO();
  const recentCutoff = daysAgoLocalISO(RECENT_DAYS);

  const todayRows = rows.filter((r) => r.session.date === today);
  const recentRows = rows.filter(
    (r) => r.session.date !== today && r.session.date >= recentCutoff,
  );
  const olderRows = rows.filter((r) => r.session.date < recentCutoff);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        title="Cajas"
        subtitle="Aperturas de caja de tus atracciones. Cada caja agrupa las ventas de un dia."
        actions={
          <Button asChild size="sm">
            <Link to="/cajas/nueva">
              <Plus className="size-4" />
              Abrir nueva caja
            </Link>
          </Button>
        }
      />

      {ctx.isPending && (
        <div className="space-y-3">
          <ListSkeleton rows={4} />
        </div>
      )}

      {ctx.isError && (
        <ErrorState
          error={ctx.error}
          onRetry={() => window.location.reload()}
          title="No se pudieron cargar las cajas"
        />
      )}

      {isReady && rows.length === 0 && (
        <EmptyState
          icon={<ReceiptText className="size-5" />}
          title="Aun no tienes cajas"
          description="No hay cajas hoy. Abre la primera para empezar a vender."
          action={
            <Button asChild>
              <Link to="/cajas/nueva">
                <Plus className="size-4" />
                Abrir primera caja
              </Link>
            </Button>
          }
        />
      )}

      {isReady && rows.length > 0 && (
        <>
          <SessionGroup
            title="Hoy"
            rows={todayRows}
            emptyHint="No hay cajas abiertas hoy."
          />
          <SessionGroup
            title={`Recientes (${RECENT_DAYS} dias)`}
            rows={recentRows}
            emptyHint={`Sin cajas en los ultimos ${RECENT_DAYS} dias.`}
          />
          {olderRows.length > 0 && (
            <SessionGroup title="Anteriores" rows={olderRows} />
          )}
        </>
      )}
    </div>
  );
}

function SessionGroup({
  title,
  rows,
  emptyHint,
}: {
  title: string;
  rows: SessionRow[];
  emptyHint?: string;
}) {
  return (
    <section className="space-y-2">
      <header className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <span className="text-xs text-muted-foreground">
          {rows.length} {rows.length === 1 ? "caja" : "cajas"}
        </span>
      </header>
      {rows.length === 0 && emptyHint ? (
        <p className="rounded-md border border-dashed bg-background/60 px-3 py-4 text-center text-xs text-muted-foreground">
          {emptyHint}
        </p>
      ) : (
        <ul className="overflow-hidden rounded-md border bg-background">
          {rows.map((row, idx) => (
            <li
              key={row.session.id}
              className={cn(
                "group",
                idx > 0 && "border-t",
              )}
            >
              <SessionRowItem row={row} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SessionRowItem({ row }: { row: SessionRow }) {
  const { session, attractionName, attractionColor, editionYear, fairName } = row;
  const isOpen = session.closed_at === null;
  return (
    <Link
      to={`/cajas/${session.id}`}
      className="flex items-center gap-3 px-3 py-2.5 outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        aria-hidden="true"
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: attractionColor }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{attractionName}</span>
          {isOpen ? (
            <Badge variant="outline" className="border-transparent bg-emerald-500/10 px-1.5 py-0 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
              <CircleDot className="mr-1 size-2.5" />
              Abierta
            </Badge>
          ) : (
            <Badge variant="outline" className="border-transparent bg-zinc-500/10 px-1.5 py-0 text-[10px] font-medium text-zinc-700 dark:text-zinc-300">
              Cerrada
            </Badge>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span>{formatLocalDate(session.date)}</span>
          {fairName && editionYear && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                {fairName} {editionYear}
              </span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>Apertura {formatTime(session.opened_at)}</span>
          {session.closed_at && (
            <>
              <span aria-hidden="true">·</span>
              <span>Cierre {formatTime(session.closed_at)}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-right">
        {session.total_amount_cents != null ? (
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold tabular-nums">
              {formatEur(session.total_amount_cents)}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Total
            </span>
          </div>
        ) : isOpen ? (
          <div className="flex flex-col items-end text-muted-foreground">
            <ArrowLeftRight className="size-3.5" />
            <span className="text-[10px] uppercase tracking-wide">En curso</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
        <ChevronRight className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </div>
    </Link>
  );
}

/**
 * `formatTime` — extrae "HH:mm" de un timestamp ISO 8601 UTC,
 * convertido a hora local del operador (la hora del navegador del
 * puesto). Pensado solo para la UI; los timestamps del backend son
 * UTC.
 */
function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
