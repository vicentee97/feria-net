/**
 * components/app/StatusBadge.tsx — FeriaNet
 *
 * Badge de estado para ferias, ediciones y atracciones. Mapea el
 * estado a un color consistente con la paleta del tema (shadcn).
 */

import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusKind = "planned" | "active" | "closed" | "inactive";

const STATUS_LABEL: Record<StatusKind, string> = {
  planned: "Prevista",
  active: "En curso",
  closed: "Cerrada",
  inactive: "Inactiva",
};

const STATUS_CLASSES: Record<StatusKind, string> = {
  planned:
    "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
  active:
    "bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/30 dark:text-emerald-300",
  closed:
    "bg-zinc-500/10 text-zinc-700 ring-1 ring-inset ring-zinc-500/30 dark:text-zinc-300",
  inactive:
    "bg-amber-500/10 text-amber-700 ring-1 ring-inset ring-amber-500/30 dark:text-amber-300",
};

interface StatusBadgeProps {
  status: StatusKind;
  children?: ReactNode;
  className?: string;
}

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent font-medium",
        STATUS_CLASSES[status],
        className,
      )}
    >
      {children ?? STATUS_LABEL[status]}
    </Badge>
  );
}
