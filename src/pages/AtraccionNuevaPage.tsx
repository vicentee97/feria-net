/**
 * pages/AtraccionNuevaPage.tsx — FeriaNet
 *
 * Creacion de atraccion dentro de una edicion de feria. Render como
 * pagina centrada (no Dialog) para mantener breadcrumb y boton
 * "atras" del navegador.
 *
 * Conversion EUR -> centimos:
 *  - El usuario introduce precio en EUR (decimal con 2 decimales).
 *  - En el submit convertimos a centimos (entero) antes de enviar al
 *    backend, que almacena INTEGER.
 *  - El campo activo usa `attractionFormSchema` (Zod) con
 *    `base_ticket_price_eur` en EUR.
 */

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

import { useCreateAttraction } from "@/hooks/queries/attractions";
import { attractionFormSchema, type AttractionFormValues } from "@/lib/schemas";
import { eurToCents } from "@/lib/money";
import { errorMessage } from "@/lib/errors";

export function AtraccionNuevaPage() {
  const { fairId, edicionId } = useParams<{
    fairId: string;
    edicionId: string;
  }>();
  const navigate = useNavigate();
  const createAttraction = useCreateAttraction();

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

  async function onSubmit(values: AttractionFormValues) {
    if (!edicionId) return;
    let cents: number;
    try {
      const c = eurToCents(values.base_ticket_price_eur);
      if (c === null) {
        toast.error("Precio invalido.");
        return;
      }
      cents = c;
    } catch (e) {
      toast.error(errorMessage(e));
      return;
    }
    try {
      const attr = await createAttraction.mutateAsync({
        fair_edition_id: edicionId,
        name: values.name.trim(),
        color: values.color.toUpperCase(),
        base_ticket_price: cents,
      });
      toast.success(`Atraccion "${attr.name}" creada.`);
      navigate(`/ferias/${fairId}/ediciones/${edicionId}`, { replace: true });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <FormCentered
      title="Nueva atraccion"
      description="Configura una atraccion para esta edicion de feria."
      backTo={fairId && edicionId ? `/ferias/${fairId}/ediciones/${edicionId}` : "/ferias"}
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
                <FieldLabel htmlFor="attr-name">Nombre</FieldLabel>
                <Input
                  id="attr-name"
                  placeholder="Ej. Noria"
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
                  description="Hex #RRGGBB. Se usa en el ticket y en el listado."
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
                <FieldLabel htmlFor="attr-price">
                  Precio base del ticket (EUR)
                </FieldLabel>
                <Input
                  id="attr-price"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  max={999999.99}
                  placeholder="3.00"
                  aria-invalid={fieldState.invalid}
                  {...field}
                  value={
                    Number.isFinite(field.value) ? String(field.value) : ""
                  }
                  onChange={(e) => field.onChange(e.target.value)}
                />
                <FieldDescription>
                  Precio en euros con 2 decimales. Se almacena como
                  centimos en BD.
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
          <Button type="submit" disabled={createAttraction.isPending}>
            {createAttraction.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Crear atraccion
          </Button>
        </div>
      </form>
    </FormCentered>
  );
}
