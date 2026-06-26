/**
 * pages/FeriasListadoPage.tsx — FeriaNet
 *
 * Listado principal de ferias en formato tabla densa. Acciones por fila
 * mediante DropdownMenu para mantener la fila limpia.
 *
 * Estado:
 *  - Cargando: skeleton de filas.
 *  - Error: ErrorState con reintento.
 *  - Vacio: EmptyState con CTA grande.
 *  - Cargado: tabla con paginacion simple (client-side).
 *
 * Acciones por fila: ver detalle, editar, eliminar (con confirmacion).
 */

import { useMemo, useState } from "react";
import { Link } from "react-router";
import { MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { ErrorState } from "@/components/app/ErrorState";
import { ConfirmDestructiveDialog } from "@/components/app/ConfirmDestructiveDialog";

import { useDeleteFair, useFairs } from "@/hooks/queries/fairs";
import { formatTimestamp } from "@/lib/datetime";
import { errorMessage } from "@/lib/errors";

export function FeriasListadoPage() {
  const fairsQuery = useFairs();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const list = fairsQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((f) => f.name.toLowerCase().includes(q));
  }, [fairsQuery.data, search]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Ferias"
        subtitle="Listado de ferias registradas. Busca por nombre."
        actions={
          <Button asChild>
            <Link to="/ferias/nueva">
              <Plus className="size-4" />
              Nueva feria
            </Link>
          </Button>
        }
      />

      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          inputMode="search"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
          aria-label="Buscar ferias por nombre"
        />
      </div>

      {fairsQuery.isPending && <TableSkeleton />}
      {fairsQuery.isError && (
        <ErrorState
          error={fairsQuery.error}
          onRetry={() => fairsQuery.refetch()}
          title="No se pudieron cargar las ferias"
        />
      )}
      {fairsQuery.isSuccess && filtered.length === 0 && search.trim() !== "" && (
        <EmptyState
          icon={<Search className="size-5" />}
          title="Sin resultados"
          description={`No hay ferias que coincidan con "${search.trim()}".`}
        />
      )}
      {fairsQuery.isSuccess &&
        fairsQuery.data!.length === 0 && (
          <EmptyState
            icon={<Plus className="size-5" />}
            title="Aun no tienes ferias"
            description="Crea la primera para empezar a configurar ediciones y atracciones."
            action={
              <Button asChild>
                <Link to="/ferias/nueva">
                  <Plus className="size-4" />
                  Crear primera feria
                </Link>
              </Button>
            }
          />
        )}
      {fairsQuery.isSuccess && filtered.length > 0 && (
        <div className="rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden sm:table-cell">Notas</TableHead>
                <TableHead className="hidden w-44 sm:table-cell">
                  Creada
                </TableHead>
                <TableHead className="w-12 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((fair) => (
                <TableRow key={fair.id}>
                  <TableCell className="font-medium">
                    <Link
                      to={`/ferias/${fair.id}`}
                      className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      {fair.name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden max-w-xs truncate text-muted-foreground sm:table-cell">
                    {fair.notes || "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {formatTimestamp(fair.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <RowActions fairId={fair.id} fairName={fair.name} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function RowActions({ fairId, fairName }: { fairId: string; fairName: string }) {
  const deleteFair = useDeleteFair();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Acciones para ${fairName}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link to={`/ferias/${fairId}`}>Ver detalle</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={`/ferias/${fairId}/editar`}>
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
          title={`Eliminar feria "${fairName}"`}
          description={
            <>
              Esta accion no se puede deshacer. Si la feria tiene ediciones
              asociadas, la operacion fallara.
            </>
          }
          actionLabel="Eliminar"
          onConfirm={async () => {
            try {
              await deleteFair.mutateAsync(fairId);
              toast.success(`Feria "${fairName}" eliminada.`);
            } catch (e) {
              toast.error(errorMessage(e));
              throw e;
            }
          }}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-md border bg-background">
      <div className="space-y-2 p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
