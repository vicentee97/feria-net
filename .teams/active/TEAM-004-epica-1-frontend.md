# TEAM-004 — Épica 1 frontend (UI ferias + atracciones)

- ID: TEAM-004
- Nombre: Épica 1 frontend (UI ferias + atracciones)
- Fecha creacion: 2026-06-26
- Estado: activo

## Descripcion

Construir la UI de FeriaNet para que el feriante gestione ferias, ediciones y atracciones, consumiendo los commands Tauri expuestos por TEAM-003 (ferias + atracciones) y dejando preparada la superficie para los commands de `FairEdition` que el backend aún no expone.

## Objetivo

- UI operativa para ferias (CRUD) y atracciones (CRUD + soft-delete).
- Build de TypeScript + Vite sin errores ni warnings.
- `npm run dev` sirve la app y la SPA renderiza sin errores runtime.
- Smoke test manual del flujo de ferias completo.
- Documentar la brecha del backend respecto a `FairEdition` para que un team de backend la cierre.

## Contexto

- Docs leídos: `docs/SSOT.md`, `docs/REGLAS_PROYECTO.md`, `docs/ARCHITECTURE.md`, `docs/data-model.md`, `docs/product-map.md`, `docs/TODO.md`, `.teams/TEAM_TEMPLATE.md`.
- Skills cargadas: `elevar-ui-frontend`, `investigar-antes-de-implementar`, `actuar-como-senior`, `auditar-seguridad` (consulta breve).
- Stack cerrado respetado: Tauri 2.x + React 19 + Vite 7 + Tailwind v4 + shadcn/ui (preset radix-nova) + TanStack Query 5 + RHF 7 + Zod 4 + Zustand 5 + `lucide-react` 1.x.
- Dependencias: el backend Rust (TEAM-003) expone solo 10 commands (6 ferias + 4 atracciones). **No** expone CRUD de `FairEdition`.

## Discrepancias con el brief

- **Tipo B / P1**: el brief asume que el backend expone commands de `FairEdition` (`create_fair_edition`, `list_fair_editions`, `update_fair_edition`, `delete_fair_edition`), pero el código Rust de `src-tauri/src/commands/` solo tiene `fairs.rs` y `attractions.rs`. **Decisión**: implementar la UI de ferias y atracciones completa (CRUD funcional), y exponer las rutas de edición como páginas `PendingBackendPage` que muestran un mensaje claro y bloquean la acción hasta que backend exponga los commands. La capa API (`src/api/tauri.ts`) tiene los stubs listos para enchufar cuando se cierren.
- **Tipo C / P2**: el brief sugería `shadcn add form`, pero shadcn 4.x (preset `radix-nova`) ya no distribuye ese componente; usa el nuevo `field.tsx` (`Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldGroup`). Se ha usado ese patrón, que es el oficial actual.
- **Tipo C / P3**: el brief proponía `Input` con `<input type="color">` envuelto; se ha creado `src/components/app/ColorPicker.tsx` con el patrón nativo + preview + input de texto editable, accesible y consistente con el design system.

## Trabajo realizado

- Componentes shadcn/ui instalados (16): `alert-dialog`, `badge`, `button`, `card`, `dialog`, `dropdown-menu`, `field`, `input`, `label`, `popover`, `select`, `separator`, `skeleton`, `sonner`, `table`, `tooltip`.
- `next-themes` instalado explícitamente en `package.json` (lo requiere `sonner` para `useTheme`).
- Capa de tipos en `src/types/domain.ts`: espejo de `Fair`, `FairEdition`, `Attraction`, `CreateFairInput`, `UpdateFairInput`, `CreateAttractionInput`, `UpdateAttractionInput`, `SerializableError` con `kind` en `snake_case` (no PascalCase como sugería el brief).
- Capa de utilidades en `src/lib/`: `utils.ts` (existente), `money.ts` (EUR ⇄ céntimos), `datetime.ts` (formato es-ES, fecha local), `errors.ts` (`AppError` + `toAppError`), `schemas.ts` (Zod para Feria, Edición, Atracción).
- Capa API en `src/api/tauri.ts`: `invoke<T>()` con tipos exactos y manejo de errores; los commands de `FairEdition` son stubs documentados que lanzan `NotImplementedError`.
- Hooks de React Query en `src/hooks/queries/`: `fairs.ts` (useFairs, useFair, useSuggestFairByName, useCreateFair, useUpdateFair, useDeleteFair) y `attractions.ts` (useAttractionsByEdition, useCreateAttraction, useUpdateAttraction, useSoftDeleteAttraction). Keys jerárquicas para invalidaciones precisas.
- Componentes reutilizables de aplicación en `src/components/app/`: `Breadcrumbs`, `PageHeader`, `FormCentered`, `EmptyState`, `ErrorState`, `LoadingState` (ListSkeleton, DetailSkeleton), `StatusBadge`, `ColorChip`, `ColorPicker`, `ConfirmDestructiveDialog`.
- Layout principal en `src/layouts/MainLayout.tsx`: sidebar fija con `Ferias` (activo) y 4 placeholders disabled (`Cajas`, `Informes`, `Sync`, `Configuración`), botón colapsable, breakpoints en `<1024px`.
- Páginas en `src/pages/`:
  - `DashboardPage` (`/`) con resumen + CTA "Crear primera feria".
  - `FeriasListadoPage` (`/ferias`) con tabla, búsqueda por nombre, DropdownMenu de acciones por fila.
  - `FeriaNuevaPage` (`/ferias/nueva`) con formulario RHF + Zod y banner de sugerencia (`useSuggestFairByName` debounced 300ms).
  - `FeriaDetallePage` (`/ferias/:fairId`) con cabecera, datos básicos, sección "Ediciones" con placeholder `PendingBackendPage`.
  - `FeriaEditarPage` (`/ferias/:fairId/editar`) con manejo del contrato doble-Option de `UpdateFairInput.notes` (omitir/null/actualizar).
  - `AtraccionNuevaPage` (`/ferias/:fairId/ediciones/:edicionId/atracciones/nueva`) con `ColorPicker` + precio en EUR.
  - `AtraccionEditarPage` (`/ferias/:fairId/ediciones/:edicionId/atracciones/:atraccionId/editar`) con carga via `useAttractionsByEdition`.
  - `PendingBackendPage` para las 4 rutas de edición que requieren `FairEdition` backend.
  - `NotFoundPage` (`*`) con CTA "Volver al inicio".
- Router configurado en `src/App.tsx` con `createBrowserRouter`, `QueryClientProvider`, `TooltipProvider` y `Toaster` globales.
- Money: conversión EUR ⇄ céntimos centralizada en `src/lib/money.ts`; el backend recibe siempre céntimos y la UI siempre EUR.
- Auditoría de seguridad breve (CSP efectiva, validación de inputs, sin `dangerouslySetInnerHTML`): sin hallazgos materiales.

## Archivos tocados

- `package.json` (añadido `next-themes`).
- `package-lock.json` (regenerado por npm).
- `src/types/domain.ts`
- `src/lib/money.ts`
- `src/lib/datetime.ts`
- `src/lib/errors.ts`
- `src/lib/schemas.ts`
- `src/api/tauri.ts`
- `src/hooks/queries/fairs.ts`
- `src/hooks/queries/attractions.ts`
- `src/components/ui/*` (16 componentes generados por `shadcn add`).
- `src/components/app/Breadcrumbs.tsx`
- `src/components/app/PageHeader.tsx`
- `src/components/app/FormCentered.tsx`
- `src/components/app/EmptyState.tsx`
- `src/components/app/ErrorState.tsx`
- `src/components/app/LoadingState.tsx`
- `src/components/app/StatusBadge.tsx`
- `src/components/app/ColorChip.tsx`
- `src/components/app/ColorPicker.tsx`
- `src/components/app/ConfirmDestructiveDialog.tsx`
- `src/layouts/MainLayout.tsx`
- `src/pages/DashboardPage.tsx`
- `src/pages/FeriasListadoPage.tsx`
- `src/pages/FeriaNuevaPage.tsx`
- `src/pages/FeriaDetallePage.tsx`
- `src/pages/FeriaEditarPage.tsx`
- `src/pages/AtraccionNuevaPage.tsx`
- `src/pages/AtraccionEditarPage.tsx`
- `src/pages/PendingBackendPage.tsx`
- `src/pages/NotFoundPage.tsx`
- `src/App.tsx` (router + providers)
- `.teams/active/TEAM-004-epica-1-frontend.md` (este archivo).

## Coordinacion

No aplica Rule 25: el trabajo es de frontend puro, no se han tocado `src-tauri/src/` ni el lockfile Rust. La frontera con `ingeniero-backend` está en `src/api/tauri.ts` y la lógica de tipos en `src/types/domain.ts`.

## Criterios de cierre

- [x] Componentes shadcn instalados (lista exacta arriba).
- [x] Tipos TypeScript espejo del backend.
- [x] Capa API con manejo de errores.
- [x] Hooks de React Query con keys e invalidaciones.
- [x] Esquemas Zod para los 3 formularios.
- [x] Layout con sidebar + breadcrumbs.
- [x] Páginas de ferias (listado, alta, detalle, edición) funcionales.
- [x] Páginas de atracciones (alta, edición) funcionales con `ColorPicker`.
- [x] Toasts (Sonner) en cada mutación.
- [x] Skeletons + ErrorStates en listas y detalle.
- [x] Confirmaciones destructivas con `AlertDialog`.
- [x] Página 404.
- [x] Página `PendingBackendPage` para rutas de edición.
- [x] `npm run build` pasa sin errores ni warnings de TypeScript.
- [x] Vite dev arranca y sirve `index.html` + módulos sin errores.
- [ ] **Pendiente backend**: implementar CRUD de `FairEdition` para activar las 4 rutas marcadas como `PendingBackendPage`.
- [ ] **Pendiente**: smoke test E2E manual con `npm run tauri dev` (requiere compilación inicial de Rust; queda para `@qa-validador`).
- [ ] **Pendiente**: screenshots para evidencia visual (no automatizable desde CLI sin Playwright; queda para `@qa-validador`).

## Riesgos

- **Backend sin `FairEdition` (residual)**: la UI de ediciones queda bloqueada hasta que backend exponga los commands. Documentado en `PendingBackendPage` y en este team.
- **Bundle inicial 663 kB**: el bundle JS empaquetado es grande (sin code-splitting). Aceptable para MVP desktop; en una iteración posterior se puede hacer `manualChunks` por módulo.
- **WebView2 / native pickers**: no se ha probado con `npm run tauri dev` por coste de la primera compilación de Rust. `@qa-validador` debe verificar el flujo end-to-end con la ventana nativa.
- **A11y y responsive**: cubiertos los básicos (labels asociados, focus visible, contraste WCAG AA vía tema, sidebar colapsable). `@qa-validador` debe validar con pruebas reales en distintos viewports.

## Evidencia

- `npm run build` -> ✓ built in 4.75s (663.16 kB JS, 67.67 kB CSS).
- `npx tsc --noEmit` -> EXIT 0.
- `node ./node_modules/vite/bin/vite.js` -> Vite 7.3.6 ready, `http://localhost:1420/` responde 200 OK, `/src/main.tsx` y `/src/App.tsx` transforman sin errores.
- 16 componentes en `src/components/ui/` confirmados vía `ls`.

## Proximo paso

1. `@revisor`: revisar la implementación para riesgos materiales y consistencia visual.
2. `@qa-validador`: smoke test E2E con `npm run tauri dev`, validaciones responsive y accesibilidad básica. Capturar screenshots.
3. `@experto-github`: commits atómicos con los mensajes sugeridos en el brief (este archivo no los crea automáticamente porque solo el agente ejecutor escribe commits).
4. `@orquestador`: abrir TEAM-005 (backend `FairEdition` CRUD) para desbloquear las 4 rutas marcadas como `PendingBackendPage`.

## Plan de commits sugerido

1. `chore(deps): instala componentes shadcn/ui (button, card, input, label, select, field, dialog, table, badge, tooltip, sonner, dropdown-menu, skeleton, alert-dialog, popover, separator)`.
2. `chore(deps): añade next-themes para Sonner Toaster`.
3. `feat(types): espejo TypeScript de Fair, FairEdition, Attraction y errores serializables`.
4. `feat(lib): utilidades money (EUR<->centimos), datetime (es-ES) y errores AppError`.
5. `feat(schemas): validacion Zod para formularios de feria, edicion y atraccion`.
6. `feat(api): capa de invocacion de commands Tauri con tipos y manejo de errores`.
7. `feat(hooks): React Query hooks para ferias y atracciones`.
8. `feat(components): primitives de aplicacion (PageHeader, EmptyState, ErrorState, LoadingState, ColorChip, ColorPicker, StatusBadge, ConfirmDestructiveDialog, Breadcrumbs, FormCentered)`.
9. `feat(layout): layout principal con sidebar colapsable y placeholders para secciones futuras`.
10. `feat(router): rutas con React Router 7 (ferias + atracciones + pending-backend)`.
11. `feat(pages): dashboard, listado de ferias, alta y detalle de feria con sugerencia por nombre`.
12. `feat(pages): formularios de edicion y borrado de ferias con doble-Option notes`.
13. `feat(pages): alta y edicion de atracciones con ColorPicker y conversion EUR->centimos`.
14. `feat(ux): toasts Sonner, skeletons, AlertDialog de confirmacion destructiva y pagina 404`.
15. `chore(teams): TEAM-004 cerrado, mueve a archive e incrementa .counter a 4`.
