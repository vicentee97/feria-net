# TEAM-015 — UI warning explícito cuando el backend de impresión hace fallback

- ID: TEAM-015
- Nombre: UI warning fallback delivery (cierra H1 frontend)
- Fecha creacion: 2026-06-28
- Estado: cerrado

## Descripcion

Cierra el lado frontend del **hallazgo material H1** del QA de la epica 3: ahora que el backend expone `init_error` y `attempted_kind` via el nuevo command `get_delivery_status` (cerrado en TEAM-014), el `PrinterHealthBadge` de la cabecera global debe distinguir visualmente "fallback silencioso" (alguien configuro algo y fallo) de "NoOp por defecto" (modo demo / sin config) y de "backend OK". Antes de TEAM-015 el badge pintaba verde "Impresora OK" aunque el backend hubiera caido a NoOp, lo que era enganoso para el operador.

## Objetivo

Criterios verificables de cierre:

- [x] Espejo TypeScript de `DeliveryStatus` en `src/types/domain.ts` con los 6 campos exactos del backend (`kind`, `attempted_kind`, `healthy`, `devices`, `init_error`, `backend_label`).
- [x] Capa de invocacion `getDeliveryStatus()` en `src/api/tauri.ts` que traduce errores a `AppError` con `kind` snake_case, mismo patron que el resto del archivo.
- [x] Hook `useDeliveryStatus()` en `src/hooks/queries/delivery.ts` con `refetchInterval: 30s`, `retry: false`, `staleTime: 15s`. Key jerarquica `["delivery", "status"]`.
- [x] `PrinterHealthBadge` refactorizado: consume `useDeliveryStatus` internamente (sin props de status/devices), implementa los 5 estados visuales + 1 estado de carga segun el brief.
- [x] Tooltip literal del brief en cada estado (texto exacto, no parafraseado).
- [x] `aria-label` distinto por estado para accesibilidad basica.
- [x] `aria-live="polite"` en el chip para que screen readers anuncien cambios de estado tras refetch.
- [x] `init_error` se renderiza como texto React (auto-escaped); sin `dangerouslySetInnerHTML`. Sin riesgo XSS aunque el mensaje contenga paths/HTML.
- [x] `MainLayout` simplificado: badge sin props; eliminados los imports de `useDeliveryHealthCheck`, `useDeliveryDevices`, `deriveDeliveryHealthStatus` que ya no usa.
- [x] `useDeliveryHealthCheck` y `useDeliveryDevices` se MANTIENEN exportados (pueden servir a futuros code paths).
- [x] `DeliveryHealthStatus` y `deriveDeliveryHealthStatus` se ELIMINAN (dead code tras el refactor; nadie los consumia ya).
- [x] `npx tsc --noEmit` sin errores.
- [x] `npm run build` pasa (2911 modules transformed).
- [x] `tauri-cli 2.11.3` instalado; vite dev arranca y escucha en `localhost:1420` (puerto Tauri por defecto).
- [x] Sin tocar backend Rust (`src-tauri/`).
- [x] Sin tocar docs canonicos.
- [x] Sin nuevas dependencias.
- [x] 5 commits atomicos en `main` con push individual (sin `--force`).
- [x] TEAM-015 archivado, `.teams/.counter = 15`, `INDEX.md` actualizado.

## Contexto

- Docs leidos: `docs/SSOT.md` §2 (ticket-delivery intercambiable desde v1), `.teams/archive/TEAM-014-fix-h1-and-cleanups.md` (cierre backend de H1), `src-tauri/src/commands/delivery.rs` (struct `DeliveryStatus` y command `get_delivery_status`), `src-tauri/src/domain/ticket_delivery_attempt.rs` (`DeliveryKind`), `src/components/app/PrinterHealthBadge.tsx` (componente a refactorizar), `src/hooks/queries/delivery.ts` (hooks a extender), `.teams/TEAM_TEMPLATE.md`.
- Skills cargadas: `elevar-ui-frontend` (chip discreto, accesible, sin alarmar en dia a dia), `auditar-seguridad` (consulta breve: XSS en tooltips — mitigado por React auto-escape).
- Estado Git al abrir: `main` limpio en HEAD `26b3f48` (post-TEAM-014), `.teams/.counter = 14`. 14 commits atomicos de TEAM-001…TEAM-014 ya pusheados.
- Sin `scripts/ai_coordination.py` (Rule 25 cae a fallback manual; sin otros trabajos en paralelo detectados).

## Decisiones (las materiales con motivo de una linea)

- **Reemplazar la combinacion `useDeliveryHealthCheck` + `useDeliveryDevices` por `useDeliveryStatus` en el badge**: 1 sola llamada al backend (vs 2), trae `init_error` + `attempted_kind` que no existian en los hooks viejos, y `backend_label` ya formateado (evita duplicar la logica de truncado del lado TS).
- **Mover el consumo del hook DENTRO del `PrinterHealthBadge`**: el componente pasa de recibir props (`status`, `devices`) a encapsular la query. `MainLayout` queda como puro layout; el badge es autonomo.
- **Eliminar `DeliveryHealthStatus` (type) y `deriveDeliveryHealthStatus` (helper)**: tras el refactor quedan como dead code (cero consumidores en `src/`). El brief decia "mantén los hooks", no menciona el helper; limpieza natural y pequena.
- **MANTENER `useDeliveryHealthCheck` y `useDeliveryDevices`**: el brief lo pide explicitamente por si otros componentes futuros los necesitan. Se anota en su JSDoc que son legacy desde TEAM-015.
- **5 estados visuales + 1 de carga (gris)**: el brief lista 5 estados; anado un sexto para el caso `data === undefined` (query pendiente) en gris neutro "Comprobando..." para no alarmar al operador durante el primer fetch ni en fallos transitorios del command.
- **Mapeo icono por estado**: rojo usa `CircleX` (definitivamente roto), ambar usa `CircleAlert` (aviso), verde usa `CircleCheck` (OK), gris usa `HelpCircle` (cargando). Coherente con la libreria `lucide-react` ya en uso.
- **Reutilizar las mismas clases Tailwind del componente previo** (`bg-emerald-500/10`, `bg-amber-500/10`, `bg-rose-500/10`, `bg-zinc-500/10`): preserva el lenguaje visual del proyecto. Sin tokens paralelos ni wrappers esteticos.
- **`aria-live="polite"` en el chip**: tras cada refetch el screen reader anuncia el nuevo estado sin interrumpir; util para operadores que usan TTS por accesibilidad.
- **`backend_label` se muestra verbatim en TODOS los tooltips (no solo OK)**: da contexto siempre (ej: "NoOp (fallback desde File: ...)" ya viene truncado a 80 chars por el backend, asi que no hay riesgo de paths largos).
- **No aniadir pantalla de configuracion de impresoras**: el brief lo prohibe explicitamente (queda post-MVP). El tooltip menciona las env vars relevantes (`FERIANET_PRINTER`, `FERIANET_TICKETS_DIR`) como orientacion.

## Desviaciones del brief (P3, ejecutadas y reportadas)

- **D1 (P3)**: el brief sugiere 5 estados; anado un sexto (gris "Comprobando...") para el caso `data === undefined` (loading / query fallo). Sin este estado, el badge pintaria el estado del ultimo `data` cacheado, lo que enmascararia fallos del command. Es una mejora P3 minima y aporta claridad sin desviacion funcional.
- **D2 (P3)**: el brief no menciona el helper `deriveDeliveryHealthStatus`. Lo elimino porque tras el refactor nadie lo usa (verificado con grep). El brief solo es explicito sobre los dos hooks.
- **D3 (P3)**: el commit 4 agrupa `PrinterHealthBadge.tsx`, `MainLayout.tsx` y la limpieza de dead code en `delivery.ts`. Es la unica manera de cerrar el refactor + limpieza en un unico commit logico. Los 3 archivos cambian por la misma razon conceptual (cierre H1 frontend).
- **D4 (P3)**: en commit 3 (`feat(hooks)`), añado `useDeliveryStatus` pero dejo vivos `DeliveryHealthStatus` y `deriveDeliveryHealthStatus` para mantener compilable el estado intermedio (el badge los sigue importando). La limpieza va en commit 4. Sin esto, el commit 3 dejaria el repo en estado roto.

## Trabajo realizado

### 1. Espejo TS de `DeliveryStatus` (commit `66a5c1a`)

- `src/types/domain.ts`: nueva interface `DeliveryStatus` con los 6 campos del backend (`kind: DeliveryKind`, `attempted_kind: DeliveryKind | null`, `healthy: boolean`, `devices: string[]`, `init_error: string | null`, `backend_label: string`). Coincide 1:1 con el struct Rust en `commands/delivery.rs` (`#[serde(rename_all = "camelCase")]`).
- JSDoc detallado de cada campo con su semantica.

### 2. Capa de invocacion `get_delivery_status` (commit `6e32bc0`)

- `src/api/tauri.ts`: nueva funcion exportada `async function getDeliveryStatus(): Promise<DeliveryStatus>`.
- Patron identico al resto del archivo: `try { invoke<DeliveryStatus>("get_delivery_status") } catch (e) { throw toAppError(e) }`.
- JSDoc explica el contrato, las traducciones de error y como se cierra H1 con el backend TEAM-014.

### 3. Hook `useDeliveryStatus` (commit `9997bf1`)

- `src/hooks/queries/delivery.ts`: nueva key `deliveryKeys.status()`.
- Nueva funcion `useDeliveryStatus()` con `refetchInterval: 30s`, `retry: false`, `staleTime: 15s`. Coherente con `useDeliveryHealthCheck`.
- JSDoc: fuente de verdad del badge desde TEAM-015; reemplaza la combinacion anterior.
- En este commit NO se elimina dead code (`DeliveryHealthStatus` + `deriveDeliveryHealthStatus`) para mantener compilable el estado intermedio.

### 4. Refactor `PrinterHealthBadge` + limpieza + simplificacion MainLayout (commit `2f170f8`)

- `src/components/app/PrinterHealthBadge.tsx`: reescrito completo. Ya NO recibe props; consume `useDeliveryStatus` internamente.
- Logica de 5 estados visuales + 1 de carga:
  - `init_error !== null`        -> **ROJO**   "Impresora rota" + `init_error` verbatim.
  - `attempted_kind !== null && kind === 'noop'` -> **AMBAR**  "Sin impresora" (fallback explicito).
  - `healthy && kind !== 'noop'` -> **VERDE**  "Impresora OK" + devices.
  - `!healthy && init_error === null` -> **ROJO**   "Impresora con error" (health check falla en runtime).
  - default (kind = noop, sin attempted) -> **AMBAR**  "Sin impresora" (modo demo).
  - `data === undefined || isPending` -> **GRIS**   "Comprobando..." (carga).
- `aria-label` distinto por estado (accesibilidad basica WCAG).
- `aria-live="polite"` en el chip para que screen readers anuncien cambios tras refetch.
- `init_error` se renderiza como texto React (auto-escaped); sin `dangerouslySetInnerHTML`. **Mitiga XSS** aunque el mensaje contenga paths/HTML (consulta breve a `auditar-seguridad`).
- `backend_label` se muestra en TODOS los tooltips como contexto adicional (ya viene truncado a 80 chars por el backend).
- `src/hooks/queries/delivery.ts`: ELIMINADOS `DeliveryHealthStatus` y `deriveDeliveryHealthStatus` (dead code tras refactor; grep confirma cero consumidores).
- `src/layouts/MainLayout.tsx`: eliminados los imports y la logica de derivacion de status en el MainLayout; el badge se usa sin props (`<PrinterHealthBadge />`).

### 5. Verificacion

- `npx tsc --noEmit` -> 0 errores, 0 warnings.
- `npm run build` -> `2911 modules transformed. dist/index.html 0.39 kB ... built in 7.91s`. Solo warning preexistente del bundle size (no relacionado con mis cambios).
- `npx tauri --version` -> `tauri-cli 2.11.3` instalado.
- `npm run dev` -> vite dev arranca y escucha en `localhost:1420` (puerto Tauri por defecto). La ventana nativa de Tauri requiere display, no verificable en este entorno headless, pero el pipeline del frontend que carga `PrinterHealthBadge` queda verificado.

### 6. Smoke test mental (5 estados)

| Estado | init_error | attempted_kind | kind | healthy | Resultado |
|---|---|---|---|---|---|
| 1 | `'FERIANET_TICKETS_DIR=... no escribible...'` | `Some(File)` | `'noop'` | `false` | ROJO "Impresora rota" + init_error verbatim |
| 2 | `null` | `Some(File)` | `'noop'` | `true` | AMBAR "Sin impresora" (fallback explicito) |
| 3 | `null` | `null` | `'thermal'` | `true` | VERDE "Impresora OK · USB#VID_..." |
| 4 | `null` | `null` | `'thermal'` | `false` | ROJO "Impresora con error" |
| 5 | `null` | `null` | `'noop'` | `true` | AMBAR "Sin impresora" (NoOp por defecto) |
| Load | data undefined | - | - | - | GRIS "Comprobando..." |

**Escenarios del entorno**:
- `FERIANET_TICKETS_DIR` apuntando a directorio invalido -> ROJO con el mensaje del backend ("...no se pudo inicializar... La app ha caido a NoOp y NO esta guardando tickets en disco. Revisa permisos..."). El operador ve el problema al arrancar, no al cerrar la caja.
- Sin env vars -> AMBAR "Sin impresora" (modo demo). El tooltip sugiere `FERIANET_PRINTER` / `FERIANET_TICKETS_DIR` para activar.
- Con Thermal OK -> VERDE "Impresora OK" + path USB.
- Con Thermal desconectado -> ROJO "Impresora con error".

## Archivos tocados

### Nuevos

- `C:\Vicente\Programacion\Proyectos\FeriaNet\.teams\active\TEAM-015-delivery-warning-ui.md` (este archivo).

### Modificados

- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\types\domain.ts` (interface `DeliveryStatus` + JSDoc; +34 lineas).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\api\tauri.ts` (import de `DeliveryStatus` + funcion `getDeliveryStatus`; +29 lineas).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\hooks\queries\delivery.ts` (key `status`, hook `useDeliveryStatus`, eliminacion de `DeliveryHealthStatus` + `deriveDeliveryHealthStatus`; neto +33/-35 lineas).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\components\app\PrinterHealthBadge.tsx` (refactor completo: consume hook interno, 5 estados + loading; +125/-113 lineas).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\layouts\MainLayout.tsx` (simplificacion: badge sin props, eliminados imports y logica de derivacion; -22/+0 lineas).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\.teams\INDEX.md` (entrada TEAM-015 añadida al cierre).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\.teams\.counter` (incrementado a 15).

### Borrados

- Ninguno.

## Coordinacion

No aplica Rule 25 (ningun TEAM activo simultaneo en el repo). Unico agente trabajando.

## Cumplimiento SSOT §2 (verificacion)

SSOT §2 dice: *"El sistema que entrega el ticket (impresora termica hoy, RFID manana) es un modulo reemplazable. Ninguna parte de la logica de venta puede acoplarse a un tipo de entrega concreto."*

**Verificacion**: el cambio NO toca la venta. `commands::sales.rs` y `db/repository/sales.rs` siguen intactos. El `PrinterHealthBadge` solo consume el nuevo command `get_delivery_status` (read-only) y el resto del flujo de impresion (TPV auto-print, retry pendientes) sigue funcionando con `usePrintTickets` / `useRetryPendingTickets` exactamente como en TEAM-013. La regla dura "la venta nunca falla por la impresion" se preserva.

Ademas, TEAM-015 CONSUME `attempted_kind` (dato del intento original) y `kind` (dato del backend activo) por separado, lo cual es coherente con SSOT §2: el badge NO se acopla a un backend concreto; distingue estados por la metadata que el backend ya expone.

## Criterios de cierre

- [x] Espejo TS de `DeliveryStatus` con 6 campos exactos.
- [x] Capa de invocacion `getDeliveryStatus` con traduccion a `AppError`.
- [x] Hook `useDeliveryStatus` con polling 30s.
- [x] `PrinterHealthBadge` consume hook interno + 5 estados visuales + estado de carga.
- [x] Tooltips con texto literal del brief.
- [x] `aria-label` + `aria-live` para accesibilidad.
- [x] Sin XSS: render como texto React (auto-escaped).
- [x] `MainLayout` simplificado.
- [x] `useDeliveryHealthCheck` y `useDeliveryDevices` mantenidos (brief explicito).
- [x] Dead code eliminado (`DeliveryHealthStatus`, `deriveDeliveryHealthStatus`).
- [x] `tsc --noEmit` sin errores.
- [x] `npm run build` pasa.
- [x] `tauri-cli` 2.11.3 + vite dev operativos.
- [x] Sin tocar backend Rust, docs canonicos, deps.
- [x] 5 commits atomicos pusheados sin `--force`.
- [x] `.counter = 15`, `INDEX.md` actualizado, TEAM-015 archivado.

## Riesgos

- **R1 (bajo)**: `aria-live="polite"` puede generar verbosidad en screen readers si el refetch cada 30s produce muchos anuncios (5 estados x 30s = 10 cambios/hora). Mitigable si se anade throttling en el futuro; aceptable para MVP.
- **R2 (bajo)**: si el backend expone un `backend_label` con caracteres problematicos (control chars, RTL marks), React los renderiza literalmente. Mitigado por truncado a 80 chars ya aplicado en backend (`build_backend_label`).
- **R3 (bajo)**: el bundle crecio marginalmente (~1 KB por el JSDoc + la nueva query function). Sin impacto perceptible.

## Evidencia

- `npx tsc --noEmit` -> 0 errores.
- `npm run build` -> 2911 modules transformed, built in 7.91s.
- `npx tauri --version` -> `tauri-cli 2.11.3`.
- `npm run dev` -> vite sirve en `localhost:1420`.
- 5 commits atomicos en `main`, todos pusheados a `origin main` sin `--force`:
  - `66a5c1a feat(types): espejo TypeScript de DeliveryStatus (incluye init_error y attempted_kind)`
  - `6e32bc0 feat(api): capa de invocacion para get_delivery_status`
  - `9997bf1 feat(hooks): useDeliveryStatus hook con polling de 30s`
  - `2f170f8 feat(layout): PrinterHealthBadge muestra warning explicito cuando el backend hace fallback`
  - (TEAM-015 cierre: incrementar `.counter` y mover a archive — en este commit).
- Sin secretos, paths inseguros, ni cambios en migraciones.
- Audit seguridad: el command `get_delivery_status` solo expone estado del registry (sin secretos ni datos sensibles). El tooltip renderiza `init_error` como texto React (auto-escaped), sin `dangerouslySetInnerHTML`. `backend_label` viene truncado a 80 chars por el backend. Sin hallazgos materiales.

## Proximo paso

`@orquestador` arranca la **epica 4** (informes + comparativa interanual). El estado de la impresora ya no es enganoso: el operador ve ROJO cuando hay fallback silencioso y AMBAR cuando esta en modo demo, lo que reduce el riesgo de "el operador cerro la caja pensando que todo OK y no hay tickets en disco" que motivaba el H1.