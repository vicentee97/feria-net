/**
 * pages/DashboardPage.tsx — FeriaNet
 *
 * Resumen de la temporada. Estados:
 *  - Sin ferias: CTA grande "Crear primera feria".
 *  - Con ferias: listado por nombre con notas truncadas y fecha de
 *    creacion. Click en una fila abre su detalle.
 *
 * Para v1 esto es suficiente: en MVP no hay aun "temporada" formal,
 * asi que el dashboard es informativo, no accionable. Los conteos de
 * ediciones y atracciones se ven dentro del detalle de cada feria.
 */

import { Link } from "react-router";
import { CalendarRange, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { ListSkeleton } from "@/components/app/LoadingState";
import { ErrorState } from "@/components/app/ErrorState";
import { useFairs } from "@/hooks/queries/fairs";
import { formatTimestamp } from "@/lib/datetime";

export function DashboardPage() {
  const fairsQuery = useFairs();

  const hasFairs = (fairsQuery.data?.length ?? 0) > 0;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        title="Inicio"
        subtitle="Resumen rapido de tus ferias y ediciones."
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Tus ferias</CardTitle>
            <CardDescription>
              Ferias genericas registradas. Cada una agrupa las ediciones
              anuales.
            </CardDescription>
          </div>
          <Button asChild size="sm">
            <Link to="/ferias/nueva">
              <Plus className="size-4" />
              Nueva feria
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {fairsQuery.isPending && <ListSkeleton rows={3} />}
          {fairsQuery.isError && (
            <ErrorState
              error={fairsQuery.error}
              onRetry={() => fairsQuery.refetch()}
              title="No se pudieron cargar las ferias"
            />
          )}
          {fairsQuery.isSuccess && !hasFairs && (
            <EmptyState
              icon={<CalendarRange className="size-5" />}
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
          {fairsQuery.isSuccess && hasFairs && (
            <ul className="divide-y">
              {fairsQuery.data!.map((fair) => (
                <li
                  key={fair.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/ferias/${fair.id}`}
                      className="text-sm font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      {fair.name}
                    </Link>
                    {fair.notes && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {fair.notes}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    creada {formatTimestamp(fair.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
