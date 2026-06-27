/**
 * pages/AbrirCajaPage.tsx — FeriaNet
 *
 * Formulario para abrir una caja nueva. Solo permite seleccionar
 * atracciones de ediciones `active` (regla operativa: solo se vende
 * en ediciones en curso). Si no hay atracciones activas, empty state
 * con CTA para crear el setup necesario.
 *
 * Decisiones de diseno:
 *  - La seleccion de atraccion se gestiona con `useState` (no a traves
 *    de Zod) porque la lista de opciones deriva del fan-out de
 *    React Query y no del input del usuario. Zod valida solo `date`
 *    y `opening_amount_eur`. El submit valida manualmente que
 *    `attraction_id` este presente.
 *  - El fan-out de atracciones activas reusa `useAllCashSessionsWithContext`
 *    (ya implementado) para mantener la consistencia con el resto del
 *    modulo. Es un poco overkill para solo listar opciones, pero evita
 *    logica duplicada y mantiene una sola fuente de verdad para la
 *    nocion de "atraccion activa".
 *
 * Flujo de exito:
 *  1. Validacion Zod (fecha + fondo).
 *  2. Conversion EUR -> centimos en submit (boundary canonica).
 *  3. `useOpenCashSession` (el hook emite el toast de error si falla).
 *  4. Toast verde contextual con el nombre de la atraccion.
 *  5. Navegacion a `/tpv?session=:id` para empezar a vender.
 */

import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { Loader2, Plus, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FormCentered } from "@/components/app/FormCentered";
import { ColorChip } from "@/components/app/ColorChip";

import { useAllCashSessionsWithContext, useOpenCashSession } from "@/hooks/queries/cash_sessions";
import { openCashSessionFormSchema, type OpenCashSessionFormValues } from "@/lib/schemas";
import { eurToCents } from "@/lib/money";
import { todayLocalISO } from "@/lib/datetime";

export function AbrirCajaPage() {
  const navigate = useNavigate();
  const openCashSession = useOpenCashSession();
  const ctx = useAllCashSessionsWithContext();

  // Solo atracciones activas (no soft-deleted) en ediciones activas.
  const activeAttractions = useMemo(() => {
    return Object.values(ctx.attractionById)
      .filter((a) => {
        if (!a.is_active) return false;
        const ed = ctx.editionByAttractionId[a.id];
        return ed?.status === "active";
      })
      .map((a) => {
        const ed = ctx.editionByAttractionId[a.id]!;
        const fair = ctx.fairByEditionId[ed.id];
        return {
          id: a.id,
          name: a.name,
          color: a.color,
          editionYear: ed.year,
          fairName: fair?.name ?? "?",
        };
      })
      .sort((x, y) => {
        const c = x.fairName.localeCompare(y.fairName);
        if (c !== 0) return c;
        const c2 = x.editionYear - y.editionYear;
        if (c2 !== 0) return c2;
        return x.name.localeCompare(y.name);
      });
  }, [ctx.attractionById, ctx.editionByAttractionId, ctx.fairByEditionId]);

  // Seleccion de atraccion via state local (no via Zod).
  const [attractionId, setAttractionId] = useState<string>("");
  const selectedAttraction = activeAttractions.find((a) => a.id === attractionId);

  const form = useForm<
    z.input<typeof openCashSessionFormSchema>,
    unknown,
    z.output<typeof openCashSessionFormSchema>
  >({
    resolver: zodResolver(openCashSessionFormSchema),
    defaultValues: {
      date: todayLocalISO(),
      opening_amount_eur: 0,
    },
    mode: "onTouched",
  });

  async function onSubmit(values: OpenCashSessionFormValues) {
    if (!attractionId) {
      toast.error("Selecciona una atraccion antes de abrir la caja.");
      return;
    }
    const cents = eurToCents(values.opening_amount_eur);
    if (cents === null) {
      toast.error("Fondo inicial invalido.");
      return;
    }
    const session = await openCashSession.mutateAsync({
      attraction_id: attractionId,
      date: values.date,
      opening_amount_cents: cents,
    });
    const attrName =
      activeAttractions.find((a) => a.id === attractionId)?.name ??
      "la atraccion";
    toast.success(`Caja abierta para ${attrName}.`);
    navigate(`/tpv?session=${session.id}`, { replace: true });
  }

  // Loading: el fan-out todavia no ha llegado.
  if (ctx.isPending) {
    return (
      <div className="mx-auto w-full max-w-xl">
        <FormCentered
          title="Abrir caja"
          description="Cargando atracciones disponibles..."
          backTo="/cajas"
          backLabel="Volver a cajas"
        >
          <div className="h-40 animate-pulse rounded-md bg-muted/40" />
        </FormCentered>
      </div>
    );
  }

  // Empty state: no hay ferias o no hay atracciones activas.
  if (activeAttractions.length === 0) {
    return (
      <div className="mx-auto w-full max-w-xl">
        <FormCentered
          title="Abrir caja"
          description="Empieza el dia abriendo una caja para vender tickets."
          backTo="/cajas"
          backLabel="Volver a cajas"
        >
          <EmptyAttractionsHint />
        </FormCentered>
      </div>
    );
  }

  return (
    <FormCentered
      title="Abrir caja"
      description="Empieza el dia abriendo una caja para vender tickets."
      backTo="/cajas"
      backLabel="Volver a cajas"
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
        noValidate
      >
        <FieldGroup>
          {/* Atraccion */}
          <Field>
            <FieldLabel htmlFor="cash-attraction">Atraccion</FieldLabel>
            <Select value={attractionId} onValueChange={setAttractionId}>
              <SelectTrigger
                id="cash-attraction"
                className="w-full"
              >
                <SelectValue placeholder="Selecciona atraccion..." />
              </SelectTrigger>
              <SelectContent>
                {activeAttractions.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    <span className="flex items-center gap-2">
                      <ColorChip color={a.color} />
                      <span>
                        {a.name}{" "}
                        <span className="text-muted-foreground">
                          ({a.fairName} {a.editionYear})
                        </span>
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              Solo se muestran atracciones de ediciones activas.
            </FieldDescription>
          </Field>

          {/* Fecha */}
          <Controller
            control={form.control}
            name="date"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="cash-date">Fecha</FieldLabel>
                <Input
                  id="cash-date"
                  type="date"
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
                <FieldDescription>
                  Por defecto, hoy (fecha local del operador).
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {/* Fondo inicial */}
          <Controller
            control={form.control}
            name="opening_amount_eur"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="cash-opening">
                  Fondo inicial (EUR)
                </FieldLabel>
                <Input
                  id="cash-opening"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  max={999999.99}
                  placeholder="0.00"
                  aria-invalid={fieldState.invalid}
                  {...field}
                  value={
                    Number.isFinite(field.value) ? String(field.value) : ""
                  }
                  onChange={(e) => field.onChange(e.target.value)}
                />
                <FieldDescription>
                  Efectivo en caja al abrir. Normalmente 0. Se almacena
                  como centimos en BD.
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {selectedAttraction && (
            <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
              Vas a abrir caja para{" "}
              <strong className="text-foreground">
                {selectedAttraction.name}
              </strong>{" "}
              ({selectedAttraction.fairName} {selectedAttraction.editionYear}).
              Tras confirmar, se abrira el TPV para empezar a vender.
            </div>
          )}
        </FieldGroup>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button asChild variant="ghost">
            <Link to="/cajas">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={openCashSession.isPending}>
            {openCashSession.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Abrir caja
          </Button>
        </div>
      </form>
    </FormCentered>
  );
}

function EmptyAttractionsHint() {
  return (
    <div className="rounded-lg border border-dashed bg-background/60 p-5 text-center text-sm">
      <ReceiptText className="mx-auto mb-2 size-5 text-muted-foreground" />
      <p className="font-medium">No hay atracciones activas</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Para abrir una caja necesitas una atraccion dentro de una edicion
        de feria en estado <em>En curso</em>. Crea primero la feria, la
        edicion y la atraccion.
      </p>
      <Button asChild className="mt-4" size="sm">
        <Link to="/ferias">
          <Plus className="size-4" />
          Ir a ferias
        </Link>
      </Button>
    </div>
  );
}
