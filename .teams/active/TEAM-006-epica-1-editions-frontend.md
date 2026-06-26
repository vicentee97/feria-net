# TEAM-006 — Épica 1 frontend de ediciones (FairEdition UI)

- ID: TEAM-006
- Nombre: Épica 1 frontend de ediciones (FairEdition UI)
- Fecha creacion: 2026-06-26
- Estado: activo

## Descripcion

Cierra el segundo gap de la épica 1 detectado al final de TEAM-005: el backend Rust expone los 5 commands de `FairEdition` (list/create/update/delete/change_status), pero el frontend sigue con stubs en `src/api/tauri.ts` y `PendingBackendPage` en 4 rutas. Este team enchufa la UI de ediciones y la integra visualmente con la regla de negocio "una sola edición `active` por feria simultáneamente" (data-model §5.10), que el backend NO enforcea y queda como deuda explícita (R1).

## Objetivo

Criterios verificables:

- 4 rutas dejan de ser `PendingBackendPage` y enrutan a páginas reales:
  - `/ferias/:fairId/ediciones/nueva` → `EdicionNuevaPage` (formulario RHF + Zod).
  - `/ferias/:fairId/ediciones/:edicionId` → `EdicionDetallePage` (cabecera, atracciones, acciones).
  - `/ferias/:fairId/ediciones/:edicionId/editar` → `EdicionEditarPage` (formulario pre-rellenado).
- 1 ruta adicional corregida:
  - `/ferias/:fairId/ediciones/:edicionId/atracciones/nueva` → `AtraccionNuevaPage` (ya existía; estaba tapada por `PendingBackendPage`).
- `src/api/tauri.ts` ya no contiene stubs de ediciones; las 5 funciones invocan `invoke` real con los 5 commands del backend.
- `src/hooks/queries/editions.ts` con los hooks esperados (`useEditionsByFair`, `useEdition`, `useCreateEdition`, `useUpdateEdition`, `useDeleteEdition`, `useChangeEditionStatus`).
- Regla "una sola activa por feria" protegida visualmente en los 3 puntos de cambio de estado: dropdown de detalle, submit del alta, submit de la edición. Si ya hay una activa, AlertDialog con botones "Cancelar" / "Cerrar otra y activar esta".
- `FeriaDetallePage` muestra la lista real de ediciones en lugar del placeholder pending.
- `npm run build` pasa sin errores de TypeScript.
- `PendingBackendPage.tsx` se mantiene como utility pero no aparece en el router.
- 7 commits atómicos con push por commit.
- TEAM-006 cerrado y archivado con `.counter` a `6`.

## Contexto

- Docs leídos: `docs/data-model.md` §2.2, §5.10, §6.3; `docs/REGLAS_PROYECTO.md` §"Convenciones de commits"; `docs/SSOT.md`; `docs/ARCHITECTURE.md` §4; `.teams/TEAM_TEMPLATE.md`; `.teams/archive/TEAM-005-epica-1-editions-backend.md`.
- Archivos del proyecto inspeccionados: `src/api/tauri.ts` (stubs), `src/types/domain.ts` (sin `Create*Input`), `src/hooks/queries/{fairs,attractions}.ts` (patrón), `src/lib/schemas.ts` (`fairEditionFormSchema` ya definido), `src/components/app/{PageHeader,EmptyState,ErrorState,LoadingState,ColorChip,StatusBadge,ConfirmDestructiveDialog,FormCentered}.tsx`, `src/components/ui/{alert-dialog,dropdown-menu,table,field,button,input,card,select}.tsx`, `src/pages/{FeriaDetallePage,AtraccionNuevaPage,AtraccionEditarPage,FeriaNuevaPage,FeriaEditarPage,FeriasListadoPage}.tsx`, `src/App.tsx` (router), `src/components/app/Breadcrumbs.tsx`, `src-tauri/src/commands/editions.rs`, `src-tauri/src/domain/fair_edition.rs`.
- Skills cargadas: `elevar-ui-frontend`, `investigar-antes-de-implementar`, `actuar-como-senior`, `auditar-seguridad` (consulta breve).
- Estado Git al abrir: rama `main`, working tree limpio, último commit `4145c62` (cierre de TEAM-005).
- Estado `.teams/`: `.counter` en `5`. Ningún TEAM activo. INDEX con 5 filas cerradas.
- Sin `scripts/ai_coordination.py` (no aplica concurrencia runtime); soy el único trabajando aquí ahora.

## Discrepancias con el brief

_(se rellenará durante la implementación si aparecen desviaciones materiales)_

## Trabajo realizado

_(se rellenará al cerrar)_

## Archivos tocados

_(se rellenará al cerrar)_

## Coordinacion

No aplica Rule 25 estrictamente (ningún otro TEAM activo simultáneo):

- Rama: `main` (sigo la práctica del proyecto de cerrar épicas directamente sobre `main`).
- Sin worktree separado: trabajo aislado, no compite por superficies compartidas.
- Sin `ai_coordination.py` en el proyecto: aplico fallback manual verificando `git status` antes de cada commit.
- Merge train: no hay otras ramas pendientes. `git push origin main` commit por commit.

## Criterios de cierre

- [ ] Los 5 hooks de React Query en `src/hooks/queries/editions.ts` con keys jerárquicas e invalidaciones.
- [ ] `src/api/tauri.ts` sin stubs para ediciones; las 5 funciones invocan `invoke` real.
- [ ] `src/types/domain.ts` con `CreateFairEditionInput` y `UpdateFairEditionInput`.
- [ ] `EdicionNuevaPage` con formulario RHF + Zod y navegación post-success.
- [ ] `EdicionDetallePage` con cabecera, lista de atracciones, dropdown de cambio de estado, botón eliminar.
- [ ] `EdicionEditarPage` con formulario pre-rellenado y navegación post-success.
- [ ] `FeriaDetallePage` muestra lista real de ediciones (no pending).
- [ ] Router actualizado: las 4 rutas de edición + la ruta de atracción nueva apuntan a páginas reales.
- [ ] Regla "una sola activa" aplicada en los 3 puntos (dropdown, alta, edición) con `ActivateEditionDialog`.
- [ ] `npm run build` pasa sin errores.
- [ ] 7 commits atómicos con push por commit.
- [ ] `.counter` actualizado a `6` e `INDEX.md` con fila TEAM-006.

## Riesgos

Materiales:

- **R1 — regla "una sola activa" no enforced en backend**: la UI protege visualmente; el backend permite dos ediciones `active` simultáneas si el usuario las crea/edita vía API directa o si dos clientes compiten. La secuencia "cerrar otra + activar esta" es secuencial y no transaccional: si la 2ª llamada falla, el estado queda como esté (la otra cerrada, esta sin activar). Documentado en TEAM-006 y queda como tarea para TEAM-007+.

No materiales / aceptados:

- **R2 — conteo de atracciones en `FeriaDetallePage`**: implementado vía `useQueries` que dispara `list_attractions_by_edition` por cada edición visible. Para ferias con muchas ediciones y/o muchas atracciones, esto añade latencia. Mitigable con un command `count_attractions_by_edition` cuando entremos en épica 2; no se añade ahora porque el brief prohíbe commands nuevos.

## Evidencia

_(se rellenará al cerrar con `npm run build`, commits y diffs)_

## Proximo paso

Tras cerrar:

1. `@qa-validador`: smoke test E2E sobre la épica 1 completa (alta feria → alta edición → alta atracción → soft-delete atracción → cambio status con regla → borrar edición con/sin atracciones).
2. `@revisor`: revisión de riesgos materiales (incluido R1).
3. `@orquestador`: consolidar al usuario y proponer TEAM-007 (enforce backend de R1) o saltar a la épica 2 (TPV).
