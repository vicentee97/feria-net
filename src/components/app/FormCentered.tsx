/**
 * components/app/FormCentered.tsx — FeriaNet
 *
 * Wrapper para paginas de formulario centradas (New / Edit). Renderiza
 * una tarjeta maxima con cabecera y slot para el formulario. Pensado
 * para formularios cortos (1-4 campos) que caben en una sola vista.
 *
 * NO es un Dialog: vive en una ruta completa dentro del MainLayout,
 * para que el breadcrumb y el boton "atras" del navegador funcionen.
 */

import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FormCenteredProps {
  title: ReactNode;
  description?: ReactNode;
  backTo: string;
  backLabel?: string;
  children: ReactNode;
  className?: string;
}

export function FormCentered({
  title,
  description,
  backTo,
  backLabel = "Volver",
  children,
  className,
}: FormCenteredProps) {
  return (
    <div className={cn("mx-auto w-full max-w-xl", className)}>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
        <Link to={backTo}>
          <ArrowLeft className="size-3.5" />
          {backLabel}
        </Link>
      </Button>
      <div className="rounded-lg border bg-background p-5 shadow-sm sm:p-6">
        <div className="mb-5 space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
