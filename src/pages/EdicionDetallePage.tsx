/**
 * pages/EdicionDetallePage.tsx — FeriaNet
 *
 * Detalle de una edicion de feria. Estructura:
 *  - Cabecera: ano + rango de fechas + StatusBadge. Acciones: editar,
 *    cambiar estado (DropdownMenu), eliminar (AlertDialog).
 *  - Tarjeta "Informacion": datos basicos.
 *  - Tarjeta "Atracciones": listado o empty state con CTA "Nueva atraccion".
 *
 * Regla de negocio "una sola edicion active por feria" (data-model
 * §5.10): el backend NO enforcea. Si al cambiar el estado a `active`
 * ya hay otra edicion activa de la misma feria, se muestra el
 * `ActivateEditionDialog` antes de proceder.
 *
 * Para la lista de atracciones se reutiliza `useAttractionsByEdition`
 * (filtra ya las inactivas en backend via `is_active = 1`).
 */

import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router";
import {
  ChevronDown,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
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
  DropdownMenuLabel,
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

import { PageHeader } from "@/components/app/PageHeader";
import { DetailSkeleton, ListSkeleton } from "@/components/app/LoadingState";
import { EmptyState } from "@/components/app/EmptyState";
import { ErrorState } from "@/components/app/ErrorState";
import { StatusBadge } from "@/components/app/StatusBadge";
import { ColorChip } from "@/components/app/ColorChip";
import { ConfirmDestructiveDialog } from "@/components/app/ConfirmDestructiveDialog";
import { ActivateEditionDialog } from "@/components/app/ActivateEditionDialog";

import {
  useChangeEditionStatus,
  useDeleteEdition,
  useEditionsByFair,
} from "@/hooks/queries/editions";
import {
  useAttractionsByEdition,
  useSoftDeleteAttraction,
} from "@/hooks/queries/attractions";
import {
  findConflictingActiveEdition,
  formatEditionLabel,
} from "@/lib/editions";
import { formatDateRange } from "@/lib/datetime";
import { formatEur } from "@/lib/money";
import { errorMessage } from "@/lib/errors";
import type { FairEditionStatus } from "@/types/domain";

export function EdicionDetallePage() {
  const { fairId, edicionId } = useParams<{
    fairId: string;
    edicionId: string;
  }>();
  const navigate = useNavigate();
  const editionsQuery = useEditionsByFair(fairId);
  const deleteEdition = useDeleteEdition(fairId ?? "");
  const changeStatus = useChangeEditionStatus(fairId ?? "");
  const attractionsQuery = useAttractionsByEdition(edicionId);
  const softDeleteAttraction = useSoftDeleteAttraction();

  const edition = editionsQuery.data?.find((e) => e.id === edicionId) ?? null;

  // Dialog de conflicto "una sola activa".
  const [conflict, setConflict] = useState<
    | {
        conflictLabel: string;
        conflictId: string;
        targetLabel: string;
        pendingStatus: FairEditionStatus;
      }
    | null
  >(null);
  const [dialogBusy, setDialogBusy] = useState(false);

  // ----- Estados de carga / error / no-encontrado -----

  if (editionsQuery.isPending) {
    return (
      <div className="mx-auto max-w-5xl">
        <DetailSkeleton />
      </div>
    );
  }
  if (editionsQuery.isError) {
    return (
      <div className="mx-auto max-w-5xl">
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
      <div className="mx-auto max-w-5xl">
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

  async function performStatusChange(
    targetStatus: FairEditionStatus,
  ): Promise<void> {
    try {
      const updated = await changeStatus.mutateAsync({
        id: edition!.id,
        status: targetStatus,
      });
      toast.success(
        statusTransitionToast(updated.status, updated.year),
      );
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  async function handleStatusSelect(targetStatus: FairEditionStatus) {
    if (targetStatus === edition!.status) return; // no-op
    if (targetStatus === "active") {
      const conflictEdition = findConflictingActiveEdition(
        editionsQuery.data ?? [],
        edition!.id,
      );
      if (conflictEdition) {
        setConflict({
          conflictLabel: formatEditionLabel(conflictEdition),
          conflictId: conflictEdition.id,
          targetLabel: formatEditionLabel(edition!),
          pendingStatus: "active",
        });
        return;
      }
    }
    await performStatusChange(targetStatus);
  }

  async function handleDialogConfirm() {
    if (!conflict) return;
    setDialogBusy(true);
    try {
      // Paso 1: cerrar la otra.
      await changeStatus.mutateAsync({
        id: conflict.conflictId,
        status: "closed",
      });
      // Paso 2: activar esta.
      await performStatusChange(conflict.pendingStatus);
      setConflict(null);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setDialogBusy(false);
    }
  }

  async function handleDeleteEdition() {
    if (!fairId || !edicionId) return;
    try {
      await deleteEdition.mutateAsync(edicionId);
      toast.success(
        `Edicion ${edition!.year} eliminada.`,
      );
      navigate(`/ferias/${fairId}`, { replace: true });
    } catch (e) {
      toast.error(errorMessage(e));
      throw e;
    }
  }

  // ----- Render -----

  const isActive = edition.status === "active";
  const hasConflictForDirectActivate =
    findConflictingActiveEdition(editionsQuery.data ?? [], edition.id) !==
    undefined;

  return (
    <>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link to={fairId ? `/ferias/${fairId}` : "/ferias"}>
            Volver a la feria
          </Link>
        </Button>

        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <span>Edicion {edition.year}</span>
              <StatusBadge status={edition.status} />
            </span>
          }
          subtitle={
            <span className="text-sm text-muted-foreground">
              {formatDateRange(edition.start_date, edition.end_date)}
            </span>
          }
          actions={
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link
                  to={
                    fairId && edicionId
                      ? `/ferias/${fairId}/ediciones/${edicionId}/editar`
                      : "#"
                  }
                >
                  <Pencil className="size-3.5" />
                  Editar
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={changeStatus.isPending}
                    aria-label="Cambiar estado de la edicion"
                  >
                    {changeStatus.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <ChevronDown className="size-3.5" />
                    )}
                    Cambiar estado
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Estado destino</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => handleStatusSelect("planned")}
                    disabled={edition.status === "planned"}
                  >
                    <StatusBadge status="planned" />
                    <span className="ml-1">Prevista</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => handleStatusSelect("active")}
                    disabled={edition.status === "active"}
                  >
                    <StatusBadge status="active" />
                    <span className="ml-1">En curso</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => handleStatusSelect("closed")}
                    disabled={edition.status === "closed"}
                  >
                    <StatusBadge status="closed" />
                    <span className="ml-1">Cerrada</span>
                  </DropdownMenuItem>
                  {!isActive && hasConflictForDirectActivate && (
                    <>
                      <DropdownMenuSeparator />
                      <p className="px-1.5 py-1 text-xs text-muted-foreground">
                        Activar pedira confirmar el cierre de la otra edicion activa.
                      </p>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <ConfirmDestructiveDialog
                trigger={
                  <Button variant="destructive" size="sm">
                    <Trash2 className="size-3.5" />
                    Eliminar
                  </Button>
                }
                title={`Eliminar edicion ${edition.year}`}
                description={
                  <>
                    Esta accion no se puede deshacer. Si la edicion tiene
                    atracciones asociadas, la operacion fallara con un
                    mensaje claro.
                  </>
                }
                actionLabel="Eliminar edicion"
                onConfirm={handleDeleteEdition}
              />
            </div>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>Informacion</CardTitle>
            <CardDescription>
              Datos basicos de la edicion.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Ano</dt>
                <dd className="mt-0.5 font-medium">{edition.year}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Estado</dt>
                <dd className="mt-0.5">
                  <StatusBadge status={edition.status} />
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Fecha de inicio</dt>
                <dd className="mt-0.5">
                  {formatDateRange(edition.start_date, null)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Fecha de fin</dt>
                <dd className="mt-0.5">
                  {formatDateRange(null, edition.end_date)}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Identificador</dt>
                <dd className="mt-0.5 break-all font-mono text-xs">
                  {edition.id}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Atracciones</CardTitle>
              <CardDescription>
                Solo se muestran las atracciones activas (las soft-deleted
                se conservan para informes).
              </CardDescription>
            </div>
            <Button asChild size="sm">
              <Link
                to={
                  fairId && edicionId
                    ? `/ferias/${fairId}/ediciones/${edicionId}/atracciones/nueva`
                    : "#"
                }
              >
                <Plus className="size-3.5" />
                Nueva atraccion
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {attractionsQuery.isPending && <ListSkeleton rows={3} />}
            {attractionsQuery.isError && (
              <ErrorState
                error={attractionsQuery.error}
                onRetry={() => attractionsQuery.refetch()}
                title="No se pudieron cargar las atracciones"
              />
            )}
            {attractionsQuery.isSuccess &&
              attractionsQuery.data.length === 0 && (
                <EmptyState
                  icon={<Plus className="size-5" />}
                  title="Aun no tienes atracciones"
                  description="Crea la primera atraccion de esta edicion para empezar a configurar precio y color."
                  action={
                    fairId && edicionId ? (
                      <Button asChild>
                        <Link
                          to={`/ferias/${fairId}/ediciones/${edicionId}/atracciones/nueva`}
                        >
                          <Plus className="size-4" />
                          Crear primera atraccion
                        </Link>
                      </Button>
                    ) : undefined
                  }
                />
              )}
            {attractionsQuery.isSuccess &&
              attractionsQuery.data.length > 0 && (
                <div className="rounded-md border bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="hidden w-16 sm:table-cell">
                          Color
                        </TableHead>
                        <TableHead className="hidden w-28 sm:table-cell">
                          Precio base
                        </TableHead>
                        <TableHead className="hidden w-28 sm:table-cell">
                          Estado
                        </TableHead>
                        <TableHead className="w-12 text-right">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attractionsQuery.data.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">
                            {a.name}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <ColorChip color={a.color} />
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground sm:table-cell">
                            {formatEur(a.base_ticket_price)}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <StatusBadge
                              status={a.is_active ? "active" : "inactive"}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <AttractionRowActions
                              attractionId={a.id}
                              attractionName={a.name}
                              fairId={fairId}
                              edicionId={edicionId}
                              onSoftDelete={async () => {
                                try {
                                  await softDeleteAttraction.mutateAsync({
                                    id: a.id,
                                    editionId: edition!.id,
                                  });
                                  toast.success(
                                    `Atraccion "${a.name}" eliminada.`,
                                  );
                                } catch (e) {
                                  toast.error(errorMessage(e));
                                  throw e;
                                }
                              }}
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

// ============================================================
// Acciones inline de cada fila de atraccion.
// ============================================================

function AttractionRowActions({
  attractionId,
  attractionName,
  fairId,
  edicionId,
  onSoftDelete,
}: {
  attractionId: string;
  attractionName: string;
  fairId?: string;
  edicionId?: string;
  onSoftDelete: () => Promise<unknown>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Acciones para ${attractionName}`}
        >
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link
            to={
              fairId && edicionId
                ? `/ferias/${fairId}/ediciones/${edicionId}/atracciones/${attractionId}/editar`
                : "#"
            }
          >
            <Pencil className="size-3.5" />
            Editar
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ConfirmDestructiveDialog
          trigger={
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              variant="destructive"
            >
              <Trash2 className="size-3.5" />
              Eliminar
            </DropdownMenuItem>
          }
          title={`Eliminar "${attractionName}"`}
          description={
            <>
              La atraccion quedara marcada como inactiva. No aparecera
              en el TPV pero se conserva para informes. La accion se
              puede revertir solo desde una iteracion posterior.
            </>
          }
          actionLabel="Eliminar atraccion"
          onConfirm={onSoftDelete}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================
// Helpers
// ============================================================

function statusTransitionToast(
  status: FairEditionStatus,
  year: number,
): string {
  switch (status) {
    case "planned":
      return `Edicion ${year} marcada como prevista.`;
    case "active":
      return `Edicion ${year} ahora esta en curso.`;
    case "closed":
      return `Edicion ${year} cerrada.`;
  }
}
