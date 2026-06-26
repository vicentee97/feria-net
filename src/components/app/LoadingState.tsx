/**
 * components/app/LoadingState.tsx — FeriaNet
 *
 * Skeleton generico para estados de carga de listas / detalle.
 * Sustituye al "Cargando..." generico para evitar pantallas en blanco.
 */

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function ListSkeleton({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function DetailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-7 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="mt-6 h-32 w-full" />
    </div>
  );
}
