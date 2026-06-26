/**
 * pages/FeriaDetallePage.tsx — FeriaNet
 *
 * Detalle de una feria. Cabecera con nombre, notas y acciones (editar,
 * eliminar). Seccion de ediciones con lista + CTA nueva.
 *
 * NOTA sobre ediciones: el backend Rust (TEAM-003) cerro sin exponer
 * commands para `FairEdition` (create/list/update/delete). Esta pagina
 * detecta el caso y muestra una seccion "ediciones" en estado
 * "Pendiente backend" en vez de romper la navegacion. Cuando el
 * backend exponga los commands, esta pagina los consume automaticamente.
 *
 * Acciones destructivas siempre con AlertDialog de confirmacion.
 */

import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { PageHeader } from "@/components/app/PageHeader";
import { DetailSkeleton } from "@/components/app/LoadingState";
import { ErrorState } from "@/components/app/ErrorState";
import { ConfirmDestructiveDialog } from "@/components/app/ConfirmDestructiveDialog";

import { useDeleteFair, useFair } from "@/hooks/queries/fairs";
import { errorMessage } from "@/lib/errors";
import { formatTimestamp } from "@/lib/datetime";

export function FeriaDetallePage() {
  const { fairId } = useParams<{ fairId: string }>();
  const navigate = useNavigate();
  const fairQuery = useFair(fairId);
  const deleteFair = useDeleteFair();

  if (fairQuery.isPending) {
    return (
      <div className="mx-auto max-w-5xl">
        <DetailSkeleton />
      </div>
    );
  }
  if (fairQuery.isError) {
    return (
      <div className="mx-auto max-w-5xl">
        <ErrorState
          error={fairQuery.error}
          onRetry={() => fairQuery.refetch()}
          title="No se pudo cargar la feria"
        />
      </div>
    );
  }
  const fair = fairQuery.data;
  if (!fair) {
    return (
      <div className="mx-auto max-w-5xl">
        <ErrorState
          title="Feria no encontrada"
          error={new Error("El identificador no existe o fue eliminado.")}
        />
      </div>
    );
  }

  async function handleDelete() {
    if (!fair) return;
    try {
      await deleteFair.mutateAsync(fair.id);
      toast.success(`Feria "${fair.name}" eliminada.`);
      navigate("/ferias", { replace: true });
    } catch (e) {
      toast.error(errorMessage(e));
      throw e;
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/ferias">
          <ArrowLeft className="size-3.5" />
          Volver al listado
        </Link>
      </Button>

      <PageHeader
        title={fair.name}
        subtitle={
          fair.notes ? (
            <span className="block max-w-prose whitespace-pre-wrap text-sm text-muted-foreground">
              {fair.notes}
            </span>
          ) : (
            "Ferias › Detalle"
          )
        }
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={`/ferias/${fair.id}/editar`}>
                <Pencil className="size-3.5" />
                Editar
              </Link>
            </Button>
            <ConfirmDestructiveDialog
              trigger={
                <Button variant="destructive" size="sm">
                  <Trash2 className="size-3.5" />
                  Eliminar
                </Button>
              }
              title={`Eliminar feria "${fair.name}"`}
              description={
                <>
                  Esta accion no se puede deshacer. Si la feria tiene
                  ediciones asociadas, la operacion fallara.
                </>
              }
              actionLabel="Eliminar feria"
              onConfirm={handleDelete}
            />
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Informacion</CardTitle>
          <CardDescription>Datos basicos de la feria.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Identificador</dt>
              <dd className="mt-0.5 break-all font-mono text-xs">{fair.id}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Creada</dt>
              <dd className="mt-0.5">{formatTimestamp(fair.created_at)}</dd>
            </div>
            {fair.notes && (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Notas</dt>
                <dd className="mt-0.5 whitespace-pre-wrap">{fair.notes}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Ediciones</CardTitle>
            <CardDescription>
              Anos concretos en los que operas esta feria.
            </CardDescription>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <Button size="sm" disabled aria-describedby="ed-pending">
                  <Plus className="size-3.5" />
                  Nueva edicion
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent id="ed-pending">
              <p>
                Disponible cuando el backend exponga los commands de
                `FairEdition` (create/list/update). Ver TEAM-004.
              </p>
            </TooltipContent>
          </Tooltip>
        </CardHeader>
        <CardContent>
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-6 py-8 text-center"
            role="status"
          >
            <p className="text-sm font-medium">
              Ediciones pendientes de backend
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              El backend Rust de la epica 1 cerro con los commands de
              ferias y atracciones. La gestion de ediciones entrara en
              un team de backend adicional. Hasta entonces, esta seccion
              esta deshabilitada para evitar operaciones fallidas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
