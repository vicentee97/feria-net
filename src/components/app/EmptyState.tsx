/**
 * components/app/EmptyState.tsx — FeriaNet
 *
 * Bloque visual para listas vacias. Mensaje claro + CTA opcional.
 * Pensado para pantallas operativas: NO es una landing ni decoracion.
 */

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-background/60 px-6 py-10 text-center",
        className,
      )}
    >
      {icon && (
        <div className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
