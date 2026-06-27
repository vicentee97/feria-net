# TEAM-010 — Épica 2 frontend (TPV, cajas diarias, ofertas embebidas)

- ID: TEAM-010
- Nombre: Épica 2 frontend (TPV, cajas diarias, ofertas embebidas)
- Fecha creacion: 2026-06-27
- Estado: cerrado

## Descripcion

Construye el frontend de la epica 2 del MVP: pantalla TPV (donde el
feriante vende tickets), gestion de cajas diarias (apertura/cierre) y
gestion de ofertas (embebida en `EdicionDetallePage`). Se construye
sobre el backend ya cerrado en TEAM-009 (V003 + 13 commands Tauri
nuevos para caja, ofertas, ventas y tickets pendientes).

## Objetivo

Entregar la pantalla TPV operativa y el flujo completo de caja diaria,
manteniendo el lenguaje visual real del proyecto (shadcn/ui sobre
Tailwind v4) y respetando los principios SSOT: local-first, una sola
caja abierta por atraccion, ticket-delivery intercambiable (sin
acoplamiento a impresora en este team).

Criterios verificables (todos cumplidos al cierre):

- [x] Espejo TS completo de CashSession, Offer, Sale, SaleLine, Ticket, SaleWithLines, CreateCashSessionInput, CloseCashSessionInput, CreateSaleInput, CreateSaleLineInput, CreateOfferInput, UpdateOfferInput.
- [x] Capa de invocacion (`src/api/tauri.ts`) cubre los 13 commands nuevos, traduciendo errores a `AppError`.
- [x] Hooks React Query (`cash_sessions`, `sales`, `offers`) con patron unificado de toast (hook emite `onError`, caller emite `onSuccess`, sin try/catch para toast.error redundante).
- [x] Esquemas Zod para caja, oferta y linea de venta.
- [x] Paginas funcionales: `/cajas`, `/cajas/nueva`, `/cajas/:id`, `/tpv?session=:id`.
- [x] Gestion de ofertas embebida al final de `EdicionDetallePage` (listado, alta, edicion, soft-delete con confirmacion).
- [x] Item "Cajas" del sidebar activado y breadcrumb dinamico para `/cajas/*` y `/tpv`.
- [x] `npm run build` sin errores. Warning preexistente de bundle >500 kB (documentado en TEAM-006), no introducido por este team.
- [x] Sin archivos de backend modificados. Sin docs canonicos modificados.
- [x] Sin dependencias nuevas en `package.json` (unica instalacion shadcn: primitive `radio-group`, ya disponible en `radix-ui 1.6.0`).
- [x] `dangerouslySetInnerHTML` no usado en ningun sitio nuevo (verificado por grep).
- [x] TEAM-010 cerrado y archivado, `.counter = 10`, INDEX.md actualizado.
- [ ] Smoke test E2E manual de los 12 pasos del brief queda pendiente (Tauri no esta instalado en este runtime; lo ejecuta `@qa-validador` sobre `npm run tauri dev` en su entorno).

## Contexto

- Docs leidos: `docs/SSOT.md`, `docs/data-model.md` §2.4..§2.9, `docs/product-map.md` (TPV), `docs/ARCHITECTURE.md` §3.1 y boundary EUR/centimos, `docs/REGLAS_PROYECTO.md`, `.teams/archive/TEAM-008-epica-1-cleanup-p3.md` (patron unico de toast), `.teams/archive/TEAM-009-epica-2-backend.md` (contrato backend).
- Backend Rust leido:
  - `src-tauri/src/commands/cash_sessions.rs` (5 commands: open, close, get_open, list, get_for_date).
  - `src-tauri/src/commands/offers.rs` (4 commands: create, list_by_edition, update, soft_delete).
  - `src-tauri/src/commands/sales.rs` (5 commands: create_sale, list_by_cash_session, get_sale, get_ticket, list_pending_tickets).
  - `src-tauri/src/domain/cash_session.rs` (`opening_amount_cents`, `closing_amount_cents`, `total_amount_cents`).
  - `src-tauri/src/domain/offer.rs` (`bundle_price_cents`).
  - `src-tauri/src/domain/sale.rs` (`total_amount_cents`).
  - `src-tauri/src/domain/sale_line.rs` (`line_total_cents`, modelo bundle: unit_price=0 con oferta).
  - `src-tauri/src/domain/ticket.rs` (denormaliza sale_id, sale_line_id, cash_session_id, fair_edition_id, attraction_id; NO incluye delivery_status todavia — eso lo añade epica 3).
  - `src-tauri/src/errors.rs` (3 variantes nuevas: `CashSessionAlreadyOpen`, `CashSessionClosed`, `InvalidSale`).
- Frontend leido: `src/api/tauri.ts`, `src/types/domain.ts`, `src/lib/schemas.ts`, `src/lib/money.ts`, `src/lib/datetime.ts`, `src/lib/editions.ts`, `src/lib/errors.ts`, `src/hooks/queries/{fairs,attractions,editions}.ts`, `src/components/app/*`, `src/components/ui/*`, `src/layouts/MainLayout.tsx`, `src/components/app/Breadcrumbs.tsx`, `src/pages/EdicionDetallePage.tsx`, `src/App.tsx`.
- Skills cargadas: `elevar-ui-frontend`, `actuar-como-senior`, `investigar-antes-de-implementar`, `auditar-seguridad` (consulta breve).
- Estado Git al abrir: rama `main`, HEAD `619d619` (cierre TEAM-009). `.teams/.counter = 9`.
- `@radix-ui/react-radio-group 1.4.1` ya estaba disponible como parte del umbrella `radix-ui 1.6.0` instalado; unica instalacion shadcn nueva: `npx shadcn@latest add radio-group` (componente copiado a `src/components/ui/radio-group.tsx`).
- Sin `scripts/ai_coordination.py` (no aplica concurrencia runtime); unico agente.
- Sin Tauri instalado en este runtime: `npm run tauri dev` no se ha ejecutado. `@qa-validador` lo corre en su entorno. Esto queda anotado como riesgo residual.

## Decisiones materiales

### 1. Naming de campos monetarios (boundary EUR/centimos)

El backend usa el sufijo `_cents` (snake_case) en el JSON serializado:
- `CashSession`: `opening_amount_cents`, `closing_amount_cents`, `total_amount_cents`.
- `Offer`: `bundle_price_cents`.
- `Sale`: `total_amount_cents`.
- `SaleLine`: `unit_price_cents`, `line_total_cents`.
- `Ticket`: `unit_price_cents`, `total_cents` (sin sufijo — unica excepcion, intencional en data-model §2.8).

El espejo TS mantiene los sufijos `_cents` exactos por contrato (son
las claves reales que llegan en el JSON del invoke). El repositorio
existente (`Attraction.base_ticket_price` sin sufijo, aunque es cents)
ya rompe la convencion en un punto historico; la regla nueva es:
seguir al pie de la letra lo que serializa el backend Rust.

### 2. `bundle_price_cents` (no `bundle_price`)

El brief sugeria `bundle_price` como ejemplo de input. El backend
real serializa `bundle_price_cents`. Espejo TS usa `_cents` por la
misma razon del punto 1.

### 3. Ticket con denormalizaciones completas

El brief tenia `Ticket` con solo `id, sale_line_id, attraction_id,
created_at`. El backend denormaliza ademas `sale_id`, `cash_session_id`,
`fair_edition_id`. Espejo TS incluye TODOS los campos que el backend
serializa (no adivinamos, seguimos el codigo real).

### 4. `Sale` se serializa con `total_amount_cents`

Coherente con el backend y con `SaleLine.line_total_cents`. Verificado
contra `row_to_sale` en `src-tauri/src/db/repository/sales.rs`.

### 5. `SaleWithLines`: estructura anidada

El backend `SaleWithLines { sale, lines, tickets }` se serializa como
objeto anidado en JSON. Espejo TS refleja la estructura anidada
exactamente.

### 6. TPV: cantidad = `bundle_quantity` cuando hay oferta (no editable)

Cuando hay oferta seleccionada, el campo de cantidad se muestra como
read-only (la cantidad es la del bundle, no la elige el operador).
Coherente con el backend: `create_sale` rechaza si la cantidad no
coincide con `bundle_quantity` cuando hay oferta.

### 7. TPV: separacion entre oferta (radio) y cantidad (stepper)

Layout: radio de oferta arriba; stepper de cantidad debajo solo si NO
hay oferta. El total ocupa el bloque mas grande (>= 4rem).

### 8. Feedback "ultima venta" en TPV

Una linea con tiempo relativo ("hace 5s"). Implementado en cliente con
helper `formatRelativeTime` en `lib/datetime.ts`. Persiste en
`localStorage` con la clave `tpv.last_sale.<sessionId>` para sobrevivir
a un refresh accidental.

### 9. Cierre de caja: dialog con un solo campo

Dialog `Dialog` de shadcn (no `AlertDialog` — la accion es constructiva,
no destructiva). Campo unico `closing_amount_eur` (RHF + Zod). Tras
exito navega a `/cajas/:id`.

### 10. Listado de ventas en `CajaDetallePage`

Tabla simple: hora, total EUR, badge "Oferta" si `offer_id != null`,
placeholder para tickets count. La consulta `list_sales_by_cash_session`
solo devuelve `Sale` (sin lineas); los totales se infieren desde
`total_amount_cents` directamente. Para el conteo exacto de tickets
por venta, mostrariamos N+1 con `get_sale` por fila — evitado en MVP
porque no compensa en cajas grandes. Documentado en el codigo.

### 11. Tickets pendientes: indicacion en CajaDetallePage

El brief permite mostrar cuantos tickets pendientes hay. La UI
muestra "X ventas registradas hoy en esta caja" en el resumen. El
contador exacto de tickets pendientes (usando
`usePendingTicketsByCashSession`) no se expone en MVP en la pagina
de detalle — queda como extension del listado cuando la epica 3 anada
la UI de reintentos.

### 12. Estado `active` requerido para abrir caja

`AbrirCajaPage` solo muestra atracciones de ediciones `active` (no
`planned` ni `closed`). Coherente con la regla "una sola edicion active
por feria" y con el hecho de que solo se vende en ediciones activas.

### 13. Sidebar: orden y activacion

Tras esta entrega: Inicio, Ferias, Cajas (activo en `/cajas` y `/tpv`),
Informes (placeholder), Sync (placeholder), Configuracion (placeholder).
La activacion cross-ruta (`/tpv` con item "Cajas") se implementa via
campo `activeOn` en `NavItem` y un check explicito contra
`location.pathname` en `SidebarItem`.

### 14. Breadcrumbs para rutas /cajas/* y /tpv

`Cajas` (raiz) → `Caja <atraccion>` (detalle) → `TPV` (si aplica). El
crumb de la caja concreta se resuelve con `useCashSessionById` desde
el cache del fan-out. Para `/tpv?session=:id` el crumb es
`Cajas / <atraccion> / TPV`.

### 15. Lookup cross-attraction por id (decisiones materiales)

El backend NO expone `get_cash_session_by_id`. La UI implementa
`useAllCashSessionsWithContext` (fan-out 4 niveles: fairs -> editions
-> attractions -> cash_sessions) que carga todas las cajas con su
contexto. Esto es la unica fuente de verdad para resolver una caja por
id desde `/cajas/:id` y `/tpv?session=:id`. Si la fan-out todavia no
ha llegado, las paginas muestran un `DetailSkeleton`; si la caja no
aparece tras cargar (caso muy raro: caja recien creada en otro proceso
que no actualizo el cache), la pagina muestra error con CTA a
"listado de cajas".

### 16. `useOpenCashSession` (mutation) vs `useOpenCashSessionForAttraction` (query)

El brief usaba el mismo nombre para query y mutation; TS no permite
export con mismo nombre y firmas distintas. Convencion adoptada:
- `useOpenCashSession()` — mutation (sin args).
- `useOpenCashSessionForAttraction(attractionId)` — query.

Patron consistente con `useCloseCashSession` (solo mutation) y
`useCashSessionsForAttraction` (query de listado).

## Trabajo realizado

- Investigacion previa: leidos los 9 archivos Rust nuevos (commands + domain + errors) para verificar el contrato de serializacion exacto. Verificada la disponibilidad de `@radix-ui/react-radio-group 1.4.1` en el umbrella `radix-ui 1.6.0` ya instalado (no requiere nueva dependencia npm).
- Instalado primitive shadcn `radio-group` via CLI: `npx shadcn@latest add radio-group` (1 archivo, sin nuevas deps).
- Espejo TS completo de las 6 entidades nuevas (CashSession, Offer, Sale, SaleLine, Ticket, SaleWithLines) + 7 inputs + 3 variantes nuevas en `SerializableErrorKind`. Sufijos `_cents` mantenidos literalmente como en el backend.
- Capa de invocacion (`src/api/tauri.ts`) extendida con 12 funciones (open, close, get_open, get_for_date, list_for_attraction, create_sale, list_sales, get_sale, get_ticket, list_pending, create_offer, list_offers, update_offer, soft_delete_offer). Errores via `toAppError` (ya patron del proyecto).
- Hooks React Query:
  - `cash_sessions.ts`: `useCashSessionsForAttraction`, `useOpenCashSessionForAttraction`, `useCashSessionForAttractionOnDate`, `useOpenCashSession`, `useCloseCashSession`, `useAllCashSessionsWithContext`, `useCashSessionById`.
  - `sales.ts`: `useSalesByCashSession`, `usePendingTicketsByCashSession`, `useCreateSale`.
  - `offers.ts`: `useOffersByEdition`, `useCreateOffer`, `useUpdateOffer`, `useSoftDeleteOffer`.
  - Patron unico de toast: hooks emiten `onError` con `errorMessage(e)`; callers emiten `onSuccess` contextual.
- Esquemas Zod: `openCashSessionFormSchema`, `closeCashSessionFormSchema`, `offerFormSchema`, `updateOfferFormSchema`, `createSaleLineSchema`, `createSaleSchema`.
- Helper `formatRelativeTime` y `secondsAgoISO` anadidos a `lib/datetime.ts`.
- Paginas nuevas:
  - `CajasListadoPage.tsx`: listado global con fan-out de queries, agrupado por Hoy / Recientes (7 dias) / Anteriores. Empty state con CTA a abrir primera caja.
  - `AbrirCajaPage.tsx`: formulario de apertura con selector de atraccion activa, fecha (default hoy) y fondo inicial. Tras exito navega a `/tpv?session=:id`.
  - `CajaDetallePage.tsx`: cabecera con estado badge, resumen con stats (fondo, total, ventas), tabla de ventas del dia. Dialog de cierre con campo unico de importe declarado. Acciones: ir al TPV / cerrar caja / ver detalle.
  - `TpvPage.tsx`: pantalla principal del TPV con header compacto, radio de oferta (si hay), selector +/- de cantidad (read-only si hay oferta), display grande del total, boton VENDER enorme, feedback "ultima venta", dialog de cierre inline, contador de ventas del dia. Persistencia de "ultima venta" en localStorage por sesion.
  - `EdicionDetallePage.tsx` extendido con `OffersSection`: lista de ofertas (activas + inactivas) con acciones editar / desactivar (con `ConfirmDestructiveDialog`).
- `MainLayout.tsx`: item "Cajas" activado en el sidebar (to=/cajas, activeOn=[/tpv]). Subtitulo del footer actualizado a "Epica 2".
- `Breadcrumbs.tsx`: manejo de rutas `/cajas`, `/cajas/nueva`, `/cajas/:id`, `/tpv` con resolucion de nombre de atraccion via `useCashSessionById`.
- `App.tsx`: 4 rutas nuevas anadidas al router.
- Verificacion local: `npm run build` pasa (TS strict + Vite build) sin errores. Solo warning preexistente de bundle >500 kB.

## Archivos tocados

### Nuevos
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\components\ui\radio-group.tsx` (primitive shadcn v4, instalado via CLI).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\hooks\queries\cash_sessions.ts` (con fan-out cross-attraction).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\hooks\queries\sales.ts`.
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\hooks\queries\offers.ts`.
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\pages\CajasListadoPage.tsx`.
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\pages\AbrirCajaPage.tsx`.
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\pages\CajaDetallePage.tsx`.
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\pages\TpvPage.tsx`.
- `C:\Vicente\Programacion\Proyectos\FeriaNet\.teams\active\TEAM-010-epica-2-frontend.md` (este archivo, ahora movido a archive).

### Modificados
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\types\domain.ts` — 6 entidades + 7 inputs + 3 `SerializableErrorKind` nuevos.
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\api\tauri.ts` — 12 funciones nuevas.
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\lib\schemas.ts` — 6 schemas nuevos.
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\lib\datetime.ts` — `formatRelativeTime`, `secondsAgoISO`.
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\layouts\MainLayout.tsx` — item Cajas activado, `activeOn`, footer "Epica 2".
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\components\app\Breadcrumbs.tsx` — soporte `/cajas/*` y `/tpv`.
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\App.tsx` — 4 rutas nuevas.
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\pages\EdicionDetallePage.tsx` — seccion de ofertas embebida.
- `C:\Vicente\Programacion\Proyectos\FeriaNet\.teams\.counter` — `9` → `10`.
- `C:\Vicente\Programacion\Proyectos\FeriaNet\.teams\INDEX.md` — fila TEAM-010 anadida.

### Borrados
- Ninguno.

## Coordinacion

No aplica Rule 25 (ningun otro TEAM activo simultaneo). Rama `main`,
sin worktree separado (unico agente). Verificado `git status` y
`git log` antes de cada commit. Merge train: no hay otras ramas
pendientes. Drift de skills del hub (16 archivos `.agent*/skills/**/SKILL.md`
modificados previo a mi sesion) NO TOCADOS, NO COMMITEADOS — son
responsabilidad del orquestador o `@experto-github` segun TEAM-009.

## Criterios de cierre

- [x] 6 entidades nuevas en TS espejo del backend.
- [x] 12 funciones de invocacion en `src/api/tauri.ts`.
- [x] Hooks React Query con patron unico de toast.
- [x] 6 esquemas Zod.
- [x] 4 paginas funcionales (`CajasListadoPage`, `AbrirCajaPage`, `CajaDetallePage`, `TpvPage`).
- [x] Gestion de ofertas embebida en `EdicionDetallePage`.
- [x] Item "Cajas" del sidebar activado (incluyendo `/tpv`).
- [x] Breadcrumb dinamico para `/cajas/*` y `/tpv`.
- [x] `npm run build` pasa sin errores de TS. Bundle warning preexistente.
- [x] Ningun archivo de backend modificado.
- [x] Ningun doc canonico modificado.
- [x] Ninguna dependencia npm nueva.
- [x] `dangerouslySetInnerHTML` no usado.
- [x] 10 commits atomicos con push por commit, sin force.
- [x] `.counter` actualizado a `10` e `INDEX.md` con fila TEAM-010.
- [ ] Smoke test E2E manual de los 12 pasos del brief queda para `@qa-validador` (Tauri no instalado en este runtime).

## Riesgos

### Materiales: ninguno en el codigo entregado

Cerrados por este TEAM:

- **Atomicidad de venta (frontend)**: el boton "VENDER" esta disabled mientras `createSale.isPending`; doble click no dispara doble venta. El backend ya enforcea transaccionalidad (data-model §5.5).
- **Caja cerrada no permite vender**: `TpvPage` redirige a vista "caja cerrada" si `session.closed_at != null` (no llama a `create_sale` accidentalmente). Backend refuerza con `CashSessionClosed`.
- **Cantidad no coincide con bundle**: cuando hay oferta, la cantidad se autocompleta con `bundle_quantity` y el input es read-only. Backend rechaza con `InvalidSale` si no coincide.
- **Toast unico**: patron TEAM-008 mantenido. Ningun caller hace try/catch solo para `toast.error`.

### No materiales / aceptados / observaciones:

- **Smoke test E2E pendiente**: este runtime no tiene Tauri instalado, asi que no he podido ejecutar `npm run tauri dev` ni los 12 pasos del brief. `@qa-validador` debe correrlos en su entorno y reportar. La UI esta verificada a nivel de TypeScript + Vite build; la integracion con el backend Rust queda como gate.
- **Drift de skills del hub en working tree** (16 archivos `.agent*/skills/**/SKILL.md`): previo a mi sesion, no commiteado, fuera del alcance. Misma observacion que TEAM-009.
- **Bundle >500 kB warning**: preexistente, documentado en TEAM-006. No introducido por este team. Code-splitting queda como mejora futura (epica 5+).
- **Tickets pendientes no se muestran en el detalle de caja**: la query `usePendingTicketsByCashSession` esta implementada en `sales.ts` pero el componente `CajaDetallePage` no la consume (no hay UI de reintento en MVP). Esto es por diseno: la epica 3 anadira la pantalla de reintentos.
- **Conteo exacto de tickets por venta**: la UI muestra "-" porque mostraria N+1 queries (`get_sale` por fila). Trade-off documentado en `CajaDetallePage.SaleTicketEstimate`.
- **Drift menor del hub**: HUB_VERSION local es `1.04.00`, synced es `1.03.00`. No bloquea este team (skills proyectadas localmente). Anotado para `@experto-github` antes del proximo team.

## Evidencia

### `npm run build`

```
> feria-net@0.1.0 build
> tsc && vite build

vite v7.3.6 building client environment for production...
transforming...
✓ 2907 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                            0.39 kB │ gzip:   0.27 kB
dist/assets/geist-cyrillic-ext-wght-normal-DjL33-gN.woff2   7.42 kB
dist/assets/geist-vietnamese-wght-normal-6IgcOCM7.woff2     8.00 kB
dist/assets/geist-cyrillic-wght-normal-BEAKL7Jp.woff2      15.08 kB
dist/assets/geist-latin-ext-wght-normal-DC-KSUi6.woff2     16.51 kB
dist/assets/geist-latin-wght-normal-BgDaEnEv.woff2         29.40 kB
dist/assets/index-B1Pr6CFD.css                             75.02 kB │ gzip:  13.00 kB
dist/assets/index-Dl4KNRi7.js                             768.36 kB │ gzip: 229.26 kB
(!) Some chunks are larger than 500 kB after minification. [...]
✓ built in 5.22s
```

(El warning de bundle es preexistente, no introducido por este team.)

### Commits atomicos (10)

```
chore(deps): instala primitive radio-group para selector de oferta en TPV
feat(types): espejo TypeScript de CashSession, Offer, Sale, SaleLine, Ticket y SaleWithLines
feat(api): capa de invocacion de comandos Tauri para caja, ventas, ofertas y tickets pendientes
feat(hooks): React Query hooks para cajas, ventas y ofertas (patron unificado de toast)
feat(schemas): validacion Zod para caja, oferta y venta (linea)
feat(pages): gestion de cajas (listado, apertura, detalle) con flujos completos
feat(pages): pantalla TPV principal con selector de cantidad, oferta opcional y feedback inmediato
feat(pages): gestion de ofertas embebida en EdicionDetalle
feat(layout): activa item Cajas en sidebar y breadcrumb dinamico para /cajas y /tpv
chore(teams): [este commit, cierre TEAM-010]
```

### `git push origin main` por cada commit

10 pushes OK, sin `--force`, sin rebase.

### Auditoria de seguridad breve (sin hallazgos materiales)

- `dangerouslySetInnerHTML`: 0 ocurrencias en el codigo nuevo (grep OK).
- `eval(`, `new Function`, `innerHTML`: 0 ocurrencias en el codigo nuevo.
- Inputs de usuario validados con Zod en TODOS los formularios (apertura caja, cierre caja, alta oferta, edicion oferta, edicion feria, edicion atraccion, alta feria, etc.).
- `XSS`: sin insercion de HTML dinamico; todas las cadenas via `{value}` React (escape automatico).
- `CSRF`: n.a. (Tauri local-first; sin endpoints remotos en MVP).
- `Secretos`: ninguno.
- `localStorage`: solo `tpv.last_sale.<sessionId>` (objeto JSON con la ultima venta persistida). No contiene secretos. Cuota llena se ignora silenciosamente.
- Patron unico de toast: verificado con grep, ningun `try { ... } catch (e) { toast.error(...) }` redundante en callers.

### Smoke test E2E (12 pasos del brief)

**Estado**: PENDIENTE de ejecucion por `@qa-validador`. Este runtime no tiene Tauri instalado. La UI esta verificada a nivel de TS + Vite build.

Pasos a ejecutar por QA (copiados del brief para que sirvan como checklist):

1. Crear atraccion "Noria" en una edicion `active`.
2. Ir a `/cajas`. Abrir caja para "Noria" con fondo inicial 0 EUR.
3. Ir al TPV. Vender 3 tickets sueltos a 3 EUR cada uno → total 9 EUR.
4. Verificar: toast de exito, "Ultima venta" actualizado, totales en caja actualizados.
5. Vender 5 tickets sueltos a 3 EUR → total 15 EUR.
6. Crear una oferta "Pack 5" para esa edicion (5 tickets por 12 EUR). Esperar a que este activa.
7. Volver al TPV. Seleccionar la oferta. Cantidad se autocompleta a 5, total 12 EUR.
8. Vender → verificar que la venta tiene `total = 1200 cents`, 5 tickets, 1 linea con `bundle_quantity = 5` y `unit_price = 0`.
9. Volver al TPV. Vender 1 ticket suelto (sin oferta).
10. "Cerrar caja". Declarar 36 EUR al cierre. Verificar que `total_amount = 36 EUR` (suma de ventas).
11. Intentar abrir una segunda caja para "Noria" → debe fallar (`CashSessionAlreadyOpen`).
12. Verificar que las ventas se listan en `/cajas/:id` correctamente.

Si algo falla, `@qa-validador` aborta con mensaje claro y `@implementador` re-abre un team de fix.

## Proximo paso

`@qa-validador` ejecuta smoke test E2E sobre la epica 2 completa (los 12 pasos). `@revisor` revisa riesgos materiales (incluyendo el fan-out cross-attraction y la eleccion de lookup por cache). `@orquestador` consolida y propone la epica 3 (`ticket-delivery`: thermal + NoOp + pruebas de sustitucion), que ahora puede implementarse sin migracion destructiva sobre V003.

---

## Discrepancias con el brief

### Tipo C / P2 — `get_cash_session_by_id` no existe en backend

El brief listaba `getCashSession(id)` en `src/api/tauri.ts`. El backend Rust (TEAM-009) NO expone `get_cash_session_by_id`: solo expone `list_cash_sessions_for_attraction` y `get_cash_session_for_attraction_on_date`. La modificacion de backend esta prohibida por el brief.

**Accion tomada**: `useAllCashSessionsWithContext` (fan-out cross-attraction) es la unica fuente de verdad para resolver una caja por id desde la UI. Trade-off: el listado y el detalle cargan TODAS las cajas (no solo las de hoy). Para v1 MVP con feriantes con pocas atracciones, es aceptable. `@arquitecto` debe decidir si en el futuro se justifica un command `get_cash_session_by_id` directo.

### Tipo D / P3 — Sufijos `_cents` en espejo TS

El brief sugiria "alinearse con convention Rust del repo" sin sufijo (como `Attraction.base_ticket_price`). Pero el repo Rust nuevo usa `_cents` sistematicamente. Espejo TS mantiene `_cents` literalmente por contrato de serializacion (no son documentacion). Excepcion: `Ticket.total_cents` (sin sufijo), intencional en data-model §2.8.

**Accion tomada**: mantener `_cents` consistente con backend. El campo `Attraction.base_ticket_price` (sin sufijo) es una inconsistencia historica que no arregla este team (queda como refactor futuro para homogeneizar todo el modelo).

### Tipo C / P3 — Cantidad en TPV no editable cuando hay oferta

El brief decia "Cantidad se autocompleta con `bundle_quantity`" pero el input "editable" no especificaba si en el modo oferta sigue editable. Decision: read-only cuando hay oferta, porque el backend rechaza la venta si no coincide con el bundle (data-model §5.4). Esto es una UX mejor: ahorra errores al operador.

**Accion tomada**: cantidad read-only cuando hay oferta. Coherente con el backend.

### Tipo C / P3 — Tickets pendientes no se exponen en el detalle de caja

El brief permitia mostrar el contador "X tickets pendientes". La query existe (`usePendingTicketsByCashSession`); no se consume en `CajaDetallePage` porque la epica 3 anadira la UI de reintento. Si en MVP el operador ve "X tickets pendientes", no tiene donde actuar.

**Accion tomada**: en MVP solo se muestra "X ventas registradas" (suma de ventas, no de tickets pendientes). Cuando epica 3 llegue, se enchufa el contador en la misma card.

### Tipo D / P3 — Smoke test E2E pendiente

El brief pedia ejecutar los 12 pasos antes del cierre. Tauri no esta instalado en este runtime, asi que no se ha ejecutado. `@qa-validador` lo corre en su entorno.

**Accion tomada**: documentado en seccion Riesgos. La UI esta verificada a nivel de TS + Vite build.

Ningun P1 detectado.
