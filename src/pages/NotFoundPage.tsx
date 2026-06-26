/**
 * pages/NotFoundPage.tsx — FeriaNet
 *
 * Pagina 404 canonica. Mensaje claro + CTA "Volver al inicio".
 */

import { Link } from "react-router";
import { Home } from "lucide-react";

import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="text-6xl font-semibold tracking-tight text-muted-foreground/60">
        404
      </p>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Pagina no encontrada</h1>
        <p className="text-sm text-muted-foreground">
          La ruta solicitada no existe en esta aplicacion.
        </p>
      </div>
      <Button asChild>
        <Link to="/">
          <Home className="size-4" />
          Volver al inicio
        </Link>
      </Button>
    </div>
  );
}
