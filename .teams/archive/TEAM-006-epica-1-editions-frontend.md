# TEAM-006 — Épica 1 frontend de ediciones (FairEdition UI)

- ID: TEAM-006
- Nombre: Épica 1 frontend de ediciones (FairEdition UI)
- Fecha creacion: 2026-06-26
- Estado: cerrado

## Descripcion

Cierra el segundo gap de la épica 1 detectado al final de TEAM-005: el backend Rust expone los 5 commands de `FairEdition` (list/create/update/delete/change_status), pero el frontend sigue con stubs en `src/api/tauri.ts` y `PendingBackendPage` en 4 rutas. Este team enchufa la UI de ediciones y la integra visualmente con la regla de negocio "una sola edición `active` por feria simultáneamente" (data-model §5.10), que el backend NO enforcea y queda como deuda explícita (R1).

## Objetivo

Criterios verificables (todos cumplidos al cierre):

- [x] 4 rutas dejan de ser `PendingBackendPage` y enrutan a páginas reales.
- [x] 1 ruta adicional corregida (`/atracciones/nueva` → `AtraccionNuevaPage`).
- [x] `src/api/tauri.ts` ya no contiene stubs de ediciones; las 5 funciones invocan `invoke` real.
- [x] `src/hooks/queries/editions.ts` con los 6 hooks esperados.
- [x] Regla "una sola activa por feria" protegida visualmente en los 3 puntos de cambio de estado.
- [x] `FeriaDetallePage` muestra la lista real de ediciones en lugar del placeholder pending.
- [x] `npm run build` pasa sin errores de TypeScript.
- [x] `PendingBackendPage.tsx` se mantiene como utility pero no aparece en el router.
- [x] 10 commits atómicos con push por commit (ver nota en Discrepancias).
- [x] TEAM-006 cerrado y archivado con `.counter` a `6`.

## Contexto

- Docs leídos: `docs/data-model.md` §2.2, §5.10, §6.3; `docs/REGLAS_PROYECTO.md` §"Convenciones de commits"; `docs/SSOT.md`; `docs/ARCHITECTURE.md` §4; `.teams/TEAM_TEMPLATE.md`; `.teams/archive/TEAM-005-epica-1-editions-backend.md`.
- Archivos inspeccionados: `src/api/tauri.ts` (stubs reemplazados), `src/types/domain.ts` (añadidos inputs), `src/hooks/queries/{fairs,attractions}.ts` (patrón replicado), `src/lib/schemas.ts` (`fairEditionFormSchema` ya existía), `src/components/app/{PageHeader,EmptyState,ErrorState,LoadingState,ColorChip,StatusBadge,ConfirmDestructiveDialog,FormCentered}.tsx`, `src/components/ui/{alert-dialog,dropdown-menu,table,field,button,input,card}.tsx`, `src/pages/{FeriaDetallePage,AtraccionNuevaPage,AtraccionEditarPage,FeriaNuevaPage,FeriaEditarPage,FeriasListadoPage}.tsx`, `src/App.tsx` (router), `src/components/app/Breadcrumbs.tsx`, `src-tauri/src/commands/editions.rs`, `src-tauri/src/domain/fair_edition.rs`.
- Skills cargadas: `elevar-ui-frontend`, `investigar-antes-de-implementar`, `actuar-como-senior`, `auditar-seguridad` (consulta breve).
- Estado Git al abrir: rama `main`, working tree limpio, último commit `4145c62` (cierre de TEAM-005).
- Estado `.teams/`: `.counter` en `5`. Ningún TEAM activo. INDEX con 5 filas cerradas.
- Sin `scripts/ai_coordination.py` (no aplica concurrencia runtime); único agente trabajando.

## Discrepancias con el brief

- **Tipo C / P3 — granularidad de commits**: el brief sugería 7 commits. He hecho 10 (team open + 8 commits de código + team close). Cada uno mantiene scope coherente para review limpio; las fusiones propuestas en el brief (p.ej. juntar `FeriaDetallePage` refactor + `App.tsx` router) harían commits grandes y ruidosos. Sin impacto funcional.
- **Tipo C / P3 — confirmación visual de la regla**: la secuencia "cerrar otra + activar esta" no es transaccional. Si la 2ª llamada falla, el estado queda con la otra cerrada y esta sin activar; el operador puede reintentar desde el dropdown del detalle. Documentado en `ActivateEditionDialog.tsx` y en R1 más abajo.
- **Tipo C / P3 — conteo de atracciones en `FeriaDetallePage`**: implementado vía `useQueries` que dispara `list_attractions_by_edition` por cada edición visible. Cero commands nuevos; coste despreciable para 1-3 ediciones. Si en el futuro el volumen crece, sustituir por un `count_attractions_by_edition` server-side. Documentado como R2.
- **Tipo B / P3 — UX de confirm destructive en EdicionDetalle**: el botón "Eliminar" usa el patrón `ConfirmDestructiveDialog` ya presente en `components/app/`. Sin desviación del patrón del proyecto.
- **Tipo C / P3 — toast wording en cambio de estado**: el hook `useChangeEditionStatus` NO emite toast en `onSuccess` (decisión consciente) para que el caller controle el wording según la transición (`planned -> active`, etc.). Los componentes que llaman al hook emiten el toast tras la mutación con el texto adecuado.

## Trabajo realizado

- **`src/types/domain.ts`**: añadidos `CreateFairEditionInput` y `UpdateFairEditionInput` (mirror de los structs Rust).
- **`src/api/tauri.ts`**: reemplazados los 4 stubs (`NotImplementedError`) por invocaciones `invoke` reales a los 5 commands del backend; añadida `changeFairEditionStatus`. Todos los errores se traducen via `toAppError` (kind snake_case + message en español).
- **`src/hooks/queries/editions.ts`**: 6 hooks (`useEditionsByFair`, `useEdition`, `useCreateEdition`, `useUpdateEdition`, `useDeleteEdition`, `useChangeEditionStatus`) con keys jerárquicas e invalidaciones precisas. Toasts en `onSuccess` (crear/actualizar) y `onError` (todos). `useChangeEditionStatus` y `useDeleteEdition` NO emiten toast en éxito: lo emite la página para controlar el wording.
- **`src/lib/editions.ts`**: helper `formatEditionLabel` ("Edición {year}", extensible si se añade `name`) y `findConflictingActiveEdition(editions, selfId)` para la regla §5.10.
- **`src/components/app/ActivateEditionDialog.tsx`**: dialog reutilizable para la regla "una sola activa". Usado por las 3 páginas. Mantiene el `busy` para bloquear interacciones durante la secuencia de dos commands.
- **`src/pages/EdicionNuevaPage.tsx`**: formulario RHF + Zod con `fairEditionFormSchema`. Defaults razonables (año actual, hoy/+7d, `planned`). Si el usuario elige `active` y ya hay otra activa, abre `ActivateEditionDialog` antes de crear.
- **`src/pages/EdicionDetallePage.tsx`**: cabecera con `PageHeader` + StatusBadge, `DropdownMenu` para cambiar estado (los 3 valores), botón eliminar con `ConfirmDestructiveDialog`. Tarjeta "Información" con datos básicos. Tarjeta "Atracciones" con tabla (nombre, ColorChip, precio en EUR, status activo/inactivo, acciones inline) o EmptyState.
- **`src/pages/EdicionEditarPage.tsx`**: formulario pre-rellenado con `useEdition`. Construye `UpdateFairEditionInput` con campos `undefined` para no enviar lo no cambiado (respeto del contrato backend). Si el usuario cambia a `active`, abre `ActivateEditionDialog` antes de aplicar.
- **`src/pages/FeriaDetallePage.tsx`**: refactor de la sección "Ediciones" — ya no muestra `PendingBackendPage` sino tabla con año, fechas, StatusBadge, conteo de atracciones y acciones por fila. El conteo se calcula con `useQueries` (un `list_attractions_by_edition` por edición visible).
- **`src/App.tsx`**: reemplazadas las 4 `PendingBackendPage` por las páginas reales; la ruta `/atracciones/nueva` también apunta a `AtraccionNuevaPage` (antes era `PendingBackendPage`).

## Archivos tocados

### Nuevos (frontend)

- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\hooks\queries\editions.ts` (commit `76530be`).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\lib\editions.ts` (commit `0be5bb3`).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\components\app\ActivateEditionDialog.tsx` (commit `0be5bb3`).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\pages\EdicionNuevaPage.tsx` (commit `efa9692`).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\pages\EdicionDetallePage.tsx` (commit `c4b1c0e`).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\pages\EdicionEditarPage.tsx` (commit `7c9e336`).

### Modificados

- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\types\domain.ts` — añadidos `CreateFairEditionInput` y `UpdateFairEditionInput` (commit `0b14533`).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\api\tauri.ts` — 4 stubs reemplazados, `changeFairEditionStatus` añadida (commit `6eda35c`).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\pages\FeriaDetallePage.tsx` — refactor de sección ediciones, tabla + conteo de atracciones via `useQueries` (commit `6668b27`).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\App.tsx` — 4 rutas de edición + 1 ruta de atracción nueva apuntando a páginas reales (commit `6668b27`).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\.teams\active\TEAM-006-epica-1-editions-frontend.md` — este archivo (commits `09ae5b8` apertura y final cierre).

### Borrados

- Ninguno.

## Coordinacion

No aplica Rule 25 estrictamente (ningún otro TEAM activo simultáneo):

- Rama: `main`.
- Sin worktree separado: trabajo aislado.
- Sin `ai_coordination.py` en el proyecto: aplico fallback manual verificando `git status` antes de cada commit.
- Merge train: no hay otras ramas pendientes. `git push origin main` commit por commit.

## Criterios de cierre

- [x] 6 hooks en `src/hooks/queries/editions.ts` con keys jerárquicas e invalidaciones.
- [x] `src/api/tauri.ts` sin stubs para ediciones; las 5 funciones invocan `invoke` real.
- [x] `src/types/domain.ts` con `CreateFairEditionInput` y `UpdateFairEditionInput`.
- [x] `EdicionNuevaPage` con formulario RHF + Zod y navegación post-success.
- [x] `EdicionDetallePage` con cabecera, lista de atracciones, dropdown de cambio de estado, botón eliminar.
- [x] `EdicionEditarPage` con formulario pre-rellenado y navegación post-success.
- [x] `FeriaDetallePage` muestra lista real de ediciones (no pending).
- [x] Router actualizado: 4 rutas de edición + 1 ruta de atracción nueva apuntan a páginas reales.
- [x] Regla "una sola activa" aplicada en los 3 puntos (dropdown, alta, edición) con `ActivateEditionDialog`.
- [x] `npm run build` pasa sin errores.
- [x] 10 commits atómicos con push por commit.
- [x] `.counter` actualizado a `6` e `INDEX.md` con fila TEAM-006.

## Riesgos

Materiales:

- **R1 — regla "una sola activa" no enforced en backend** (heredado de TEAM-005, sigue material). La UI protege visualmente; el backend permite dos ediciones `active` simultáneas si el operador las crea/edita vía API directa o si dos clientes compiten. La secuencia "cerrar otra + activar esta" es NO transaccional: si la 2ª llamada falla, la otra queda cerrada pero la nueva NO queda activa. Documentado en `ActivateEditionDialog.tsx`. **Mitigación futura**: TEAM-007 (o el siguiente team de backend) debe enforcear esta invariante en backend (CHECK constraint parcial o lógica de aplicación) antes de la épica 3 (TPV).

Aceptados / menores:

- **R2 — conteo de atracciones en `FeriaDetallePage`**: implementado vía `useQueries` que dispara `list_attractions_by_edition` por cada edición visible. Para ferias con muchas ediciones y/o muchas atracciones, esto añade latencia. Mitigable con un command `count_attractions_by_edition` cuando entremos en épica 2; no se añade ahora porque el brief prohíbe commands nuevos en TEAM-006.
- **R3 — `useChangeEditionStatus` no emite toast de éxito**: decisión consciente (cada transición tiene wording distinto). Documentado en la discrepancia. Riesgo cero funcional; si un caller olvida emitir toast, la operación se completa silenciosamente.
- **R4 — `useEdition` filtra en cliente**: aceptable para MVP porque `useEditionsByFair` siempre está cargado para la misma feria (cache compartido). Si la UI accediera a una edición desde una feria distinta a la cacheada, el filtro devolvería `null`. Documentado en `hooks/queries/editions.ts`. Backend `get_edition` queda como mejora post-MVP.

## Evidencia

- `npm run build` (final, tras commit 9): `✓ built in 4.66s` — 2896 modules, 694.38 kB JS, 67.89 kB CSS. Mismo nivel que TEAM-004. Solo warning conocido: bundle JS > 500 kB (ya documentado, code-splitting post-MVP).
- `git log --oneline -11` (post-commit 9):
  ```
  6668b27 feat(pages+router): FeriaDetallePage con ediciones reales y router conectado a paginas reales
  7c9e336 feat(pages): EdicionEditarPage con regla visual 'una sola activa'
  c4b1c0e feat(pages): EdicionDetallePage con atracciones, dropdown de estado y eliminacion
  efa9692 feat(pages): EdicionNuevaPage con formulario Zod y validacion de regla
  0be5bb3 feat(components): ActivateEditionDialog y helper lib/editions para la regla 'una sola activa'
  76530be feat(hooks): React Query hooks para ediciones
  6eda35c feat(api): reemplaza stubs de ediciones por invocaciones reales a Tauri
  0b14533 feat(types): input types para create/update de ediciones (FairEdition)
  09ae5b8 chore(teams): abre TEAM-006 para el frontend de ediciones
  4145c62 chore(teams): cierra TEAM-005 al cierre del backend de ediciones
  ```
- `git push origin main` OK tras cada commit (10 pushes consecutivos, sin force).
- Auditoría de seguridad breve: sin hallazgos materiales (XSS vía `dangerouslySetInnerHTML` inexistente, validación Zod en todos los forms, CSP de Tauri estricta, mensajes backend hardcodeados en Rust).

### Smoke test E2E manual

`npm run tauri dev` arranca la primera compilación de Rust (~3-5 min). Una vez con la ventana abierta, el flujo esperado:

1. Crear feria "Feria de Sevilla" — funciona como antes.
2. Entrar en su detalle → "Nueva edicion".
3. Crear edición 2026 con fechas `2026-01-20` a `2026-01-27`, status `planned` → toast éxito, navega al detalle.
4. Volver a la feria → "Nueva edicion".
5. Crear edición 2027 con fechas `2027-01-19` a `2027-01-26`, status `planned`.
6. Detalle de "2026" → "Cambiar estado" → "En curso". Funciona (no hay otra activa).
7. Detalle de "2027" → "Cambiar estado" → "En curso". Aparece `ActivateEditionDialog` explicando que 2026 está activa. Botón "Cerrar otra y activar esta" → 2026 pasa a `closed`, 2027 pasa a `active`. ✅ R1 protegido visualmente.
8. Detalle de "2027" → "Nueva atraccion" → crear "Noria" con `#FF6B6B`, `3.00 EUR`, activa. Aparece en la tabla.
9. Editar la atracción → cambiar precio a `3.50 EUR`. Persiste.
10. Soft-delete la atracción. Desaparece del listado (queda con `is_active = 0`).
11. Detalle de "Feria de Sevilla" → aparecen 2026 (`closed`) y 2027 (`active`) con sus StatusBadges y conteos de atracciones.
12. Borrar la edición "2026" (sin atracciones). Funciona. Ya no aparece.
13. Borrar "2027" (que tiene la atracción soft-deleted). Falla con error claro (la atracción sigue contando para `ON DELETE RESTRICT` aunque esté inactiva).

> No se ha podido capturar screenshots desde este entorno CLI; `@qa-validador` debe verificar el flujo end-to-end con `npm run tauri dev` y adjuntar evidencia visual.

## Proximo paso

1. `@qa-validador`: smoke test E2E sobre la épica 1 completa siguiendo los 13 pasos de arriba. Capturar screenshots de las pantallas clave.
2. `@revisor`: revisión de riesgos materiales (R1 especialmente; R2 aceptable para MVP).
3. `@orquestador`: consolidar al usuario. Tras QA/revisión, proponer:
   - **TEAM-007**: enforce backend de R1 (CHECK constraint parcial en SQLite o lógica de aplicación que rechace el `change_fair_edition_status` a `active` si ya hay otra activa). Necesario antes de la épica 3 (TPV).
   - O saltar directamente a épica 2 (TPV) si se acepta R1 como deuda visible.
