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
 *   /cajas                                             Cajas
 *   /cajas/nueva                                       Cajas / Abrir caja
 *   /cajas/:id                                         Cajas / Caja ...
 *   /tpv                                               Cajas / TPV (Caja ...)
 */

import { Link, useLocation, useParams, useSearchParams } from "react-router";
import { ChevronRight, Home } from "lucide-react";

import { useFair } from "@/hooks/queries/fairs";
import { useCashSessionById } from "@/hooks/queries/cash_sessions";
import { cn } from "@/lib/utils";

interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs() {
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();

  // Resolver nombre de feria al top level (rules of hooks).
  const fairQuery = useFair(params.fairId);

  // Para rutas que dependen de una caja (TPV, detalle): resolver nombre
  // desde el cache cross-attraction.
  const sessionId =
    location.pathname.startsWith("/cajas/") && segments(location.pathname)[1] &&
    segments(location.pathname)[1] !== "nueva"
      ? segments(location.pathname)[1]
      : location.pathname.startsWith("/tpv")
        ? searchParams.get("session") ?? undefined
        : undefined;
  const sessionCtx = useCashSessionById(sessionId);

  const crumbs = buildCrumbs(
    location.pathname,
    params,
    fairQuery.data?.name,
    sessionCtx.attraction?.name,
    searchParams.get("session"),
  );

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

function segments(pathname: string): string[] {
  return pathname.split("/").filter(Boolean);
}

function buildCrumbs(
  pathname: string,
  params: Record<string, string | undefined>,
  fairName: string | undefined,
  attractionName: string | undefined,
  tpvSessionId: string | null,
): Crumb[] {
  const segs = segments(pathname);

  // Raiz: / -> solo Inicio.
  if (segs.length === 0) {
    return [{ label: "Inicio" }];
  }

  // --- Cajas y TPV ---
  if (segs[0] === "cajas") {
    const crumbs: Crumb[] = [{ label: "Cajas", to: "/cajas" }];
    if (segs.length === 1) {
      crumbs.push({ label: "Todas" });
      return crumbs;
    }
    if (segs[1] === "nueva") {
      crumbs.push({ label: "Abrir caja" });
      return crumbs;
    }
    // /cajas/:id
    const sessionId = segs[1];
    if (sessionId) {
      const label = attractionName
        ? `${attractionName}`
        : `Caja ${sessionId.slice(0, 8)}`;
      crumbs.push({
        label,
        to: `/cajas/${sessionId}`,
      });
    }
    return crumbs;
  }
  if (segs[0] === "tpv") {
    const crumbs: Crumb[] = [{ label: "Cajas", to: "/cajas" }];
    // El crumb de la caja se resuelve con el sessionId (query param).
    if (tpvSessionId) {
      crumbs.push({
        label: attractionName ? attractionName : `Caja ${tpvSessionId.slice(0, 8)}`,
        to: `/cajas/${tpvSessionId}`,
      });
    }
    crumbs.push({ label: "TPV" });
    return crumbs;
  }

  // --- Ferias (mantenido del equipo 1) ---
  const crumbs: Crumb[] = [{ label: "Ferias", to: "/ferias" }];

  if (segs[0] !== "ferias") return crumbs;

  if (segs.length === 1) {
    crumbs.push({ label: "Todas" });
    return crumbs;
  }
  if (segs[1] === "nueva") {
    crumbs.push({ label: "Nueva feria" });
    return crumbs;
  }

  // A partir de aqui hay fairId.
  const fairCrumb: Crumb = {
    label: fairName ?? "Feria",
    to: params.fairId ? `/ferias/${params.fairId}` : undefined,
  };
  crumbs.push(fairCrumb);

  if (segs[2] === "editar") {
    crumbs.push({ label: "Editar" });
    return crumbs;
  }

  if (segs[2] !== "ediciones") return crumbs;

  if (segs[3] === "nueva") {
    crumbs.push({ label: "Nueva edicion" });
    return crumbs;
  }
  if (segs[3]) {
    crumbs.push({ label: `Edicion ${segs[3].slice(0, 8)}` });
    if (segs[4] === "editar") {
      crumbs.push({ label: "Editar" });
      return crumbs;
    }
    if (segs[4] === "atracciones") {
      if (segs[5] === "nueva") {
        crumbs.push({ label: "Nueva atraccion" });
        return crumbs;
      }
      if (segs[5]) {
        crumbs.push({ label: `Atraccion ${segs[5].slice(0, 8)}` });
        if (segs[6] === "editar") {
          crumbs.push({ label: "Editar" });
          return crumbs;
        }
      }
    }
  }

  return crumbs;
}
