/**
 * pages/CajaDetallePage.tsx — FeriaNet
 *
 * Detalle de una caja diaria (CashSession). Muestra:
 *  - Cabecera: atraccion, fecha, hora apertura, estado (badge).
 *  - Stats: total vendido (cerrada), fondo inicial, fondo cierre
 *    (cerrada), numero de ventas, tickets pendientes.
 *  - Listado de ventas del dia (tabla simple).
 *  - Acciones: si abierta, "Ir al TPV" + "Cerrar caja"; si cerrada,
 *    solo lectura.
 *
 * Resolucion por id: el backend NO expone `get_cash_session_by_id`.
 * Usamos `useCashSessionById(id)` que resuelve desde el fan-out
 * cacheado (`useAllCashSessionsWithContext`).
 */

import { useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowRight,
  Banknote,
  CircleDot,
  Clock,
  ExternalLink,
  Loader2,
  Ticket as TicketIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { PageHeader } from "@/components/app/PageHeader";
import { DetailSkeleton, ListSkeleton } from "@/components/app/LoadingState";
import { EmptyState } from "@/components/app/EmptyState";
import { ErrorState } from "@/components/app/ErrorState";
import { ColorChip } from "@/components/app/ColorChip";

import {
  useCashSessionById,
  useCloseCashSession,
} from "@/hooks/queries/cash_sessions";
import { useSalesByCashSession } from "@/hooks/queries/sales";
import {
  closeCashSessionFormSchema,
  type CloseCashSessionFormValues,
} from "@/lib/schemas";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eurToCents, formatEur } from "@/lib/money";
import { formatLocalDate, formatTimestamp } from "@/lib/datetime";
import type { z } from "zod";

export function CajaDetallePage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const ctx = useCashSessionById(sessionId);
  const salesQuery = useSalesByCashSession(ctx.session?.id);
  const closeCashSession = useCloseCashSession();

  const [closeOpen, setCloseOpen] = useState(false);

  // ----- Estados de carga / error / no-encontrada -----

  if (ctx.isPending) {
    return (
      <div className="mx-auto max-w-5xl">
        <DetailSkeleton />
      </div>
    );
  }

  if (ctx.isError) {
    return (
      <div className="mx-auto max-w-5xl">
        <ErrorState
          error={ctx.error}
          onRetry={() => window.location.reload()}
          title="No se pudo cargar la caja"
        />
      </div>
    );
  }

  if (!ctx.session || !ctx.attraction || !ctx.edition) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <ErrorState
          title="Caja no encontrada"
          error={new Error(
            "El identificador no existe o fue eliminado. Vuelve al listado para abrir una caja nueva.",
          )}
        />
        <div className="text-center">
          <Button asChild size="sm">
            <Link to="/cajas">
              <ArrowRight className="size-3.5" />
              Ir al listado de cajas
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const { session, attraction, edition } = ctx;
  const isOpen = session.closed_at === null;

  // ----- Handlers -----

  async function handleClose(values: CloseCashSessionFormValues) {
    if (!session) return;
    const cents = eurToCents(values.closing_amount_eur);
    if (cents === null) {
      toast.error("Importe invalido.");
      return;
    }
    const closed = await closeCashSession.mutateAsync({
      id: session.id,
      input: { closing_amount_cents: cents },
    });
    toast.success(
      `Caja cerrada con ${formatEur(closed.closing_amount_cents ?? 0)}.`,
    );
    setCloseOpen(false);
  }

  // ----- Render -----

  const salesCount = salesQuery.data?.length ?? 0;
  // Ventas totales en EUR para mostrar en stats. Backend no expone
  // get_sale_with_lines por caja; aqui usamos la suma de `total_amount_cents`.
  const salesTotalCents =
    salesQuery.data?.reduce((acc, s) => acc + s.total_amount_cents, 0) ?? null;

  return (
    <>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link to="/cajas">
            <ArrowRight className="size-3.5" />
            Volver a cajas
          </Link>
        </Button>

        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <ColorChip color={attraction.color} />
              <span>{attraction.name}</span>
              {isOpen ? (
                <Badge variant="outline" className="border-transparent bg-emerald-500/10 px-1.5 py-0 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  <CircleDot className="mr-1 size-3" />
                  Abierta
                </Badge>
              ) : (
                <Badge variant="outline" className="border-transparent bg-zinc-500/10 px-1.5 py-0 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Cerrada
                </Badge>
              )}
            </span>
          }
          subtitle={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
              <span>{formatLocalDate(session.date)}</span>
              {ctx.fair && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    {ctx.fair.name} {edition.year}
                  </span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>
                Apertura {formatTimestamp(session.opened_at)}
              </span>
              {session.closed_at && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Cierre {formatTimestamp(session.closed_at)}</span>
                </>
              )}
            </span>
          }
          actions={
            isOpen ? (
              <div className="flex items-center gap-2">
                <Button asChild size="sm">
                  <Link to={`/tpv?session=${session.id}`}>
                    <ExternalLink className="size-3.5" />
                    Ir al TPV
                  </Link>
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setCloseOpen(true)}>
                  <X className="size-3.5" />
                  Cerrar caja
                </Button>
              </div>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link to={`/tpv?session=${session.id}`}>
                  <ExternalLink className="size-3.5" />
                  Ver TPV
                </Link>
              </Button>
            )
          }
        />

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
            <CardDescription>
              {isOpen
                ? "Caja en curso. Los totales se calculan al cerrar."
                : "Caja cerrada. Los totales quedaron congelados al cierre."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
              <Stat
                label="Fondo inicial"
                value={formatEur(session.opening_amount_cents)}
                icon={<Banknote className="size-3.5" />}
              />
              <Stat
                label="Total vendido"
                value={
                  isOpen
                    ? "—"
                    : formatEur(session.total_amount_cents ?? salesTotalCents)
                }
                icon={<TicketIcon className="size-3.5" />}
                emphasis={!isOpen}
              />
              <Stat
                label="Fondo cierre"
                value={
                  isOpen ? "—" : formatEur(session.closing_amount_cents)
                }
                icon={<Banknote className="size-3.5" />}
              />
              <Stat
                label="Numero de ventas"
                value={salesCount.toString()}
                icon={<Clock className="size-3.5" />}
              />
            </dl>
          </CardContent>
        </Card>

        {/* Ventas */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas del dia</CardTitle>
            <CardDescription>
              Una fila por venta. El total cobrado esta congelado en el
              momento de la venta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {salesQuery.isPending && <ListSkeleton rows={3} />}
            {salesQuery.isError && (
              <ErrorState
                error={salesQuery.error}
                onRetry={() => salesQuery.refetch()}
                title="No se pudieron cargar las ventas"
              />
            )}
            {salesQuery.isSuccess && salesQuery.data.length === 0 && (
              <EmptyState
                icon={<TicketIcon className="size-5" />}
                title={isOpen ? "Aun no hay ventas" : "Caja cerrada sin ventas"}
                description={
                  isOpen
                    ? "Las ventas que registres en el TPV apareceran aqui."
                    : "Esta caja se cerro sin registrar ventas."
                }
                action={
                  isOpen ? (
                    <Button asChild size="sm">
                      <Link to={`/tpv?session=${session.id}`}>
                        <ExternalLink className="size-3.5" />
                        Ir al TPV
                      </Link>
                    </Button>
                  ) : undefined
                }
              />
            )}
            {salesQuery.isSuccess && salesQuery.data.length > 0 && (
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="w-16 text-right">Tickets</TableHead>
                      <TableHead className="w-28 text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesQuery.data.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {formatTimestamp(s.created_at).split(" ")[1] ?? "-"}
                        </TableCell>
                        <TableCell>
                          {s.offer_id ? (
                            <Badge variant="outline" className="border-transparent bg-violet-500/10 text-[10px] text-violet-700 dark:text-violet-300">
                              Oferta
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Suelta
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {/* El backend expone solo Sale (sin lineas/tickets)
                              en `list_sales_by_cash_session`. Mostramos el
                              numero de tickets = `total / unit_price` solo
                              si la venta es sin oferta (1 sola linea). Para
                              ventas con oferta, mostramos "bundle". El
                              detalle exacto requiere `get_sale`, que se
                              evita aqui para no hacer N+1. */}
                          {s.offer_id ? (
                            <span className="text-xs">bundle</span>
                          ) : (
                            <SaleTicketEstimate sale={s} />
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatEur(s.total_amount_cents)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CloseCashSessionDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        onSubmit={handleClose}
        isPending={closeCashSession.isPending}
      />
    </>
  );
}

/**
 * Placeholder para una estimacion futura del numero de tickets en una
 * venta. En v1 MVP el backend expone solo `Sale` (sin lineas/tickets)
 * en `list_sales_by_cash_session`; mostrar el conteo exacto requeriria
 * `get_sale` por fila, lo cual introduce N+1 queries en cajas grandes.
 *
 * Decidimos mostrar "-" hasta que la UI tenga un caso de uso real para
 * ese dato (p.ej. reimprimir tickets de una venta concreta).
 */
function SaleTicketEstimate(_: { sale: { total_amount_cents: number } }) {
  return <span>-</span>;
}

function Stat({
  label,
  value,
  icon,
  emphasis,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd
        className={
          emphasis
            ? "mt-0.5 text-lg font-semibold tabular-nums"
            : "mt-0.5 text-sm font-medium tabular-nums"
        }
      >
        {value}
      </dd>
    </div>
  );
}

// ============================================================
// Dialog de cierre de caja
// ============================================================

function CloseCashSessionDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CloseCashSessionFormValues) => Promise<void>;
  isPending: boolean;
}) {
  const form = useForm<
    z.input<typeof closeCashSessionFormSchema>,
    unknown,
    z.output<typeof closeCashSessionFormSchema>
  >({
    resolver: zodResolver(closeCashSessionFormSchema),
    defaultValues: {
      closing_amount_eur: 0,
    },
    mode: "onTouched",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cerrar caja</DialogTitle>
          <DialogDescription>
            Introduce el importe total declarado al cierre (efectivo en
            caja). El total vendido lo calcula el sistema al cerrar; la
            diferencia se mostrara en informes.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="closing_amount_eur"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="close-amount">
                    Importe declarado (EUR)
                  </FieldLabel>
                  <Input
                    id="close-amount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min={0}
                    placeholder="0.00"
                    autoFocus
                    aria-invalid={fieldState.invalid}
                    {...field}
                    value={
                      Number.isFinite(field.value) ? String(field.value) : ""
                    }
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                  <FieldDescription>
                    Efectivo en caja al cerrar. Puede NO coincidir con el
                    total vendido.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter className="-mx-4 -mb-4 mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Cerrar caja
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
