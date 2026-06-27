/**
 * pages/TpvPage.tsx — FeriaNet
 *
 * Pantalla principal del TPV. Es la pieza mas usada del producto y
 * debe priorizar velocidad y claridad sobre cualquier otra cosa.
 *
 * Decisiones de diseno (criterio UX senior, no landing):
 *
 *  1. **Nada de navegacion visible**. El operador entra aqui desde
 *     `/cajas/:id` y no necesita la sidebar ni el breadcrumb
 *     detallado. El header compacto muestra solo "atraccion · edicion ·
 *     caja abierta". El sidebar sigue visible (necesitamos "Salir
 *     del TPV" via el menu lateral como fallback) pero el foco es 100%
 *     la venta.
 *
 *  2. **Selector de cantidad +/-** con botones grandes (>= 44x44 px)
 *     e input editable. Cantidad por defecto 1. Si hay oferta, el
 *     campo se vuelve readonly y muestra `bundle_quantity` (el backend
 *     rechaza si la cantidad no coincide con el bundle; data-model §5.4).
 *
 *  3. **Selector de oferta** (radio-group horizontal, hidden si no
 *     hay ofertas activas en la edicion). Al elegir una oferta,
 *     cantidad se autocompleta con `bundle_quantity` y el total es
 *     el `bundle_price_cents` (independiente de la cantidad, que
 *     queda fijada al bundle).
 *
 *  4. **Total grande** (>= 4rem). El dato mas importante de la pantalla.
 *
 *  5. **Boton VENDER** enorme. Primary color. Requiere confirmacion
 *     solo si hay error de validacion.
 *
 *  6. **Feedback inmediato**: toast verde con desglose + actualizacion
 *     del listado de ventas + indicador "ultima venta" debajo.
 *
 *  7. **Sin indicador offline**. La app es local-first; cualquier
 *     error de red es un bug del backend, no UX que mostrar.
 *
 *  8. **Acciones secundarias** abajo, claramente menos prominentes:
 *     "Cerrar caja" (dialog) y "Salir del TPV".
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  ChevronLeft,
  LogOut,
  Minus,
  Plus,
  Ticket as TicketIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { PageHeader } from "@/components/app/PageHeader";
import { DetailSkeleton } from "@/components/app/LoadingState";
import { ErrorState } from "@/components/app/ErrorState";

import {
  useCashSessionById,
  useCloseCashSession,
} from "@/hooks/queries/cash_sessions";
import { useOffersByEdition } from "@/hooks/queries/offers";
import { useCreateSale, useSalesByCashSession } from "@/hooks/queries/sales";
import { usePrintTickets } from "@/hooks/queries/delivery";
import {
  closeCashSessionFormSchema,
  type CloseCashSessionFormValues,
} from "@/lib/schemas";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { eurToCents, formatEur } from "@/lib/money";
import { formatRelativeTime } from "@/lib/datetime";
import type { Offer, SaleWithLines } from "@/types/domain";
import { PrintIndicator, type PrintIndicatorState } from "@/components/app/PrintIndicator";

/** Cantidad maxima que el operador puede seleccionar en una venta. */
const MAX_QTY = 10000;
/** Minimo. El backend ya enforcea `quantity >= 1`. */
const MIN_QTY = 1;

/**
 * Llave del localStorage donde guardamos la ultima venta del TPV.
 * Pensado para que el indicador "Ultima venta" sobreviva a un
 * refresh accidental de la pantalla.
 */
const LAST_SALE_KEY_PREFIX = "tpv.last_sale.";

export function TpvPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session") ?? undefined;

  const ctx = useCashSessionById(sessionId);
  const salesQuery = useSalesByCashSession(ctx.session?.id);
  const createSale = useCreateSale(ctx.session?.id ?? "");
  const closeCashSession = useCloseCashSession();

  // Hooks de impresion (epica 3). Best-effort: la venta se registra
  // primero; el print es fire-and-forget desde el punto de vista del
  // backend (el command `print_ticket` nunca falla la venta).
  const printTickets = usePrintTickets();
  // Estado local del indicador de impresion (idle/printing/partial/failed).
  // No afecta al flujo de venta: solo a la UI del header.
  const [printingState, setPrintingState] = useState<PrintIndicatorState>("idle");
  const [printingInFlight, setPrintingInFlight] = useState<number>(0);

  // Ofertas activas de la edicion (no soft-deleted).
  const offersQuery = useOffersByEdition(ctx.edition?.id);

  // Estado de oferta seleccionada: `null` = sin oferta, id = oferta elegida.
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  // Estado de cantidad.
  const [quantity, setQuantity] = useState<number>(1);
  // Feedback "ultima venta".
  const [lastSale, setLastSale] = useState<{ at: string; sale: SaleWithLines } | null>(
    () => {
      if (typeof window === "undefined" || !sessionId) return null;
      try {
        const raw = window.localStorage.getItem(LAST_SALE_KEY_PREFIX + sessionId);
        return raw ? (JSON.parse(raw) as { at: string; sale: SaleWithLines }) : null;
      } catch {
        return null;
      }
    },
  );
  // "Now" tick para refrescar el tiempo relativo.
  const [now, setNow] = useState(() => new Date());

  // Tick del reloj para `formatRelativeTime`.
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 5000);
    return () => window.clearInterval(t);
  }, []);

  // Reseteo al cambiar de sesion.
  useEffect(() => {
    setSelectedOfferId(null);
    setQuantity(1);
    // Reset del indicador de impresion al cambiar de caja: cada
    // caja tiene su propio contexto de tickets pendientes.
    setPrintingState("idle");
    setPrintingInFlight(0);
    if (typeof window !== "undefined" && !sessionId) return;
    try {
      const raw = window.localStorage.getItem(LAST_SALE_KEY_PREFIX + sessionId!);
      setLastSale(raw ? (JSON.parse(raw) as { at: string; sale: SaleWithLines }) : null);
    } catch {
      setLastSale(null);
    }
  }, [sessionId]);

  // Oferta seleccionada (objeto) o null.
  const selectedOffer = useMemo<Offer | null>(() => {
    if (!selectedOfferId) return null;
    return offersQuery.data?.find((o) => o.id === selectedOfferId) ?? null;
  }, [selectedOfferId, offersQuery.data]);

  // Cuando hay oferta, fijamos cantidad = bundle_quantity.
  useEffect(() => {
    if (selectedOffer) {
      setQuantity(selectedOffer.bundle_quantity);
    }
  }, [selectedOffer]);

  // Calculo del total y de los parametros de la venta.
  const ticketPriceCents = ctx.attraction?.base_ticket_price ?? 0;
  const totalCents = selectedOffer
    ? selectedOffer.bundle_price_cents
    : Math.max(0, Math.floor(quantity * ticketPriceCents));
  const ticketsCount = selectedOffer ? selectedOffer.bundle_quantity : quantity;

  // ----- Estados de carga / error / caja no-encontrada -----

  if (ctx.isPending) {
    return (
      <div className="mx-auto max-w-3xl">
        <DetailSkeleton />
      </div>
    );
  }

  if (ctx.isError) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState
          error={ctx.error}
          onRetry={() => window.location.reload()}
          title="No se pudo cargar la caja"
        />
      </div>
    );
  }

  if (!ctx.session || !ctx.attraction || !ctx.edition || !ctx.fair) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <ErrorState
          title="Sesion de caja no encontrada"
          error={new Error(
            "No hay caja abierta con ese identificador. Vuelve al listado para abrir una caja nueva.",
          )}
        />
        <div className="text-center">
          <Button asChild size="sm">
            <Link to="/cajas">
              <ChevronLeft className="size-3.5" />
              Ir al listado de cajas
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const { session, attraction, edition, fair } = ctx;
  const isOpen = session.closed_at === null;

  // Si la caja esta cerrada, no permitimos vender.
  if (!isOpen) {
    return (
      <ClosedSessionView
        session={session}
        attraction={attraction}
        edition={edition}
        fair={fair}
      />
    );
  }

  // ----- Handlers -----

  function adjustQuantity(delta: number) {
    setQuantity((q) => {
      const next = Math.max(MIN_QTY, Math.min(MAX_QTY, q + delta));
      return next;
    });
  }

  function setQuantitySafe(n: number) {
    if (!Number.isFinite(n)) return;
    const clamped = Math.max(MIN_QTY, Math.min(MAX_QTY, Math.floor(n)));
    setQuantity(clamped);
  }

  async function handleSell() {
    if (!session || !attraction) return;
    if (!Number.isInteger(quantity) || quantity < MIN_QTY) {
      toast.error("Cantidad invalida.");
      return;
    }
    // Si hay oferta, el backend exige 1 sola linea con
    // quantity = bundle_quantity y unit_price = 0. Si no, cada
    // linea lleva unit_price = base_ticket_price y quantity = N.
    let lines: Array<{ quantity: number; unit_price_cents: number }>;
    let offerIdForBackend: string | null = null;
    if (selectedOffer) {
      lines = [
        {
          quantity: selectedOffer.bundle_quantity,
          unit_price_cents: 0,
        },
      ];
      offerIdForBackend = selectedOffer.id;
    } else {
      lines = [
        {
          quantity,
          unit_price_cents: attraction.base_ticket_price,
        },
      ];
    }

    const sale = await createSale.mutateAsync({
      cash_session_id: session.id,
      offer_id: offerIdForBackend,
      lines,
    });

    // Reset: cantidad a 1, oferta a "ninguna".
    setQuantity(1);
    setSelectedOfferId(null);

    // Toast verde contextual (la venta YA esta confirmada).
    const tickets = sale.tickets.length;
    toast.success(
      `Venta registrada: ${tickets} ${tickets === 1 ? "ticket" : "tickets"} = ${formatEur(sale.sale.total_amount_cents)}`,
    );

    // Persistir "ultima venta" para sobrevivir a refresh.
    const entry = { at: new Date().toISOString(), sale };
    setLastSale(entry);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(
          LAST_SALE_KEY_PREFIX + session.id,
          JSON.stringify(entry),
        );
      } catch {
        // Ignorar (cuota llena, etc).
      }
    }
    void now; // referenciado para que lint no se queje del setInterval

    // ----- Auto-print best-effort (epica 3) -----
    //
    // La venta ya esta registrada; la impresion NO debe bloquear
    // ni fallar la venta. Si `print_ticket` falla para uno o
    // varios tickets, los tickets quedan en `ticket_delivery_attempt`
    // con `outcome='failure'` y apareceran en el detalle de caja
    // como pendientes. El operador podra reintentarlos a mano.
    //
    // Mostramos un indicador discreto en la cabecera mientras
    // dura; el indicador vuelve a `idle` cuando termina (con o sin
    // exito). Si algun ticket fallo, pasa a `partial` y se queda
    // visible hasta que el usuario navega o vende otra cosa.
    const ticketIds = sale.tickets.map((t) => t.id);
    if (ticketIds.length === 0) return;

    setPrintingState("printing");
    setPrintingInFlight(ticketIds.length);
    try {
      const rows = await printTickets.mutateAsync(ticketIds);
      const failedRows = rows.filter(
        (r) => r.result === null || !r.result.success,
      );
      const failedCount = failedRows.length;
      if (failedCount === 0) {
        setPrintingState("idle");
        setPrintingInFlight(0);
      } else {
        setPrintingState("partial");
        // Warning contextual. No usamos `toast.error` porque el
        // partial NO es un error critico: la venta esta registrada,
        // el operador puede reintentar desde el detalle de caja.
        toast.warning(
          `${ticketIds.length - failedCount}/${ticketIds.length} tickets impresos. ${failedCount} pendiente${failedCount === 1 ? "" : "s"} (ver detalle de caja).`,
          {
            duration: 8000,
          },
        );
      }
    } catch {
      // El batch solo entra aqui si TODOS los tickets fallan en
      // la capa IPC (muy raro; `Promise.allSettled` ya absorbe
      // fallos individuales). Aun asi, la venta esta registrada.
      setPrintingState("failed");
      toast.error(
        "No se pudo iniciar la impresion. Los tickets quedaran como pendientes; reintentalos desde el detalle de caja.",
        { duration: 10000 },
      );
    }
  }

  async function handleCloseBox(values: CloseCashSessionFormValues) {
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
    navigate(`/cajas/${session.id}`, { replace: true });
  }

  // ----- Render -----

  const offers = offersQuery.data ?? [];
  const hasOffers = offers.length > 0;
  const lastSaleTickets = lastSale?.sale.tickets.length ?? 0;
  const lastSaleTotalCents = lastSale?.sale.sale.total_amount_cents ?? 0;

  return (
    <>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-8">
        {/* Header compacto */}
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="inline-block size-3 rounded-full"
                style={{ backgroundColor: attraction.color }}
              />
              <span>TPV · {attraction.name}</span>
            </span>
          }
          subtitle={
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span>
                {fair.name} {edition.year} · caja abierta{" "}
                {formatRelativeTime(session.opened_at, now)}
              </span>
              {/* Indicador discreto de impresion (epica 3). Solo
                  aparece durante un print en curso o cuando hay
                  tickets pendientes de la ultima venta. */}
              <PrintIndicator
                state={printingState}
                inFlight={printingInFlight}
              />
            </span>
          }
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link to="/cajas">
                <LogOut className="size-3.5" />
                Salir del TPV
              </Link>
            </Button>
          }
        />

        {/* Ofertas */}
        {hasOffers && (
          <section className="rounded-lg border bg-background p-4 sm:p-5">
            <Label className="mb-3 block text-sm font-medium">Oferta</Label>
            <RadioGroup
              value={selectedOfferId ?? "__none"}
              onValueChange={(v) =>
                setSelectedOfferId(v === "__none" ? null : v)
              }
              className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
            >
              <OfferOption
                id="__none"
                label="Ninguna"
                description="Venta suelta"
                checked={selectedOfferId === null}
              />
              {offers.map((o) => (
                <OfferOption
                  key={o.id}
                  id={o.id}
                  label={o.name}
                  description={`${o.bundle_quantity} tickets por ${formatEur(o.bundle_price_cents)}`}
                  checked={selectedOfferId === o.id}
                />
              ))}
            </RadioGroup>
          </section>
        )}

        {/* Cantidad + Total */}
        <section className="rounded-lg border bg-background p-5 sm:p-6">
          <div className="mb-4">
            <Label className="text-sm font-medium">
              {selectedOffer
                ? `Cantidad del pack: ${selectedOffer.bundle_quantity}`
                : "Cantidad"}
            </Label>
          </div>

          {selectedOffer ? (
            <div className="mb-6 flex items-baseline gap-3 rounded-md bg-muted/40 px-4 py-3">
              <span className="text-2xl font-semibold tabular-nums">
                {selectedOffer.bundle_quantity}
              </span>
              <span className="text-sm text-muted-foreground">
                tickets (cantidad fijada por la oferta)
              </span>
            </div>
          ) : (
            <div className="mb-6 flex items-center justify-center gap-3 sm:gap-4">
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                className="size-12 sm:size-14"
                onClick={() => adjustQuantity(-1)}
                disabled={quantity <= MIN_QTY}
                aria-label="Disminuir cantidad"
              >
                <Minus className="size-6" />
              </Button>
              <Input
                type="number"
                inputMode="numeric"
                step={1}
                min={MIN_QTY}
                max={MAX_QTY}
                value={quantity}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setQuantitySafe(n);
                }}
                className="h-12 w-24 text-center text-2xl font-semibold tabular-nums sm:h-14 sm:w-28 sm:text-3xl"
                aria-label="Cantidad de tickets"
              />
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                className="size-12 sm:size-14"
                onClick={() => adjustQuantity(1)}
                disabled={quantity >= MAX_QTY}
                aria-label="Aumentar cantidad"
              >
                <Plus className="size-6" />
              </Button>
            </div>
          )}

          {/* Precio unitario + total */}
          <div className="space-y-2 rounded-md border-2 border-dashed bg-muted/20 p-4 sm:p-6">
            {selectedOffer ? (
              <p className="text-center text-sm text-muted-foreground">
                Precio del pack:{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {formatEur(selectedOffer.bundle_price_cents)}
                </span>{" "}
                por {selectedOffer.bundle_quantity} tickets
              </p>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Precio unitario:{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {formatEur(ticketPriceCents)}
                </span>{" "}
                por ticket
              </p>
            )}
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total
              </p>
              <p
                className="mt-1 text-5xl font-bold tabular-nums tracking-tight sm:text-6xl"
                aria-live="polite"
              >
                {formatEur(totalCents)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {ticketsCount} {ticketsCount === 1 ? "ticket" : "tickets"}
              </p>
            </div>
          </div>
        </section>

        {/* Boton VENDER */}
        <Button
          size="lg"
          className="h-16 w-full rounded-xl text-2xl font-semibold tracking-wide shadow-sm sm:h-20 sm:text-3xl"
          onClick={handleSell}
          disabled={createSale.isPending}
          aria-label="Registrar venta"
        >
          {createSale.isPending ? "Registrando..." : "VENDER"}
        </Button>

        {/* Ultima venta */}
        {lastSale && (
          <p className="text-center text-sm text-muted-foreground" aria-live="polite">
            Ultima venta: hace {formatRelativeTime(lastSale.at, now).replace("hace ", "")} ·{" "}
            {lastSaleTickets} {lastSaleTickets === 1 ? "ticket" : "tickets"} ·{" "}
            <span className="font-medium text-foreground">
              {formatEur(lastSaleTotalCents)}
            </span>
          </p>
        )}

        {/* Stats pequenas */}
        <p className="text-center text-xs text-muted-foreground">
          {salesQuery.data?.length ?? 0}{" "}
          {(salesQuery.data?.length ?? 0) === 1 ? "venta registrada" : "ventas registradas"}{" "}
          hoy en esta caja
        </p>

        {/* Acciones secundarias */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <Button asChild variant="outline" size="sm">
            <Link to={`/cajas/${session.id}`}>
              <ChevronLeft className="size-3.5" />
              Ver detalle de caja
            </Link>
          </Button>
          <CloseBoxButton onSubmit={handleCloseBox} />
        </div>
      </div>
    </>
  );
}

// ============================================================
// Componentes auxiliares
// ============================================================

function OfferOption({
  id,
  label,
  description,
  checked,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
}) {
  // value de RadioGroupItem: el id real. La opcion "ninguna" usa "__none"
  // para distinguirla de cualquier UUID.
  return (
    <Label
      htmlFor={`offer-${id}`}
      data-checked={checked}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors hover:bg-muted/40 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5",
      )}
    >
      <RadioGroupItem id={`offer-${id}`} value={id} className="mt-0.5" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
    </Label>
  );
}

function CloseBoxButton({
  onSubmit,
}: {
  onSubmit: (values: CloseCashSessionFormValues) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const closeCashSession = useCloseCashSession();
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
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Cerrar caja"
      >
        Cerrar caja
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cerrar caja</DialogTitle>
          <DialogDescription>
            Introduce el importe total declarado al cierre. La caja
            dejara de aceptar ventas y se congelaran los totales.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(async (v) => {
            await onSubmit(v);
          })}
          className="space-y-4"
          noValidate
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="closing_amount_eur"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="tpv-close-amount">
                    Importe declarado (EUR)
                  </FieldLabel>
                  <Input
                    id="tpv-close-amount"
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
              onClick={() => setOpen(false)}
              disabled={closeCashSession.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={closeCashSession.isPending}>
              Cerrar caja
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ClosedSessionView({
  session,
  attraction,
  edition,
  fair,
}: {
  session: { id: string; date: string; closed_at: string | null };
  attraction: { name: string; color: string };
  edition: { year: number };
  fair: { name: string };
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-8">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block size-3 rounded-full"
              style={{ backgroundColor: attraction.color }}
            />
            <span>TPV · {attraction.name}</span>
          </span>
        }
        subtitle={
          <span className="text-sm text-muted-foreground">
            {fair.name} {edition.year} · caja cerrada
          </span>
        }
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link to="/cajas">
              <LogOut className="size-3.5" />
              Salir del TPV
            </Link>
          </Button>
        }
      />

      <div className="rounded-lg border bg-muted/20 p-8 text-center">
        <TicketIcon className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-lg font-semibold">Esta caja esta cerrada</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          No se pueden anadir ventas a una caja cerrada. Si necesitas
          seguir vendiendo hoy, abre una caja nueva desde el listado.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button asChild>
            <Link to={`/cajas/${session.id}`}>Ver detalle de caja</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/cajas/nueva">
              <Plus className="size-4" />
              Abrir nueva caja
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
