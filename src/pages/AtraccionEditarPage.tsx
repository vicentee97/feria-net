/**
 * pages/AtraccionEditarPage.tsx — FeriaNet
 *
 * Edicion de atraccion. Carga la lista de atracciones de la edicion
 * y permite editar una en concreto.
 *
 * Si la edicion no expone `list_attractions_by_edition`, esto falla
 * con un ErrorState claro.
 */

import { useEffect } from "react";
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
import { ColorPicker } from "@/components/app/ColorPicker";
import { DetailSkeleton } from "@/components/app/LoadingState";
import { ErrorState } from "@/components/app/ErrorState";

import {
  useAttractionsByEdition,
  useUpdateAttraction,
} from "@/hooks/queries/attractions";
import { attractionFormSchema, type AttractionFormValues } from "@/lib/schemas";
import { centsToEur, eurToCents } from "@/lib/money";

export function AtraccionEditarPage() {
  const { fairId, edicionId, atraccionId } = useParams<{
    fairId: string;
    edicionId: string;
    atraccionId: string;
  }>();
  const navigate = useNavigate();
  const attractionsQuery = useAttractionsByEdition(edicionId);
  const updateAttraction = useUpdateAttraction();

  const attraction = attractionsQuery.data?.find((a) => a.id === atraccionId);

  const form = useForm<
    z.input<typeof attractionFormSchema>,
    unknown,
    z.output<typeof attractionFormSchema>
  >({
    resolver: zodResolver(attractionFormSchema),
    defaultValues: {
      name: "",
      color: "#FF6B6B",
      base_ticket_price_eur: 0,
      is_active: true,
    },
    mode: "onTouched",
  });

  useEffect(() => {
    if (attraction) {
      form.reset({
        name: attraction.name,
        color: attraction.color,
        base_ticket_price_eur: centsToEur(attraction.base_ticket_price),
        is_active: attraction.is_active,
      });
    }
  }, [attraction, form]);

  async function onSubmit(values: AttractionFormValues) {
    if (!atraccionId) return;
    const cents = eurToCents(values.base_ticket_price_eur);
    if (cents === null) {
      toast.error("Precio invalido.");
      return;
    }
    await updateAttraction.mutateAsync({
      id: atraccionId,
      input: {
        name: values.name.trim(),
        color: values.color.toUpperCase(),
        base_ticket_price: cents,
      },
    });
    toast.success("Atraccion actualizada.");
    navigate(
      fairId && edicionId
        ? `/ferias/${fairId}/ediciones/${edicionId}`
        : "/ferias",
      { replace: true },
    );
  }

  if (attractionsQuery.isPending) {
    return (
      <div className="mx-auto max-w-xl">
        <DetailSkeleton />
      </div>
    );
  }
  if (attractionsQuery.isError) {
    return (
      <div className="mx-auto max-w-xl">
        <ErrorState
          error={attractionsQuery.error}
          onRetry={() => attractionsQuery.refetch()}
          title="No se pudieron cargar las atracciones"
        />
      </div>
    );
  }
  if (!attraction) {
    return (
      <div className="mx-auto max-w-xl">
        <ErrorState
          title="Atraccion no encontrada"
          error={new Error(
            "El identificador no existe, fue eliminado o no pertenece a esta edicion.",
          )}
        />
      </div>
    );
  }

  return (
    <FormCentered
      title={`Editar "${attraction.name}"`}
      description="Modifica los datos identificativos de la atraccion."
      backTo={
        fairId && edicionId
          ? `/ferias/${fairId}/ediciones/${edicionId}`
          : "/ferias"
      }
      backLabel="Volver a la edicion"
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
        noValidate
      >
        <FieldGroup>
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="attr-edit-name">Nombre</FieldLabel>
                <Input
                  id="attr-edit-name"
                  maxLength={80}
                  autoComplete="off"
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
                <FieldDescription>Maximo 80 caracteres.</FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="color"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <ColorPicker
                  label="Color identificativo"
                  description="Hex #RRGGBB."
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="base_ticket_price_eur"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="attr-edit-price">
                  Precio base del ticket (EUR)
                </FieldLabel>
                <Input
                  id="attr-edit-price"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  max={999999.99}
                  aria-invalid={fieldState.invalid}
                  {...field}
                  value={
                    Number.isFinite(field.value) ? String(field.value) : ""
                  }
                  onChange={(e) => field.onChange(e.target.value)}
                />
                <FieldDescription>
                  Precio en euros con 2 decimales.
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
          <Button type="submit" disabled={updateAttraction.isPending}>
            {updateAttraction.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Guardar cambios
          </Button>
        </div>
      </form>
    </FormCentered>
  );
}
