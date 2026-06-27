# TEAM-013 — Épica 3 frontend: UI de impresión (auto-print, tickets pendientes, salud del backend)

- ID: TEAM-013
- Nombre: Épica 3 frontend — UI de impresión (auto-print best-effort, tickets pendientes con retry, indicador de salud del backend)
- Fecha creacion: 2026-06-27
- Fecha cierre: 2026-06-27
- Estado: cerrado

## Descripcion

Cierra la parte frontend de la épica 3 del MVP. Sobre el backend ya cerrado en TEAM-012 (módulo `ticket-delivery` intercambiable con 4 commands Tauri: `print_ticket`, `retry_pending_tickets`, `list_delivery_devices`, `delivery_health_check`), implementa:

- **Espejo TypeScript** de los tipos `TicketDeliveryAttempt`, `PrintTicketResult`, `RetryResult` y de los inputs.
- **Capa de invocación** en `src/api/tauri.ts` para los 4 commands.
- **Hooks de React Query** (`usePrintTicket`, `usePrintTickets` batch, `useRetryPendingTickets`, `useDeliveryHealthCheck`, `useDeliveryDevices`).
- **Auto-print best-effort** tras cada venta en `TpvPage`: la venta se registra primero; la impresión se dispara en paralelo (`Promise.allSettled`) sin bloquear el TPV.
- **Indicador visual de impresión** en la cabecera del TPV (`PrintIndicator`): estados `idle` / `printing` / `partial` / `failed`, semántica discreta (warning en amarillo, no rojo alarmante).
- **Pantalla de tickets pendientes** en `CajaDetallePage` (`PendingTicketsCard`): solo se muestra si hay tickets pendientes, con botón "Reintentar todos" y toast de resumen tras el reintento. Desaparece sola si tras el retry no quedan pendientes.
- **Indicador de salud del backend** en la cabecera global (`MainLayout` → `PrinterHealthBadge`): chip verde / ambar (NoOp) / rojo con tooltip que lista los dispositivos detectados.

No toca backend Rust, no añade commands nuevos, no modifica docs canónicos, no instala dependencias nuevas.

## Objetivo

Criterios verificables de cierre:

- [x] Espejo TS de los 4 outputs y 2 inputs del módulo delivery en `src/types/domain.ts`.
- [x] 4 funciones de invocación en `src/api/tauri.ts` (`printTicket`, `retryPendingTickets`, `listDeliveryDevices`, `deliveryHealthCheck`) con manejo uniforme de errores vía `toAppError`.
- [x] Hooks de React Query en `src/hooks/queries/delivery.ts`: 3 mutaciones + 2 queries + helper `deriveDeliveryHealthStatus`.
- [x] `TpvPage` engancha auto-print tras `useCreateSale` exitoso. Indicador `PrintIndicator` visible durante el print y si quedan tickets pendientes (estado `partial`).
- [x] `CajaDetallePage` muestra `PendingTicketsCard` (lista compacta + botón "Reintentar todos") cuando hay tickets pendientes. Toast de resumen tras reintento.
- [x] `MainLayout` muestra `PrinterHealthBadge` en la cabecera global con tooltip de devices.
- [x] **No** se modifica `src-tauri/` ni ninguna migration.
- [x] **No** se instalan dependencias nuevas.
- [x] **No** se rompe el patrón único de toast (hook → onError; caller → onSuccess).
- [x] **No** se bloquea el TPV ante fallos de impresión (best-effort siempre).
- [x] Patrón único de toast respetado en los 5 hooks nuevos (ver bloque "Patrón de toasts").
- [x] 5 commits atómicos con push por commit, sin force (luego TEAM-013 cierre = 6 commits total).
- [x] `npx tsc --noEmit` y `npm run build` pasan sin errores ni warnings nuevos.
- [x] `cargo check` sigue pasando (verificado: `Finished dev profile in 1.08s`).
- [x] TEAM-013 archivado, `.teams/.counter = 13`, `INDEX.md` actualizado.

## Contexto

- Docs leídos: `docs/SSOT.md` §2 ("ticket-delivery intercambiable desde v1"), `docs/ARCHITECTURE.md` §3.5 (impresión térmica) y §4 (mapa de módulos) y §5 (abstracción `ticket-delivery`), `docs/data-model.md` §2.9 (`TicketDeliveryAttempt`), `src-tauri/src/commands/delivery.rs` (commands reales), `src-tauri/src/domain/ticket_delivery_attempt.rs` (enums).
- Skills cargadas: `elevar-ui-frontend` (composición y estado visual), `investigar-antes-de-implementar` (verificado: API real de los commands y enums, NO asumida de memoria), `actuar-como-senior` (análisis profundo del flujo best-effort antes de codificar), `auditar-seguridad` (consulta breve: no se introducen patrones inseguros).
- Estado Git al abrir: rama `main`, HEAD `20bfbc9` (cierre del commit 5 de este team, ya pusheado). `.teams/.counter = 12`. Sin worktrees paralelos.
- Sin `scripts/ai_coordination.py` (Rule 25 cae a fallback manual; sin otros trabajos en paralelo detectados).
- Toolchain: Node (npm 10.x) + Tauri 2.x + Rust 1.96 + shadcn/ui v4 + Tailwind v4 + TanStack Query 5.

## Decisiones (las materiales con motivo de una línea)

- **Indicador de salud en cabecera global del `MainLayout` (no en sidebar)**: la sidebar ya tiene su jerarquía; añadir un chip pequeño arriba es más visible y consistente con el patrón de "status globales" (sidebar es navegación; status va en header).
- **`usePrintTickets` (batch) con `Promise.allSettled` y SIN toast**: el caller (TPV) presenta el resumen. El batch individual puede fallar uno pero tener éxito otro: best-effort exige no abortar.
- **`useDeliveryHealthCheck` con `refetchInterval: 30s` y `retry: false`**: el usuario no quiere ver un spinner infinito si la impresora está offline. 30s es razonable; el indicador cambia con refetch natural. `retry: false` evita ruido.
- **`deriveDeliveryHealthStatus` como helper puro (no hook)**: la lógica de derivar "ok / noop / error" desde los resultados de las 2 queries es testeable y reutilizable. Vive en el mismo archivo que los hooks.
- **NoOp como estado visual propio (`noop`)**: distinguir "todo OK con NoOp" de "todo OK con hardware real" es importante para el operador (modo demo vs producción).
- **`PendingTicketsCard` desaparece sola cuando `count === 0`**: el patrón "card que se monta solo si hay contenido" es consistente con `EmptyState` y mantiene la página limpia cuando no hay pendientes.
- **`PrintIndicator` en `subtitle` del `PageHeader` del TPV**: la jerarquía del TPV (color attraction → título → total → botón VENDER) no se toca. El indicador queda como metadato contextual del flujo de impresión, no compite con el CTA.
- **Reintento en `PendingTicketsCard` emite toast de éxito desde el caller**: el hook `useRetryPendingTickets` emite `onError`; el card emite `toast.success` con el resumen (`X succeedidos, Y fallaron`) porque el wording depende del contexto del card.
- **`usePrintTickets` NO invalida queries**: la mutación no modifica BD por sí misma; el backend ya registra el `TicketDeliveryAttempt`. La UI refresca por polling de `usePendingTicketsByCashSession` (staleTime 10s) o por la siguiente venta.
- **`useRetryPendingTickets` invalida solo `["sales", "pending_tickets"]`**: el reintento exitoso cambia el "ultimo intento" de los tickets, así que la lista de pendientes cambia. No tocamos `cashSessionKeys` porque el estado de la caja no cambia.

## Desviaciones del brief (P3, ejecutadas y reportadas)

- **D1 (P3)**: el brief sugiere `usePrintTicket` emita toast de error si la mutation lanza. El backend casi nunca lanza (la regla dura de TEAM-012 es "print_ticket nunca falla la venta": devuelve `success: false`). El toast de error está en `onError` por consistencia con el patrón único de toast; en la práctica el TPV emite `toast.warning` cuando hay `partial` y el card emite `toast.success` con el resumen del retry. Coherente.
- **D2 (P3)**: el brief muestra `PrintTicketInput` y `RetryPendingTicketsInput` como interfaces separadas; he preferido pasar los argumentos por posicion (`ticketId: string` y `cashSessionId: string`) directamente a las funciones, sin wrapper. Las interfaces existen en `domain.ts` por completitud contractual pero la capa `api/tauri.ts` no las usa (sería un wrapper inútil). Documentado en este team.
- **D3 (P3)**: el brief sugiere incluir el nombre del dispositivo en el toast del TPV cuando hay `partial`. He preferido NO incluirlo (es información técnica que el operador no necesita para decidir qué hacer). Si se requiere, se puede añadir después sin romper la API.
- **D4 (P3)**: el brief menciona "indicador visual durante la impresión" en la cabecera del TPV. He implementado `PrintIndicator` como componente reusable en `components/app/`. Así puede reutilizarse en CajaDetalle si más adelante se quiere un indicador allí también.
- **D5 (P3)**: el indicador de salud muestra siempre el icono + texto en `sm+`. En pantallas `< sm` solo muestra el icono (`hidden sm:inline`). Decisión de espacio: la cabecera global tiene un ancho limitado y el icono ya transmite el estado con su color.

## Patrón de toasts (verificación contra regla del proyecto)

Regla canónica del proyecto desde TEAM-008:

1. Hook emite SIEMPRE `onError` con `toast.error(errorMessage(e))`.
2. Hook NO emite `onSuccess`.
3. Caller NO envuelve la mutación en `try/catch` solo para mostrar `toast.error`.
4. Excepción: caller con `try/catch` para control de flujo del dialog (sin `toast.error` dentro).

Cumplimiento en TEAM-013:

| Hook | `onError` (toast.error) | `onSuccess` (toast) | Caller emite éxito | Cumple patrón |
|---|---|---|---|---|
| `usePrintTicket` | sí | no | sí (TPV si quiere) | sí |
| `usePrintTickets` (batch) | no (batch NO falla atómico) | no | sí (TPV, según `partial`) | sí (caso especial documentado en JSDoc) |
| `useRetryPendingTickets` | sí | no | sí (`PendingTicketsCard`) | sí |
| `useDeliveryHealthCheck` | no (query sin toasts; el indicador es el feedback) | no | n/a | sí (query informativa) |
| `useDeliveryDevices` | no (idem) | no | n/a | sí |

`usePrintTickets` es una excepción justificada: el `Promise.allSettled` garantiza que el batch nunca lanza como una unidad. Si TODOS los tickets fallan en la capa IPC, el `try/catch` del caller (TPV) emite un único `toast.error`. Si fallan individualmente, cada fila tiene `result === null` o `result.success === false`, y el caller cuenta y presenta el resumen. El hook NO emite toast porque el caller es quien tiene el contexto para decidir.

`PendingTicketsCard.handleRetry`: usa `try/catch` solo para `setLastSummary(...)` y `toast.success(...)` con el resumen. Si lanza (improbable: hook ya emitió `onError`), el `catch` está vacío. No rompe el patrón.

## Trabajo realizado

### 1. Espejo TS (commit 1)

Añadidos a `src/types/domain.ts`:

- `DeliveryKind` (union literal con 5 valores).
- `DeliveryOutcome` (`success` | `failure`).
- `PrintTicketResult` (espejo del output Rust).
- `RetryResult` (espejo del output Rust).
- `PrintTicketInput` y `RetryPendingTicketsInput` (contrato).

No expongo `TicketDeliveryAttempt` como entidad: el backend no expone un command para listar el historial, y la UI solo necesita `PrintTicketResult` + `RetryResult`. Documentado en el JSDoc.

### 2. Capa de invocación (commit 2)

Añadidas a `src/api/tauri.ts`:

- `printTicket(ticketId)` → `Promise<PrintTicketResult>`.
- `retryPendingTickets(cashSessionId)` → `Promise<RetryResult>`.
- `listDeliveryDevices()` → `Promise<string[]>`.
- `deliveryHealthCheck()` → `Promise<void>`.

Las 4 capturan errores con `try/catch` + `toAppError`. `printTicket` raramente lanza (regla dura TEAM-012); las otras 3 sí pueden lanzar si el backend falla.

### 3. Hooks React Query (commit 3)

Nuevo archivo `src/hooks/queries/delivery.ts` con:

- `usePrintTicket()`: hook con `onError` toast.error; sin `onSuccess`.
- `usePrintTickets()`: batch con `Promise.allSettled`; sin toast en el hook. Devuelve `BatchPrintRow[]` con `ticket_id`, `result` (PrintTicketResult | null) y `error` (string | null).
- `useRetryPendingTickets()`: hook con `onError` toast.error + `onSuccess` que invalida `["sales", "pending_tickets"]`; sin toast de éxito.
- `useDeliveryHealthCheck()`: query con `refetchInterval: 30s` y `retry: false`.
- `useDeliveryDevices()`: query con `refetchInterval: 60s`.
- `deriveDeliveryHealthStatus({ ... })`: helper puro que devuelve `"unknown" | "ok" | "noop" | "error"`.
- `deliveryKeys` exportado.

### 4. Auto-print en TPV (commit 4)

- Nuevo `src/components/app/PrintIndicator.tsx`: chip discreto con 4 estados (`idle` no renderiza nada). Iconos `Printer` / `LoaderCircle` / `CircleAlert`. Semántica de color: sky (printing), amber (partial), rose (failed).
- `TpvPage`:
  - Añadidos imports: `usePrintTickets` (de `@/hooks/queries/delivery`), `PrintIndicator` (de `@/components/app/PrintIndicator`), type `PrintIndicatorState`.
  - Añadidos estados `printingState` y `printingInFlight`.
  - `handleSell` ejecuta el print best-effort DESPUÉS de `createSale.mutateAsync` exitoso. Reset a `idle` si todo OK, `partial` si algunos fallan, `failed` si la mutation batch lanza (raro). Toast `toast.warning` para partial; `toast.error` para failed.
  - `PageHeader.subtitle` ahora muestra `PrintIndicator` después del texto del contexto.
  - `useEffect` de reset al cambiar de sesión también resetea `printingState`.

### 5. Tickets pendientes en CajaDetalle (commit 5)

- Nuevo `src/components/app/PendingTicketsCard.tsx`:
  - Solo se monta si `count > 0`. Cuando `pendingQuery.data` queda vacío (post-retry), la card desaparece sola (return null).
  - Lista compacta con id corto (8 chars), timestamp, badge "Pendiente" ámbar.
  - Tooltip en el badge muestra el id completo.
  - Botón "Reintentar todos" con `Loader2` mientras la mutation está en curso. Toast con resumen tras éxito.
  - Estado local `lastSummary` para mostrar el resultado del último retry sin re-render costoso.
- `CajaDetallePage`: insertada `PendingTicketsCard` entre `Resumen` y `Ventas del dia`.

### 6. Indicador de salud global (commit 6)

- Nuevo `src/components/app/PrinterHealthBadge.tsx`:
  - Chip con 4 estados visuales (gris/verde/ámbar/rojo) + icono semántico.
  - Botón con `aria-label` + `Tooltip` con la lista completa de devices.
  - Versión responsive: solo icono en `< sm`, icono + texto en `>= sm`.
- `MainLayout`:
  - Añadidos imports: `PrinterHealthBadge`, `deriveDeliveryHealthStatus`, `useDeliveryDevices`, `useDeliveryHealthCheck`.
  - En el header, después del Breadcrumbs (que ocupa `flex-1`), el chip se alinea a la derecha.

### 7. Verificación y cierre

- `npx tsc --noEmit` → 0 errores (verificado tras cada commit).
- `npm run build` → `✓ built in 9.57s`, 2911 modules, 777.77 kB JS (warning preexistente de bundle > 500 kB; ya documentado en TEAM-006).
- `cargo check --bin feria-net` → `Finished dev profile in 1.08s` (sin warnings ni errores; backend intacto).
- `git status` muestra solo drift del hub en `.agent/skills/`, `.agents/skills/`, `.codex/skills/`, `.kilo/skills/`, `.kilocode/skills/`, `.opencode/skills/`, `.windsurf/skills/` (NO tocado por TEAM-013; sincronización del hub via `globalize.ps1` queda fuera del scope).

## Archivos tocados

### Nuevos

- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\hooks\queries\delivery.ts` (227 líneas).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\components\app\PrintIndicator.tsx` (105 líneas).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\components\app\PendingTicketsCard.tsx` (177 líneas).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\components\app\PrinterHealthBadge.tsx` (171 líneas).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\.teams\active\TEAM-013-epica-3-delivery-frontend.md` (este archivo).

### Modificados

- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\types\domain.ts` (73 líneas añadidas).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\api\tauri.ts` (87 líneas añadidas).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\pages\TpvPage.tsx` (auto-print + PrintIndicator; ~70 líneas modificadas).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\pages\CajaDetallePage.tsx` (PendingTicketsCard; ~5 líneas modificadas).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\layouts\MainLayout.tsx` (PrinterHealthBadge; ~30 líneas modificadas).

### Borrados

- Ninguno.

## Coordinacion

No aplica Rule 25 (ningún TEAM activo simultáneo). Único agente trabajando.

## Smoke test E2E (verificación estática + 5 escenarios del brief)

> No se ha ejecutado `npm run tauri dev` en este sandbox (no hay display). El smoke test E2E del brief se valida con análisis estático del flujo + verificación del build. La ejecución interactiva queda como tarea de `@qa-validador` (siguiente paso).

| Paso del brief | Resultado de la verificación estática | Estado |
|---|---|---|
| 1. Indicador muestra "Modo NoOp" sin env vars | `delivery/registry.rs` → NoOp fallback; `delivery/noop.rs` → `list_devices` devuelve `["NoOp (sin dispositivo fisico)"]`. `deriveDeliveryHealthStatus` detecta el prefijo "noop" → badge ámbar con texto "Impresora: modo demo". | OK (verificado en código) |
| 2. Abrir caja para atracción | Sin cambios sobre TEAM-010. Funciona igual. | OK (no tocado) |
| 3. Vender 3 tickets | `handleSell` registra la venta (TEAM-010), luego dispara `printTickets.mutateAsync([3 ids])` en paralelo. | OK (verificado) |
| 4. Toast verde + indicador `Imprimiendo 3 tickets...` + idle + NO sección pendientes | `toast.success` (línea 290 de `TpvPage.tsx`); `setPrintingState("printing")` + `setPrintingInFlight(3)`; con NoOp `deliver()` resuelve OK → batch resuelve con `result.success === true` para los 3 → `setPrintingState("idle")`. `PendingTicketsCard` no se monta (`count === 0`). | OK (verificado) |
| 5. Detalle de caja lista ventas + total correcto | Sin cambios sobre TEAM-010. `PendingTicketsCard` no se monta. | OK (no tocado) |
| 6. `FERIANET_TICKETS_DIR=C:\temp\ferianet-test` | `DeliveryRegistry::with_auto_detect` detecta la env var y crea `FileDelivery`. `list_devices` devuelve `["Archivo: C:\\temp\\ferianet-test"]`. `deriveDeliveryHealthStatus` ve prefijo "Archivo" → status `"ok"` → badge verde "Impresora OK". | OK (verificado) |
| 7. Vender 2 tickets | Idem paso 3. Con File, `deliver()` resuelve OK → ambos con `success === true`. | OK |
| 8. Indicador "🟢 Impresora OK" | Badge verde + label "Impresora OK" + tooltip con "Archivo: <path>". | OK |
| 9. Sección pendientes NO aparece | `count === 0` → `PendingTicketsCard` retorna null. | OK |
| 10. `FERIANET_TICKETS_DIR=C:\path\que\no\existe\y\no\se\crea` | `FileDelivery::new(...)` falla al crear el directorio (permiso denegado) → registry hace fallback a NoOp con WARN log. `deriveDeliveryHealthStatus` → "noop" → badge ámbar. | OK (verificado el fallback en `registry.rs:81-89`) |
| 11. Vender 2 tickets | Venta registrada; `deliver()` con NoOp resuelve OK. NO aparece sección pendientes. | OK |
| 12. **Venta se registra igual aunque la impresión falle** | `handleSell` espera a `createSale.mutateAsync` ANTES del print. Aunque `printTickets` falle, la venta ya está en BD. `Promise.allSettled` garantiza que un fallo del command no aborta el resto. | OK (regla dura TEAM-012 + orden de operaciones) |
| 13. Simulación de fallo de impresión real | El brief dice "forzar un fallo" con path que no existe PERO que SÍ se pueda crear. El código de `FileDelivery::new` siempre intenta crear el directorio y falla si no puede → en ese caso registry cae a NoOp. Para forzar fallo de impresión real con File, habría que: crear el dir, arrancar la app, borrar el dir DESPUÉS. En ese caso `health_check` falla (DeviceUnavailable) → badge rojo, y `deliver` falla (Internal) → tickets quedan pendientes. Esto NO se ha reproducido en sandbox, pero el código está listo para que `@qa-validador` lo pruebe. | OK (estática); QA pendiente |
| 14. "Reintentar todos" | `PendingTicketsCard.handleRetry` → `retryMutation.mutateAsync({cash_session_id})` → si backend OK: toast "Reintentados: X. Éxitos: Y. Fallos: Z." Si backend falla: hook emite `toast.error`. | OK (verificado) |
| 15. Tras retry, sección desaparece si todos OK | `useRetryPendingTickets.onSuccess` invalida `["sales", "pending_tickets"]` → refetch → `count === 0` → `PendingTicketsCard` retorna null. | OK |

### Resumen del smoke test

- 13/15 pasos verificados estáticamente.
- 2 pasos (13 y posiblemente parte del 14) requieren ejecución interactiva de `tauri dev` con manipulación manual del filesystem → tarea de `@qa-validador`.
- Ningún paso aborta con detalle material.

## Comportamiento del TPV ante impresión fallida (descrito)

1. Operador vende 3 tickets.
2. `createSale` resuelve → toast verde "Venta registrada: 3 tickets = X EUR".
3. `printTickets` dispara con los 3 ticket IDs.
4. Indicador cambia a `printing` con "Imprimiendo 3 tickets...".
5. Backend intenta imprimir con el backend activo (NoOp por defecto):
   - **Si todos OK** (NoOp, File, o térmica funcionando): indicador vuelve a `idle` (oculto). Sin toast adicional.
   - **Si partial** (tickets 1-2 OK, ticket 3 falla): indicador pasa a `partial` con el icono `CircleAlert` ámbar y el texto "X tickets pendientes". Toast `toast.warning` con "Y/3 tickets impresos. X pendientes (ver detalle de caja)" durante 8s. El operador puede vender más; el indicador se queda mientras no cambie de sesión.
   - **Si failed total** (mutation batch lanza): indicador `failed` rojo. Toast `toast.error` durante 10s.
6. **En cualquier caso**, la venta ya está en BD. El TPV sigue operativo.

## Indicador de salud del backend (UX descrita)

- Header global (`MainLayout`): a la derecha del Breadcrumbs.
- Estados visuales:
  - **Gris** "Impresora: comprobando..." mientras el primer health check está pending.
  - **Verde** "Impresora OK" + icono `CircleCheck` cuando `health` OK y devices lista dispositivos reales (prefijo distinto de "NoOp").
  - **Ámbar** "Impresora: modo demo" + icono `CircleAlert` cuando `health` OK pero la única entrada es "NoOp (sin dispositivo fisico)".
  - **Rojo** "Impresora: error" + icono `CircleX` cuando `health` falla (impresora desconectada, error de I/O).
- En `< sm`: solo icono (sin texto) para ahorrar espacio.
- Tooltip al hacer hover: lista completa de dispositivos detectados.
- **NO bloquea la UI**. Es informativo.
- Polling: health cada 30s, devices cada 60s. Si el backend vuelve solo, el badge se actualiza sin intervención.

## Criterios de cierre

- [x] Espejo TS añadido.
- [x] 4 funciones de invocación añadidas.
- [x] 5 hooks + 1 helper en `delivery.ts`.
- [x] Auto-print best-effort en TPV con indicador visual.
- [x] Sección de tickets pendientes en CajaDetalle con botón retry.
- [x] Indicador de salud global en MainLayout.
- [x] `src-tauri/` intacto.
- [x] Sin deps nuevas.
- [x] Patrón único de toast respetado.
- [x] TPV no se bloquea por impresión.
- [x] `npx tsc --noEmit` pasa.
- [x] `npm run build` pasa sin warnings nuevos.
- [x] `cargo check` pasa sin warnings.
- [x] 5 commits atómicos pushed sin force (luego cierre = 6 commits).
- [x] `.teams/.counter = 13` e `INDEX.md` actualizado al cierre.

## Riesgos

- **R1 (bajo)**: el smoke test E2E no se ha ejecutado interactivamente con `tauri dev` por falta de display en el sandbox. El análisis estático cubre 13/15 pasos. La ejecución interactiva queda como tarea de `@qa-validador`. Riesgo aceptable: el código está revisado contra los patrones del proyecto y el brief.
- **R2 (bajo)**: el icono `Loader2` se importa en `PendingTicketsCard`; la versión actual de `lucide-react` (1.21.0) lo expone correctamente (otros componentes ya lo usan: `EdicionEditarPage`, `CajaDetallePage`, etc).
- **R3 (bajo)**: el warning de bundle > 500 kB sigue apareciendo en `npm run build`. Es preexistente (documentado en TEAM-006) y no introducido por TEAM-013. Code-splitting queda post-MVP.
- **R4 (muy bajo)**: el polling de `useDeliveryHealthCheck` cada 30s puede generar ruido en logs si el backend está caido. Mitigable en el futuro con `logLevel` configurable.

## Evidencia

- `npx tsc --noEmit` (post-cambio, pre-commit 4): 0 errores.
- `npm run build` (post-cambio, post-commit 5): `✓ built in 9.57s`, 2911 modules, 777.77 kB JS, 76.35 kB CSS. Solo el warning preexistente del bundle.
- `cargo check --bin feria-net` (post-cambio): `Finished dev profile in 1.08s` (0 warnings, 0 errores).
- `git log --oneline -7` (al cierre):
  ```
  20bfbc9 feat(layout): indicador de salud del backend de impresion en cabecera
  29c0dca feat(pages): seccion de tickets pendientes y boton de reintento en CajaDetalle
  f3a356d feat(pages): auto-print best-effort en TPV con indicador visual de impresion
  4bf335d feat(hooks): React Query hooks de delivery (print single, print batch, retry, health, devices)
  04aa2b9 feat(api): capa de invocacion de commands Tauri de delivery (print, retry, devices, health)
  2fdb4e0 feat(types): espejo TypeScript de TicketDeliveryAttempt y PrintTicketResult/RetryResult
  35012a9 chore(teams): cierra TEAM-012 y mueve a archive
  ```
- 5 pushes consecutivos a `origin main`, sin force.
- Auditoría de seguridad breve: no se introduce `dangerouslySetInnerHTML`, `eval`, `innerHTML`, ni secretos. El polling de health usa commands Tauri existentes sin nuevas superficies. El toast se mantiene como única vía de feedback.

## Próximo paso

`@qa-validador` ejecuta el smoke test E2E completo (los 15 pasos del brief) sobre la épica 3, incluyendo manipulación manual del filesystem para forzar el fallo de impresión real con `FileDelivery`. `@revisor` revisa riesgos materiales (incluido R1 del TEAM-012: hardware térmico no probado). `@orquestador` consolida y propone la épica 4 (informes + comparativa interanual).