/**
 * pages/PendingBackendPage.tsx — FeriaNet
 *
 * Pagina placeholder usada mientras el backend no expone los commands
 * de `FairEdition` (create/list/update/delete). Muestra un mensaje
 * claro y bloquea cualquier intento de operacion.
 *
 * Se usa en las rutas:
 *   /ferias/:fairId/ediciones/nueva
 *   /ferias/:fairId/ediciones/:edicionId
 *   /ferias/:fairId/ediciones/:edicionId/editar
 *   /ferias/:fairId/ediciones/:edicionId/atraccciones/nueva
 *   /ferias/:fairId/ediciones/:edicionId/atracciones/:atraccionId/editar
 *
 * Cuando el backend exponga los commands, hay que reemplazar el
 * contenido de esta pagina por la implementacion real (los hooks y
 * la capa API ya estan preparados como stubs).
 */

import { Link, useParams } from "react-router";
import { ArrowLeft, Construction } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PendingBackendPageProps {
  title: string;
  description?: string;
}

export function PendingBackendPage({
  title,
  description,
}: PendingBackendPageProps) {
  const { fairId, edicionId, atraccionId } = useParams();
  const backTo = fairId && edicionId
    ? `/ferias/${fairId}/ediciones/${edicionId}`
    : fairId
    ? `/ferias/${fairId}`
    : "/ferias";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to={backTo}>
          <ArrowLeft className="size-3.5" />
          Volver
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
              <Construction className="size-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>
                Pendiente de la siguiente iteracion de backend.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
          <div className="rounded-md border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">
              Por que esta pantalla existe
            </p>
            <p>
              El backend Rust cerro la epica 1 con 10 commands
              (ferias + atracciones) pero sin exponer CRUD de
              <code className="mx-1 rounded bg-background px-1 font-mono text-[11px]">
                FairEdition
              </code>
              . Para no romper la navegacion, esta pagina marca la
              superficie como pendiente en vez de fallar. Cuando el
              backend exponga los commands, el contenido de esta
              pantalla sera reemplazado por la implementacion real; los
              hooks y la capa API ya estan definidos en
              <code className="ml-1 rounded bg-background px-1 font-mono text-[11px]">
                src/api/tauri.ts
              </code>
              .
            </p>
          </div>
          {atraccionId && (
            <p className="text-muted-foreground">
              <span className="font-medium">Atraccion objetivo:</span>{" "}
              <code className="rounded bg-muted px-1 font-mono text-[11px]">
                {atraccionId}
              </code>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
