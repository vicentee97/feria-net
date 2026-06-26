/**
 * pages/FeriaDetallePage.tsx — FeriaNet
 *
 * Detalle de una feria. Cabecera con nombre, notas y acciones (editar,
 * eliminar). Seccion de ediciones con lista real + CTA nueva.
 *
 * Para el conteo de atracciones por edicion, se compone `useQueries`
 * con `list_attractions_by_edition` por cada edicion visible. Esto
 * aprovecha commands ya existentes; si en el futuro el backend expone
 * un command `count_attractions_by_edition` se puede sustituir sin
 * tocar la UI. Para ferias con 1-3 ediciones y pocas atracciones por
 * edicion, el coste es despreciable. Documentado como R2 en TEAM-006.
 *
 * Acciones destructivas siempre con AlertDialog de confirmacion.
 */

import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { useQueries } from "@tanstack/react-query";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import { PageHeader } from "@/components/app/PageHeader";
import { DetailSkeleton, ListSkeleton } from "@/components/app/LoadingState";
import { EmptyState } from "@/components/app/EmptyState";
import { ErrorState } from "@/components/app/ErrorState";
import { StatusBadge } from "@/components/app/StatusBadge";
import { ConfirmDestructiveDialog } from "@/components/app/ConfirmDestructiveDialog";

import { useDeleteFair, useFair } from "@/hooks/queries/fairs";
import { useEditionsByFair, editionKeys } from "@/hooks/queries/editions";
import { listAttractionsByEdition } from "@/api/tauri";
import { formatTimestamp, formatDateRange } from "@/lib/datetime";
import { errorMessage } from "@/lib/errors";

export function FeriaDetallePage() {
  const { fairId } = useParams<{ fairId: string }>();
  const navigate = useNavigate();
  const fairQuery = useFair(fairId);
  const deleteFair = useDeleteFair();
  const editionsQuery = useEditionsByFair(fairId);

  // Conteo de atracciones por edicion. Cargamos en paralelo una query
  // por edicion; suficiente para 1-3 ediciones por feria (caso tipico).
  // Ver R2 en TEAM-006.
  const attractionCountQueries = useQueries({
    queries: (editionsQuery.data ?? []).map((ed) => ({
      queryKey: ["attractions", ed.id, "count"],
      queryFn: () => listAttractionsByEdition(ed.id),
      enabled: Boolean(editionsQuery.data),
      staleTime: 30 * 1000,
    })),
  });

  const attractionCounts = useMemo(() => {
    const map = new Map<string, number>();
    editionsQuery.data?.forEach((ed, i) => {
      const q = attractionCountQueries[i];
      if (q?.data) {
        map.set(ed.id, q.data.length);
      }
    });
    return map;
  }, [editionsQuery.data, attractionCountQueries]);

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
    try {
      await deleteFair.mutateAsync(fair!.id);
      toast.success(`Feria "${fair!.name}" eliminada.`);
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
          <Button asChild size="sm">
            <Link to={`/ferias/${fair.id}/ediciones/nueva`}>
              <Plus className="size-3.5" />
              Nueva edicion
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {editionsQuery.isPending && <ListSkeleton rows={3} />}
          {editionsQuery.isError && (
            <ErrorState
              error={editionsQuery.error}
              onRetry={() => editionsQuery.refetch()}
              title="No se pudieron cargar las ediciones"
            />
          )}
          {editionsQuery.isSuccess &&
            editionsQuery.data.length === 0 && (
              <EmptyState
                icon={<Plus className="size-5" />}
                title="Aun no tienes ediciones"
                description="Crea la primera edicion para empezar a configurar atracciones."
                action={
                  <Button asChild>
                    <Link to={`/ferias/${fair.id}/ediciones/nueva`}>
                      <Plus className="size-4" />
                      Crear primera edicion
                    </Link>
                  </Button>
                }
              />
            )}
          {editionsQuery.isSuccess &&
            editionsQuery.data.length > 0 && (
              <div className="rounded-md border bg-background">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ano</TableHead>
                      <TableHead className="hidden w-44 sm:table-cell">
                        Fechas
                      </TableHead>
                      <TableHead className="hidden w-24 sm:table-cell">
                        Estado
                      </TableHead>
                      <TableHead className="hidden w-28 text-right sm:table-cell">
                        Atracciones
                      </TableHead>
                      <TableHead className="w-12 text-right">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editionsQuery.data.map((edition) => (
                      <TableRow key={edition.id}>
                        <TableCell className="font-medium">
                          <Link
                            to={`/ferias/${fair.id}/ediciones/${edition.id}`}
                            className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                          >
                            Edicion {edition.year}
                          </Link>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                          {formatDateRange(
                            edition.start_date,
                            edition.end_date,
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <StatusBadge status={edition.status} />
                        </TableCell>
                        <TableCell className="hidden text-right text-muted-foreground sm:table-cell">
                          <EditionAttractionCount
                            count={attractionCounts.get(edition.id)}
                            loading={
                              attractionCountQueries[
                                editionsQuery.data.indexOf(edition)
                              ]?.isPending
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <EditionRowActions
                            editionId={edition.id}
                            editionYear={edition.year}
                            fairId={fair.id}
                          />
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
  );
}

// ============================================================
// Subcomponentes
// ============================================================

function EditionRowActions({
  editionId,
  editionYear,
  fairId,
}: {
  editionId: string;
  editionYear: number;
  fairId: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Acciones para edicion ${editionYear}`}
        >
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link to={`/ferias/${fairId}/ediciones/${editionId}`}>
            Ver detalle
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={`/ferias/${fairId}/ediciones/${editionId}/editar`}>
            <Pencil className="size-3.5" />
            Editar
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={`/ferias/${fairId}/ediciones/${editionId}/atracciones/nueva`}>
            <Plus className="size-3.5" />
            Nueva atraccion
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EditionAttractionCount({
  count,
  loading,
}: {
  count: number | undefined;
  loading: boolean | undefined;
}) {
  if (loading || count === undefined) {
    return <Skeleton className="ml-auto h-4 w-8" />;
  }
  return <span>{count}</span>;
}

// Suprimimos el warning de unused si llegara a no usarse en una refactor.
void editionKeys;
