/**
 * pages/FeriaNuevaPage.tsx — FeriaNet
 *
 * Pagina de creacion de feria. Render centrada (no Dialog) para que
 * el breadcrumb y el boton "atras" del navegador funcionen, dentro
 * del MainLayout.
 *
 * Funcionalidad:
 *  - Validacion con Zod (mismas reglas que el CHECK del backend).
 *  - Sugerencia por nombre: si el backend devuelve una feria con
 *    nombre equivalente, se muestra un banner claro para evitar
 *    duplicados accidentales (identidad asistida, no automatica).
 *  - Toast de exito y navegacion al detalle al terminar.
 */

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { Info, Loader2 } from "lucide-react";
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

import { FormCentered } from "@/components/app/FormCentered";

import { useCreateFair, useSuggestFairByName } from "@/hooks/queries/fairs";
import { fairFormSchema, type FairFormValues } from "@/lib/schemas";
import { errorMessage } from "@/lib/errors";

// Hook de debounce propio (no añadimos `use-debounce` para evitar
// una dep extra cuando solo lo usamos en un sitio). Esta función
// existe para documentar la intencion; el debounce real está
// inline en el componente con `useState` + `setTimeout` para evitar
// hooks adicionales.

// Textarea simple (no instalamos el componente shadcn porque no
// estaba en la lista del brief; con un `<textarea>` estilado basta).
function TextAreaUsed(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={
        "flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/40 " +
        (props.className ?? "")
      }
    />
  );
}

export function FeriaNuevaPage() {
  const navigate = useNavigate();
  const createFair = useCreateFair();

  const form = useForm<FairFormValues>({
    resolver: zodResolver(fairFormSchema),
    defaultValues: { name: "", notes: "" },
    mode: "onTouched",
  });

  const nameValue = form.watch("name");
  const [debouncedName, setDebouncedName] = useState(nameValue);
  // Debounce manual para evitar instalar otra dep.
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedName(nameValue), 300);
    return () => window.clearTimeout(t);
  }, [nameValue]);

  const suggestQuery = useSuggestFairByName(debouncedName, !createFair.isPending);

  async function onSubmit(values: FairFormValues) {
    try {
      const fair = await createFair.mutateAsync({
        name: values.name.trim(),
        notes: values.notes && values.notes.trim() !== "" ? values.notes.trim() : null,
      });
      toast.success(`Feria "${fair.name}" creada.`);
      navigate(`/ferias/${fair.id}`, { replace: true });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  const suggestion = suggestQuery.data;

  return (
    <FormCentered
      title="Nueva feria"
      description="Registra una feria generica. Las ediciones anuales se daran de alta despues."
      backTo="/ferias"
      backLabel="Volver al listado"
    >
      {suggestion && (
        <div className="mb-5 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-sm">
          <Info
            className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              Ya existe una feria con un nombre equivalente.
            </p>
            <p className="text-muted-foreground">
              <span className="font-mono">{suggestion.name}</span> · creada el{" "}
              {new Date(suggestion.created_at).toLocaleDateString("es-ES")}.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to={`/ferias/${suggestion.id}`}>Ir a esa feria</Link>
          </Button>
        </div>
      )}

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
                <FieldLabel htmlFor="fair-name">Nombre</FieldLabel>
                <Input
                  id="fair-name"
                  placeholder="Ej. Feria de Cadiz"
                  autoComplete="off"
                  maxLength={120}
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
                <FieldDescription>
                  Maximo 120 caracteres. La comparativa interanual se
                  asistira al dar de alta ediciones con este nombre.
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
                <FieldLabel htmlFor="fair-notes">Notas (opcional)</FieldLabel>
                <TextAreaUsed
                  id="fair-notes"
                  placeholder="Observaciones internas sobre la feria."
                  maxLength={500}
                  aria-invalid={fieldState.invalid}
                  {...field}
                  value={field.value ?? ""}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button asChild variant="ghost">
            <Link to="/ferias">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={createFair.isPending}>
            {createFair.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Crear feria
          </Button>
        </div>
      </form>
    </FormCentered>
  );
}
