/**
 * pages/FeriaEditarPage.tsx — FeriaNet
 *
 * Edicion de una feria existente. Pagina completa (no modal) para
 * dejar sitio si en el futuro hay mas campos.
 *
 * Reglas del contrato `UpdateFairInput.notes` (doble Option):
 *  - `undefined` -> no tocar.
 *  - `null`       -> poner a NULL (borrar notas).
 *  - string       -> actualizar.
 *
 * La transformacion de `""` a `null` se hace en el submit. El backend
 * recibe `notes: null` -> borra; `notes: "..."` -> actualiza. Si el
 * usuario solo cambia `name`, el campo `notes` se envia como
 * `undefined` (omitido en JSON) -> no se toca.
 */

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { FormCentered } from "@/components/app/FormCentered";
import { DetailSkeleton } from "@/components/app/LoadingState";
import { ErrorState } from "@/components/app/ErrorState";

import { useFair, useUpdateFair } from "@/hooks/queries/fairs";
import { updateFairSchema, type UpdateFairValues } from "@/lib/schemas";

export function FeriaEditarPage() {
  const { fairId } = useParams<{ fairId: string }>();
  const navigate = useNavigate();
  const fairQuery = useFair(fairId);
  const updateFair = useUpdateFair();

  const form = useForm<UpdateFairValues>({
    resolver: zodResolver(updateFairSchema),
    defaultValues: { name: "", notes: "" },
    mode: "onTouched",
  });

  // Reset al cargar el fair (evita valores stale entre fairs).
  useEffect(() => {
    if (fairQuery.data) {
      form.reset({
        name: fairQuery.data.name,
        notes: fairQuery.data.notes ?? "",
      });
    }
  }, [fairQuery.data, form]);

  async function onSubmit(values: UpdateFairValues) {
    if (!fairId) return;
    // Construimos el input respetando el contrato doble Option.
    const original = fairQuery.data;
    const input: { name?: string; notes?: string | null } = {};

    const trimmedName = values.name?.trim();
    if (trimmedName && original && trimmedName !== original.name) {
      input.name = trimmedName;
    }

    if ("notes" in values) {
      const raw = values.notes;
      const trimmed =
        typeof raw === "string" ? raw.trim() : raw;
      const next = trimmed === "" ? null : trimmed;
      const current = original?.notes ?? null;
      if (next !== current) {
        input.notes = next as string | null;
      }
    }

    if (Object.keys(input).length === 0) {
      toast.info("Sin cambios.");
      navigate(`/ferias/${fairId}`, { replace: true });
      return;
    }

    await updateFair.mutateAsync({ id: fairId, input });
    toast.success("Feria actualizada.");
    navigate(`/ferias/${fairId}`, { replace: true });
  }

  if (fairQuery.isPending) {
    return (
      <div className="mx-auto max-w-xl">
        <DetailSkeleton />
      </div>
    );
  }
  if (fairQuery.isError) {
    return (
      <div className="mx-auto max-w-xl">
        <ErrorState
          error={fairQuery.error}
          onRetry={() => fairQuery.refetch()}
          title="No se pudo cargar la feria"
        />
      </div>
    );
  }
  if (!fairQuery.data) {
    return (
      <div className="mx-auto max-w-xl">
        <ErrorState
          title="Feria no encontrada"
          error={new Error("El identificador no existe o fue eliminado.")}
        />
      </div>
    );
  }

  return (
    <FormCentered
      title={`Editar "${fairQuery.data.name}"`}
      description="Modifica el nombre o las notas. Deja las notas vacias para borrarlas."
      backTo={`/ferias/${fairId}`}
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
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="fair-edit-name">Nombre</FieldLabel>
                <Input
                  id="fair-edit-name"
                  maxLength={120}
                  autoComplete="off"
                  aria-invalid={fieldState.invalid}
                  {...field}
                  value={field.value ?? ""}
                />
                <FieldDescription>
                  Maximo 120 caracteres.
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="notes"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="fair-edit-notes">Notas</FieldLabel>
                <Textarea
                  id="fair-edit-notes"
                  maxLength={500}
                  aria-invalid={fieldState.invalid}
                  {...field}
                  value={(field.value as string | null | undefined) ?? ""}
                />
                <FieldDescription>
                  Vacio = borrar notas. Maximo 500 caracteres.
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
            <Link to={`/ferias/${fairId}`}>Cancelar</Link>
          </Button>
          <Button type="submit" disabled={updateFair.isPending}>
            {updateFair.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Guardar cambios
          </Button>
        </div>
      </form>
    </FormCentered>
  );
}
