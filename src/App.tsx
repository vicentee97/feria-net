/**
 * App.tsx — FeriaNet
 *
 * Entry point del frontend. Configura:
 *  - React Router 7 con rutas declarativas (createBrowserRouter).
 *  - TanStack Query con defaults razonables para una app local-first.
 *  - Toaster (Sonner) para feedback de mutaciones.
 *  - TooltipProvider global (shadcn) para tooltips en toda la app.
 *
 * Estructura de rutas (TEAM-010; superficie completa de epica 1+2):
 *  /                                                Dashboard
 *  /ferias                                          FeriasListado
 *  /ferias/nueva                                    FeriaNueva
 *  /ferias/:fairId                                  FeriaDetalle
 *  /ferias/:fairId/editar                           FeriaEditar
 *  /ferias/:fairId/ediciones/nueva                  EdicionNueva
 *  /ferias/:fairId/ediciones/:edicionId             EdicionDetalle
 *  /ferias/:fairId/ediciones/:edicionId/editar      EdicionEditar
 *  /ferias/:fairId/ediciones/:edicionId/atracciones/nueva
 *                                                   AtraccionNueva
 *  /ferias/:fairId/ediciones/:edicionId/atracciones/:atraccionId/editar
 *                                                   AtraccionEditar
 *  /cajas                                           CajasListado
 *  /cajas/nueva                                     AbrirCaja
 *  /cajas/:id                                       CajaDetalle
 *  /tpv?session=:id                                 TpvPage
 *  *                                                NotFound
 *
 * Layout principal (sidebar) envuelve todas las rutas validas.
 */

import { useState } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
} from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MainLayout } from "@/layouts/MainLayout";

import { DashboardPage } from "@/pages/DashboardPage";
import { FeriasListadoPage } from "@/pages/FeriasListadoPage";
import { FeriaNuevaPage } from "@/pages/FeriaNuevaPage";
import { FeriaDetallePage } from "@/pages/FeriaDetallePage";
import { FeriaEditarPage } from "@/pages/FeriaEditarPage";
import { EdicionNuevaPage } from "@/pages/EdicionNuevaPage";
import { EdicionDetallePage } from "@/pages/EdicionDetallePage";
import { EdicionEditarPage } from "@/pages/EdicionEditarPage";
import { AtraccionNuevaPage } from "@/pages/AtraccionNuevaPage";
import { AtraccionEditarPage } from "@/pages/AtraccionEditarPage";
import { CajasListadoPage } from "@/pages/CajasListadoPage";
import { AbrirCajaPage } from "@/pages/AbrirCajaPage";
import { CajaDetallePage } from "@/pages/CajaDetallePage";
import { TpvPage } from "@/pages/TpvPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Sin red en absoluto: reintentos solo si la app se monta despues
      // de un fallo transient. En local-first, los errores no son
      // recuperables magicamente; mejor fallar rapido y mostrar UI.
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * Router raiz. Usa `createBrowserRouter` para que la URL sea la fuente
 * de verdad (compatible con la navegacion nativa del WebView de Tauri).
 *
 * Layout anidado: MainLayout envuelve todas las rutas excepto la 404,
 * que se renderiza sin chrome para no contaminar la pantalla de error.
 */
const router = createBrowserRouter([
  {
    element: (
      <TooltipProvider delayDuration={150}>
        <Outlet />
        <Toaster position="bottom-right" richColors closeButton />
      </TooltipProvider>
    ),
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "ferias", element: <FeriasListadoPage /> },
          { path: "ferias/nueva", element: <FeriaNuevaPage /> },
          { path: "ferias/:fairId", element: <FeriaDetallePage /> },
          { path: "ferias/:fairId/editar", element: <FeriaEditarPage /> },
          {
            path: "ferias/:fairId/ediciones/nueva",
            element: <EdicionNuevaPage />,
          },
          {
            path: "ferias/:fairId/ediciones/:edicionId",
            element: <EdicionDetallePage />,
          },
          {
            path: "ferias/:fairId/ediciones/:edicionId/editar",
            element: <EdicionEditarPage />,
          },
          {
            path: "ferias/:fairId/ediciones/:edicionId/atracciones/nueva",
            element: <AtraccionNuevaPage />,
          },
          {
            path: "ferias/:fairId/ediciones/:edicionId/atracciones/:atraccionId/editar",
            element: <AtraccionEditarPage />,
          },
          { path: "cajas", element: <CajasListadoPage /> },
          { path: "cajas/nueva", element: <AbrirCajaPage /> },
          { path: "cajas/:id", element: <CajaDetallePage /> },
          { path: "tpv", element: <TpvPage /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

function App() {
  // Estado: lo unico que necesitamos es el QueryClient (memoizado).
  const [client] = useState(() => queryClient);
  return (
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
