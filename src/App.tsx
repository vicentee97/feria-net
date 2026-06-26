/**
 * App.tsx — FeriaNet
 *
 * Entry point del frontend. Configura:
 *  - React Router 7 con rutas declarativas (createBrowserRouter).
 *  - TanStack Query con defaults razonables para una app local-first.
 *  - Toaster (Sonner) para feedback de mutaciones.
 *  - TooltipProvider global (shadcn) para tooltips en toda la app.
 *
 * Estructura de rutas (ver brief, ajustada al estado real del backend):
 *  /                                                Dashboard
 *  /ferias                                          FeriasListado
 *  /ferias/nueva                                    FeriaNueva
 *  /ferias/:fairId                                  FeriaDetalle
 *  /ferias/:fairId/editar                           FeriaEditar
 *  /ferias/:fairId/ediciones/nueva                  Pendiente backend
 *  /ferias/:fairId/ediciones/:edicionId             Pendiente backend
 *  /ferias/:fairId/ediciones/:edicionId/editar      Pendiente backend
 *  /ferias/:fairId/ediciones/:edicionId/atraccciones/nueva
 *                                                   Pendiente backend
 *  /ferias/:fairId/ediciones/:edicionId/atracciones/:atraccionId/editar
 *                                                   Pendiente backend
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
import { PendingBackendPage } from "@/pages/PendingBackendPage";
import { AtraccionEditarPage } from "@/pages/AtraccionEditarPage";
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
            element: (
              <PendingBackendPage
                title="Nueva edicion"
                description="La creacion de ediciones de feria requiere commands Tauri que el backend Rust de la epica 1 no expuso (create_fair_edition, list_fair_editions, update_fair_edition, delete_fair_edition)."
              />
            ),
          },
          {
            path: "ferias/:fairId/ediciones/:edicionId",
            element: (
              <PendingBackendPage
                title="Detalle de la edicion"
                description="Esta pantalla listaria las atracciones de la edicion (create/list/update de atracciones ya estan operativos en el backend)."
              />
            ),
          },
          {
            path: "ferias/:fairId/ediciones/:edicionId/editar",
            element: (
              <PendingBackendPage
                title="Editar edicion"
                description="La edicion de fechas, ano y estado requiere commands Tauri no expuestos."
              />
            ),
          },
          {
            path: "ferias/:fairId/ediciones/:edicionId/atracciones/nueva",
            element: (
              <PendingBackendPage
                title="Nueva atraccion"
                description="Requiere que la edicion exista (commands de FairEdition pendientes)."
              />
            ),
          },
          {
            path: "ferias/:fairId/ediciones/:edicionId/atracciones/:atraccionId/editar",
            element: <AtraccionEditarPage />,
          },
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
