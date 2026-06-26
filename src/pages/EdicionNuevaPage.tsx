/**
 * pages/EdicionNuevaPage.tsx — FeriaNet
 *
 * Alta de una nueva edicion de feria. Render como pagina centrada
 * (no Dialog) para que el breadcrumb y el boton "atras" del navegador
 * funcionen, dentro del MainLayout.
 *
 * Formulario RHF + Zod usando `fairEditionFormSchema` (validacion
 * cliente: year entero 1900-2100, fechas ISO 8601 YYYY-MM-DD,
 * `end_date >= start_date`, status enum).
 *
 * Regla de negocio "una sola edicion active por feria"
 * (data-model §5.10): el backend NO enforcea. Si el usuario selecciona
 * `status = 'active'` en el alta y ya hay otra edicion activa de la
 * misma feria (visible en `useEditionsByFair`), se muestra un
 * `ActivateEditionDialog` antes de proceder. El dialog ofrece:
 *   - Cancelar: no se hace nada.
 *   - "Cerrar otra y activar esta": cierra la activa actual y luego
 *     crea la nueva como `active` (secuencia no transaccional; ver
 *     R1 en `ActivateEditionDialog`).
 */

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router";
import { Loader2 } from "lucide-react";
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
import { ActivateEditionDialog } from "@/components/app/ActivateEditionDialog";

import {
  useChangeEditionStatus,
  useCreateEdition,
  useEditionsByFair,
} from "@/hooks/queries/editions";
import {
  fairEditionFormSchema,
  type FairEditionFormValues,
} from "@/lib/schemas";
import {
  findConflictingActiveEdition,
  formatEditionLabel,
} from "@/lib/editions";
import { todayLocalISO } from "@/lib/datetime";

export function EdicionNuevaPage() {
  const { fairId } = useParams<{ fairId: string }>();
  const navigate = useNavigate();
  const editionsQuery = useEditionsByFair(fairId);
  const createEdition = useCreateEdition(fairId ?? "");
  const changeStatus = useChangeEditionStatus(fairId ?? "");

  const today = todayLocalISO();
  const [yearDefault] = (() => {
    const y = new Date().getFullYear();
    return [y];
  })();
  // Default: ano actual, fechas razonables (hoy / +7dias), status planned.
  const form = useForm<
    z.input<typeof fairEditionFormSchema>,
    unknown,
    z.output<typeof fairEditionFormSchema>
  >({
    resolver: zodResolver(fairEditionFormSchema),
    defaultValues: {
      year: yearDefault,
      start_date: today,
      end_date: addDays(today, 7),
      status: "planned",
    },
    mode: "onTouched",
  });

  const statusValue = form.watch("status");

  // Dialog de conflicto "una sola activa".
  const [conflict, setConflict] = useState<
    | {
        conflictLabel: string;
        conflictId: string;
        targetLabel: string;
        // Input que se quiere crear si el usuario confirma el dialog.
        pendingInput: FairEditionFormValues;
      }
    | null
  >(null);
  const [dialogBusy, setDialogBusy] = useState(false);

  async function performCreate(input: FairEditionFormValues) {
    if (!fairId) return;
    const edition = await createEdition.mutateAsync(input);
    navigate(`/ferias/${fairId}/ediciones/${edition.id}`, { replace: true });
  }

  async function onSubmit(values: FairEditionFormValues) {
    if (!fairId) return;

    // Si el usuario pide `active`, comprobamos si ya hay otra activa.
    if (values.status === "active") {
      const existing = editionsQuery.data ?? [];
      const otherActive = findConflictingActiveEdition(existing, "__new__");
      if (otherActive) {
        setConflict({
          conflictLabel: formatEditionLabel(otherActive),
          conflictId: otherActive.id,
          targetLabel: `Edicion ${values.year}`,
          pendingInput: values,
        });
        return;
      }
    }

    await performCreate(values);
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
      // Paso 2: crear la nueva como activa.
      // Importante: usar el input tal como esta (status = 'active').
      await performCreate(conflict.pendingInput);
      // El dialog se cierra solo si la creacion navega (success).
      setConflict(null);
    } catch {
      // Los toasts de error los emiten `useChangeEditionStatus` y
      // `useCreateEdition` en su `onError`. Aqui solo queremos evitar
      // cerrar el dialog si falla la operacion; el operador puede
      // reintentar desde el detalle (R1: si la 2ª llamada falla, la
      // otra edicion queda cerrada y esta sin activar).
    } finally {
      setDialogBusy(false);
    }
  }

  return (
    <>
      <FormCentered
        title="Nueva edicion"
        description="Registra una instancia anual concreta de esta feria."
        backTo={fairId ? `/ferias/${fairId}` : "/ferias"}
        backLabel="Volver a la feria"
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
                  <FieldLabel htmlFor="ed-year">Ano</FieldLabel>
                  <Input
                    id="ed-year"
                    type="number"
                    inputMode="numeric"
                    step={1}
                    min={1900}
                    max={2100}
                    placeholder="2026"
                    aria-invalid={fieldState.invalid}
                    {...field}
                    value={
                      Number.isFinite(field.value) ? String(field.value) : ""
                    }
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                  <FieldDescription>
                    Entero entre 1900 y 2100. Unico por feria.
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
                  <FieldLabel htmlFor="ed-start">Fecha de inicio</FieldLabel>
                  <Input
                    id="ed-start"
                    type="date"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  <FieldDescription>
                    Primer dia operativo (formato YYYY-MM-DD).
                  </FieldDescription>
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
                  <FieldLabel htmlFor="ed-end">Fecha de fin</FieldLabel>
                  <Input
                    id="ed-end"
                    type="date"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  <FieldDescription>
                    Ultimo dia operativo. Debe ser igual o posterior a la fecha de inicio.
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
                  <FieldLabel htmlFor="ed-status">Estado inicial</FieldLabel>
                  <select
                    id="ed-status"
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
                    Por defecto, prevista. Solo una edicion por feria puede
                    estar en curso.
                    {statusValue === "active" && (
                      <span className="mt-1 block text-amber-700 dark:text-amber-300">
                        Si ya hay otra edicion activa, el alta pedira
                        confirmacion para cerrar la anterior.
                      </span>
                    )}
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
              <Link to={fairId ? `/ferias/${fairId}` : "/ferias"}>
                Cancelar
              </Link>
            </Button>
            <Button type="submit" disabled={createEdition.isPending}>
              {createEdition.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Crear edicion
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
        extraNote={
          conflict?.pendingInput.year ? (
            <>
              Ano a crear: <strong>{conflict.pendingInput.year}</strong>.
              La operacion cierra la edicion activa actual y crea la nueva
              en curso en dos pasos (no transaccional).
            </>
          ) : undefined
        }
      />
    </>
  );
}

/**
 * Devuelve `YYYY-MM-DD` con `n` dias sumados. Sin dependencias externas
 * (mantener coherencia con el resto del proyecto que evita deps innecesarias).
 */
function addDays(yyyymmdd: string, n: number): string {
  const [y, m, d] = yyyymmdd.split("-").map(Number);
  if (!y || !m || !d) return yyyymmdd;
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
