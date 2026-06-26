/**
 * components/app/ErrorState.tsx — FeriaNet
 *
 * Bloque para errores recuperables. Muestra el mensaje del backend
 * (texto claro, sin stack) y ofrece un CTA "Reintentar" cuando hay
 * un handler.
 */

import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  className?: string;
  title?: string;
}

export function ErrorState({
  error,
  onRetry,
  className,
  title = "Algo salio mal",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-8 text-center",
        className,
      )}
    >
      <div className="grid size-10 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="max-w-md text-sm text-muted-foreground">
          {errorMessage(error)}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
