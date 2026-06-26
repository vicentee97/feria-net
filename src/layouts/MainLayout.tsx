/**
 * layouts/MainLayout.tsx — FeriaNet
 *
 * Layout principal con sidebar fija a la izquierda y contenido a la
 * derecha. En pantallas <1024px la sidebar se colapsa en un menu
 * hamburguesa para dejar el area de contenido usable.
 *
 * Estructura:
 *  - Sidebar: navegacion primaria (Ferias + placeholders de epicas
 *    futuras: Cajas, Informes, Sync, Configuracion).
 *  - Main: breadcrumbs + contenido de la ruta.
 *
 * Sin loading global: cada pagina gestiona su propio estado.
 */

import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import {
  CalendarRange,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  RefreshCw,
  Settings2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Breadcrumbs } from "@/components/app/Breadcrumbs";

interface NavItem {
  to?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  /** Tooltip cuando esta disabled. */
  comingSoonLabel?: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Inicio", icon: LayoutDashboard },
  {
    to: "/ferias",
    label: "Ferias",
    icon: CalendarRange,
  },
  {
    label: "Cajas",
    icon: ReceiptText,
    disabled: true,
    comingSoonLabel: "Disponible en la epica 2.",
  },
  {
    label: "Informes",
    icon: ReceiptText,
    disabled: true,
    comingSoonLabel: "Disponible en la epica 4.",
  },
  {
    label: "Sync",
    icon: RefreshCw,
    disabled: true,
    comingSoonLabel: "Disponible en la epica 5.",
  },
  {
    label: "Configuracion",
    icon: Settings2,
    disabled: true,
    comingSoonLabel: "Disponible en la epica 7.",
  },
];

const SIDEBAR_EXPANDED = "w-60";
const SIDEBAR_COLLAPSED = "w-14";

export function MainLayout() {
  // Empezamos colapsado en pantallas pequenas; expandido en >= lg.
  const [collapsed, setCollapsed] = useState<boolean>(
    () => typeof window !== "undefined" && window.innerWidth < 1024,
  );

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-[100dvh] bg-muted/30">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center gap-2 border-b bg-background px-4 sm:px-6">
            <Breadcrumbs />
          </header>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "sticky top-0 flex h-[100dvh] shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-150",
        collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED,
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-sidebar-border px-3",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && (
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight"
          >
            <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
              F
            </span>
            <span>FeriaNet</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggle}
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              <SidebarItem item={item} collapsed={collapsed} />
            </li>
          ))}
        </ul>
      </nav>

      {!collapsed && (
        <>
          <Separator className="bg-sidebar-border" />
          <div className="p-3 text-xs text-muted-foreground">
            v1 (MVP) · Epica 1
          </div>
        </>
      )}
    </aside>
  );
}

function SidebarItem({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const iconEl = (
    <item.icon className="size-4 shrink-0" aria-hidden="true" />
  );

  const inner = (
    <span
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        item.disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        collapsed && "justify-center",
      )}
    >
      {iconEl}
      {!collapsed && <span className="truncate">{item.label}</span>}
    </span>
  );

  if (item.disabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span aria-disabled="true" tabIndex={-1}>
            {inner}
          </span>
        </TooltipTrigger>
        {collapsed && (
          <TooltipContent side="right">
            <p>{item.label} · {item.comingSoonLabel ?? "Proximamente"}</p>
          </TooltipContent>
        )}
      </Tooltip>
    );
  }

  return (
    <NavLink
      to={item.to ?? "#"}
      end={item.to === "/"}
      className={({ isActive }) =>
        cn(
          "outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md",
          isActive &&
            "bg-sidebar-accent text-sidebar-accent-foreground",
        )
      }
    >
      {inner}
    </NavLink>
  );
}

// Evita warning de unused imports en builds viejos de TS.
const _unused = { ChevronsLeft, ChevronsRight, useLocation };
void _unused;
