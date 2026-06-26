/**
 * components/app/Breadcrumbs.tsx — FeriaNet
 *
 * Migas de pan reactivas segun la ruta actual. Resuelve el nombre
 * de la feria cuando esta en la URL para no mostrar el UUID crudo.
 *
 * Estructura esperada (ver router en `App.tsx`):
 *   /                                                  Inicio
 *   /ferias                                            Ferias
 *   /ferias/nueva                                      Ferias / Nueva
 *   /ferias/:fairId                                    Ferias / Feria
 *   /ferias/:fairId/editar                             Ferias / Feria / Editar
 *   /ferias/:fairId/ediciones/nueva                    Ferias / Feria / Nueva edicion
 *   /ferias/:fairId/ediciones/:edicionId               Ferias / Feria / Edicion
 *   /ferias/:fairId/ediciones/:edicionId/editar        Ferias / Feria / Edicion / Editar
 *   /ferias/:fairId/ediciones/:edicionId/atracciones/nueva
 *                                                       Ferias / Feria / Edicion / Nueva atraccion
 *   /ferias/:fairId/ediciones/:edicionId/atracciones/:atraccionId/editar
 *                                                       Ferias / Feria / Edicion / Atraccion / Editar
 */

import { Link, useLocation, useParams } from "react-router";
import { ChevronRight, Home } from "lucide-react";

import { useFair } from "@/hooks/queries/fairs";
import { cn } from "@/lib/utils";

interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs() {
  const location = useLocation();
  const params = useParams();

  // Resolver nombre de feria al top level (rules of hooks).
  const fairQuery = useFair(params.fairId);

  const crumbs = buildCrumbs(location.pathname, params, fairQuery.data?.name);

  return (
    <nav aria-label="Breadcrumbs" className="flex min-w-0 items-center gap-1">
      <ol className="flex min-w-0 flex-wrap items-center gap-1 text-sm">
        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1;
          return (
            <li
              key={`${crumb.label}-${idx}`}
              className="flex min-w-0 items-center gap-1"
            >
              {idx === 0 && (
                <Home
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
              {crumb.to && !isLast ? (
                <Link
                  to={crumb.to}
                  className="truncate rounded text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    "truncate",
                    isLast ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {crumb.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight
                  className="size-3.5 shrink-0 text-muted-foreground/60"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function buildCrumbs(
  pathname: string,
  params: Record<string, string | undefined>,
  fairName: string | undefined,
): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);

  // Raiz: / -> solo Inicio.
  if (segments.length === 0) {
    return [{ label: "Inicio" }];
  }

  const crumbs: Crumb[] = [{ label: "Ferias", to: "/ferias" }];

  if (segments[0] !== "ferias") return crumbs;

  if (segments.length === 1) {
    crumbs.push({ label: "Todas" });
    return crumbs;
  }
  if (segments[1] === "nueva") {
    crumbs.push({ label: "Nueva feria" });
    return crumbs;
  }

  // A partir de aqui hay fairId.
  const fairCrumb: Crumb = {
    label: fairName ?? "Feria",
    to: params.fairId ? `/ferias/${params.fairId}` : undefined,
  };
  crumbs.push(fairCrumb);

  if (segments[2] === "editar") {
    crumbs.push({ label: "Editar" });
    return crumbs;
  }

  if (segments[2] !== "ediciones") return crumbs;

  if (segments[3] === "nueva") {
    crumbs.push({ label: "Nueva edicion" });
    return crumbs;
  }
  if (segments[3]) {
    crumbs.push({ label: `Edicion ${segments[3].slice(0, 8)}` });
    if (segments[4] === "editar") {
      crumbs.push({ label: "Editar" });
      return crumbs;
    }
    if (segments[4] === "atracciones") {
      if (segments[5] === "nueva") {
        crumbs.push({ label: "Nueva atraccion" });
        return crumbs;
      }
      if (segments[5]) {
        crumbs.push({ label: `Atraccion ${segments[5].slice(0, 8)}` });
        if (segments[6] === "editar") {
          crumbs.push({ label: "Editar" });
          return crumbs;
        }
      }
    }
  }

  return crumbs;
}
