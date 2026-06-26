/**
 * pages/EdicionEditarPage.tsx — FeriaNet
 *
 * Edicion de una edicion de feria. Formulario RHF + Zod pre-rellenado
 * con los datos actuales (`useEdition`). Mismas validaciones que
 * el alta (year entero, fechas ISO 8601, end_date >= start_date,
 * status enum).
 *
 * Regla de negocio "una sola edicion active por feria" (data-model
 * §5.10): si el usuario cambia el estado a `active` y ya hay OTRA
 * edicion activa de la misma feria, se muestra `ActivateEditionDialog`
 * antes de proceder. El dialog ofrece:
 *   - Cancelar: no se hace nada.
 *   - "Cerrar otra y activar esta": cierra la activa actual y luego
 *     aplica la edicion (secuencia no transaccional; ver R1 en
 *     `ActivateEditionDialog`).
 *
 * No-op: si no hay cambios reales respecto al estado cargado, se
 * informa al usuario y se vuelve al detalle sin llamar al backend.
 */

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router";
import { Loader2 } from "lucide-react";
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

import { FormCentered } from "@/components/app/FormCentered";
import { DetailSkeleton } from "@/components/app/LoadingState";
import { ErrorState } from "@/components/app/ErrorState";
import { ActivateEditionDialog } from "@/components/app/ActivateEditionDialog";

import {
  useChangeEditionStatus,
  useEditionsByFair,
  useUpdateEdition,
} from "@/hooks/queries/editions";
import {
  fairEditionFormSchema,
  type FairEditionFormValues,
} from "@/lib/schemas";
import {
  findConflictingActiveEdition,
  formatEditionLabel,
} from "@/lib/editions";
import type { FairEditionStatus } from "@/types/domain";

export function EdicionEditarPage() {
  const { fairId, edicionId } = useParams<{
    fairId: string;
    edicionId: string;
  }>();
  const navigate = useNavigate();
  const editionsQuery = useEditionsByFair(fairId);
  const updateEdition = useUpdateEdition(fairId ?? "");
  const changeStatus = useChangeEditionStatus(fairId ?? "");

  const edition = editionsQuery.data?.find((e) => e.id === edicionId) ?? null;

  const form = useForm<
    z.input<typeof fairEditionFormSchema>,
    unknown,
    z.output<typeof fairEditionFormSchema>
  >({
    resolver: zodResolver(fairEditionFormSchema),
    defaultValues: {
      year: edition?.year ?? new Date().getFullYear(),
      start_date: edition?.start_date ?? "",
      end_date: edition?.end_date ?? "",
      status: (edition?.status ?? "planned") as FairEditionStatus,
    },
    mode: "onTouched",
  });

  // Reset al cargar (evita stale state entre fairs).
  useEffect(() => {
    if (edition) {
      form.reset({
        year: edition.year,
        start_date: edition.start_date,
        end_date: edition.end_date,
        status: edition.status,
      });
    }
  }, [edition, form]);

  // Dialog de conflicto "una sola activa".
  const [conflict, setConflict] = useState<
    | {
        conflictLabel: string;
        conflictId: string;
        targetLabel: string;
        pendingInput: FairEditionFormValues;
      }
    | null
  >(null);
  const [dialogBusy, setDialogBusy] = useState(false);

  if (editionsQuery.isPending) {
    return (
      <div className="mx-auto max-w-xl">
        <DetailSkeleton />
      </div>
    );
  }
  if (editionsQuery.isError) {
    return (
      <div className="mx-auto max-w-xl">
        <ErrorState
          error={editionsQuery.error}
          onRetry={() => editionsQuery.refetch()}
          title="No se pudo cargar la edicion"
        />
      </div>
    );
  }
  if (!edition) {
    return (
      <div className="mx-auto max-w-xl">
        <ErrorState
          title="Edicion no encontrada"
          error={new Error(
            "El identificador no existe o fue eliminado de esta feria.",
          )}
        />
      </div>
    );
  }

  // ----- Handlers -----

  /**
   * Construye el `UpdateFairEditionInput` respetando el contrato de
   * "campo `undefined` -> no tocar" del backend. Si el usuario solo
   * ha cambiado uno o dos campos, omitimos el resto.
   */
  function buildInput(
    values: FairEditionFormValues,
  ): {
    year?: number;
    start_date?: string;
    end_date?: string;
    status?: FairEditionStatus;
  } {
    // El caller ya garantiza `edition != null` (early-return antes).
    const current = edition!;
    const input: {
      year?: number;
      start_date?: string;
      end_date?: string;
      status?: FairEditionStatus;
    } = {};
    if (values.year !== current.year) input.year = values.year;
    if (values.start_date !== current.start_date)
      input.start_date = values.start_date;
    if (values.end_date !== current.end_date)
      input.end_date = values.end_date;
    if (values.status !== current.status) input.status = values.status;
    return input;
  }

  async function performUpdate(values: FairEditionFormValues) {
    if (!edition) return;
    const input = buildInput(values);
    if (Object.keys(input).length === 0) {
      toast.info("Sin cambios.");
      navigate(
        fairId && edicionId
          ? `/ferias/${fairId}/ediciones/${edicionId}`
          : "/ferias",
        { replace: true },
      );
      return;
    }
    await updateEdition.mutateAsync({ id: edition.id, input });
    navigate(
      fairId && edicionId
        ? `/ferias/${fairId}/ediciones/${edicionId}`
        : "/ferias",
      { replace: true },
    );
  }

  async function onSubmit(values: FairEditionFormValues) {
    if (!edition) return;
    // Si el usuario pide `active` y no era activa antes, comprobamos conflicto.
    if (values.status === "active" && edition.status !== "active") {
      const otherActive = findConflictingActiveEdition(
        editionsQuery.data ?? [],
        edition.id,
      );
      if (otherActive) {
        setConflict({
          conflictLabel: formatEditionLabel(otherActive),
          conflictId: otherActive.id,
          targetLabel: formatEditionLabel(edition),
          pendingInput: values,
        });
        return;
      }
    }
    await performUpdate(values);
  }

  async function handleDialogConfirm() {
    if (!conflict || !fairId) return;
    setDialogBusy(true);
    try {
      // Paso 1: cerrar la otra.
      await changeStatus.mutateAsync({
        id: conflict.conflictId,
        status: "closed",
      });
      // Paso 2: aplicar la edicion (con status = 'active').
      await performUpdate(conflict.pendingInput);
      setConflict(null);
    } catch {
      // Los toasts de error los emiten `useChangeEditionStatus` y
      // `useUpdateEdition` en su `onError`. Aqui solo queremos evitar
      // cerrar el dialog si falla la operacion (R1: si la 2ª llamada
      // falla, la otra edicion queda cerrada y esta sin activar).
    } finally {
      setDialogBusy(false);
    }
  }

  return (
    <>
      <FormCentered
        title={`Editar edicion ${edition.year}`}
        description="Modifica el ano, las fechas o el estado de la edicion."
        backTo={
          fairId && edicionId
            ? `/ferias/${fairId}/ediciones/${edicionId}`
            : "/ferias"
        }
        backLabel="Volver al detalle"
      >
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="year"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="ed-edit-year">Ano</FieldLabel>
                  <Input
                    id="ed-edit-year"
                    type="number"
                    inputMode="numeric"
                    step={1}
                    min={1900}
                    max={2100}
                    aria-invalid={fieldState.invalid}
                    {...field}
                    value={
                      Number.isFinite(field.value) ? String(field.value) : ""
                    }
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                  <FieldDescription>
                    Entero entre 1900 y 2100.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="start_date"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="ed-edit-start">
                    Fecha de inicio
                  </FieldLabel>
                  <Input
                    id="ed-edit-start"
                    type="date"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="end_date"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="ed-edit-end">Fecha de fin</FieldLabel>
                  <Input
                    id="ed-edit-end"
                    type="date"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  <FieldDescription>
                    Debe ser igual o posterior a la fecha de inicio.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="status"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="ed-edit-status">Estado</FieldLabel>
                  <select
                    id="ed-edit-status"
                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/40"
                    aria-invalid={fieldState.invalid}
                    value={field.value ?? "planned"}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value as FairEditionFormValues["status"],
                      )
                    }
                  >
                    <option value="planned">Prevista</option>
                    <option value="active">En curso</option>
                    <option value="closed">Cerrada</option>
                  </select>
                  <FieldDescription>
                    Solo una edicion por feria puede estar en curso.
                    Cambiar a "En curso" pedira confirmacion si ya hay
                    otra activa.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button asChild variant="ghost">
              <Link
                to={
                  fairId && edicionId
                    ? `/ferias/${fairId}/ediciones/${edicionId}`
                    : "/ferias"
                }
              >
                Cancelar
              </Link>
            </Button>
            <Button type="submit" disabled={updateEdition.isPending}>
              {updateEdition.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Guardar cambios
            </Button>
          </div>
        </form>
      </FormCentered>

      <ActivateEditionDialog
        open={conflict !== null}
        onOpenChange={(v) => {
          if (!v) setConflict(null);
        }}
        targetLabel={conflict?.targetLabel ?? ""}
        conflictLabel={conflict?.conflictLabel ?? ""}
        onConfirm={handleDialogConfirm}
        busy={dialogBusy}
      />
    </>
  );
}
