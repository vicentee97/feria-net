# TEAM-008 — Cleanup P3 post-épica 1 (unificación toast + 7 hallazgos)

- ID: TEAM-008
- Nombre: Cleanup P3 post-épica 1 (unificación toast + 7 hallazgos)
- Fecha creacion: 2026-06-26
- Estado: activo

## Descripcion

Resuelve los 7 hallazgos P3 del reviewer (`docs/qa/epica-1/review-epica-1-00062bf.md`) y unifica el patrón de toast que producía doble notificación en operaciones que cruzaban dos commands (caso típico: `ActivateEditionDialog` en las páginas de edición). No añade features nuevas, no toca backend funcional, no modifica docs canónicos.

## Objetivo

Criterios verificables (todos a verificar al cierre):

- [ ] Doble toast eliminado: hook emite `onError`, caller emite `onSuccess`. Regla escrita en los hooks para que futuros hooks la sigan.
- [ ] 7 hallazgos P3 resueltos (a-g).
- [ ] `npm run build` sin errores de TS.
- [ ] `cd src-tauri && cargo check` sin warnings nuevos.
- [ ] `npm run tauri dev` arranca.
- [ ] Pensamiento E2E: ningún flujo pierde un mensaje de error tras el refactor.
- [ ] TEAM-008 cerrado y archivado con `.counter` a `8`.

## Contexto

- Docs leídos: `.teams/TEAM_TEMPLATE.md`, `.teams/INDEX.md`, `.teams/archive/TEAM-006-epica-1-editions-frontend.md`, `.teams/archive/TEAM-007-r1-enforce-backend.md`, `docs/qa/epica-1/review-epica-1-00062bf.md`, `docs/REGLAS_PROYECTO.md`, `docs/SSOT.md`.
- Skills cargadas: `elevar-ui-frontend`, `auditar-seguridad` (consulta breve).
- Estado Git al abrir: rama `main`, working tree con `docs/qa/` untracked (intocable, no es mio), último commit `170fec5` (cierre TEAM-007). `.teams/.counter` en `7`.
- Sin `scripts/ai_coordination.py` (no aplica concurrencia runtime); unico agente trabajando.

## Decisiones de diseno (bloqueantes para futuros hooks)

### Patron unico de toast

Regla canonica del proyecto a partir de este team:

1. **El hook emite SIEMPRE `onError`** con `toast.error(errorMessage(e))`. El mensaje viene del backend (`AppError.message`) y es la fuente canonica — siempre relevante.
2. **El hook NO emite `onSuccess`**. El wording del exito depende del contexto de UI (ej. "Edicion 2026 creada" vs "Estado cambiado a active"), asi que lo emite el caller.
3. **El caller NO envuelve la mutacion en `try/catch` solo para mostrar el toast de error**. Si necesita reaccionar al exito (navegar, recargar queries), usa el resultado de `await mutateAsync()` sin try/catch: los errores se propagan al `onError` del hook.
4. **Excepcion documentada**: cuando el callback se pasa a `ConfirmDestructiveDialog` o a un dialog que precise control de flujo, el caller mantiene `try/catch` para `throw` y que el dialog no se cierre. **Pero NO emite `toast.error` dentro del catch** — el hook ya lo hace. Mismo patron aplica a `handleDialogConfirm` en paginas con doble command (`ActivateEditionDialog`): el try/catch controla el flujo del dialog, el toast lo emite el hook.

Esta regla esta documentada en el JSDoc de cabecera de los tres archivos de hooks (`fairs.ts`, `attractions.ts`, `editions.ts`) para que cualquier hook nuevo la siga por defecto.

### Pensamiento E2E (cubierto)

- Todos los callers revisados: emiten error explicitamente via `try/catch` o no emiten (dejando al hook hacerlo).
- Patron problematico buscado: `try { await mutate; toast.success } catch (e) { /* no toast */ }` confiando en que el hook NO emite error → NO encontrado en el codigo revisado.
- Patron problematico encontrado y corregido: `try { await mutate; toast.success } catch (e) { toast.error; throw e; }` en callers que usan `ConfirmDestructiveDialog` → simplificado a `try { await mutate; toast.success } catch (e) { throw e; }` (mantenemos el throw para que el dialog no se cierre, pero quitamos el toast.error redundante).
- Caso especial `handleDialogConfirm` en paginas de edicion: el try/catch mantiene el dialog abierto si falla la secuencia no-transaccional de cerrar-otra + activar-esta. Sin `toast.error` dentro (lo emite el hook en su `onError`).

## Trabajo realizado (plan, no ejecución)

> Verificar al cierre contra el codigo real.

### 1. Patron unico de toast

- `src/hooks/queries/fairs.ts`: añadido `onError: (e) => toast.error(errorMessage(e))` a `useCreateFair`, `useUpdateFair`, `useDeleteFair`. JSDoc de cabecera actualizado con la regla del proyecto.
- `src/hooks/queries/attractions.ts`: idem para `useCreateAttraction`, `useUpdateAttraction`, `useSoftDeleteAttraction`.
- `src/hooks/queries/editions.ts`: quitado `toast.success` del `onSuccess` de `useCreateEdition` y `useUpdateEdition` (antes lo emitia el hook; ahora lo emite el caller). `onError` ya existia y se mantiene. JSDoc de cabecera ampliado con la regla.

### 2. Callers (paginas) — sin try/catch redundante

- `FeriaNuevaPage.onSubmit`: quitado `try/catch` y `toast.error` del catch. Hook emite error.
- `FeriaEditarPage.onSubmit`: idem.
- `FeriaDetallePage.handleDelete`: quitado `toast.error` del catch, mantenido `throw e` (necesario para `ConfirmDestructiveDialog`).
- `FeriasListadoPage.RowActions`: idem.
- `AtraccionNuevaPage.onSubmit`: quitado el `try/catch` que envolvia la mutacion (queda solo el chequeo `eurToCents`). Hook emite error.
- `AtraccionEditarPage.onSubmit`: idem.
- `EdicionNuevaPage.performCreate`: quitado `try/catch` y `toast.error`.
- `EdicionNuevaPage.handleDialogConfirm`: quitado `toast.error` del catch (queda solo control de flujo del dialog).
- `EdicionDetallePage.performStatusChange`: quitado `try/catch` y `toast.error` (queda `toast.success` con wording por transicion).
- `EdicionDetallePage.handleDialogConfirm`: quitado `toast.error` del catch.
- `EdicionDetallePage.handleDeleteEdition`: quitado `toast.error` del catch, mantenido `throw e`.
- `EdicionDetallePage.attractionRowActions.onSoftDelete`: idem.
- `EdicionEditarPage.performUpdate`: quitado `try/catch` y `toast.error`.
- `EdicionEditarPage.handleDialogConfirm`: quitado `toast.error` del catch.

### 3. Siete hallazgos P3

- **(a) Dashboard documenta conteos que no implementa**: `src/pages/DashboardPage.tsx` JSDoc ajustado para reflejar que solo lista ferias. No se anaden conteos (scope creep).
- **(b) `#[allow(dead_code)]` y `#[allow(unused_imports)]` obsoletos en domain**: borrados en `src-tauri/src/domain/fair_edition.rs` (lineas 15, 27, 50) y `src-tauri/src/domain/mod.rs` (linea 16). `cargo check` tras el borrado: 0 warnings nuevos. Los simbolos estaban en uso (commands y repositorio los usan).
- **(c) Prop muerto `onSuccess` en `ConfirmDestructiveDialog`**: eliminado de la interfaz y de la destructuracion. 0 callers lo usaban (verificado con grep). El comentario que decia "Mensaje del toast de exito (lo emite el caller...)" tambien borrado.
- **(d) `void editionKeys` defensivo en `FeriaDetallePage`**: borrada la linea `void editionKeys;` (linea 377 original) y el import `editionKeys` (linea 56 original, no se usaba).
- **(e) Comentario huerfano sobre debounce en `FeriaNuevaPage`**: borrado el comentario de las lineas 39-44 que describia un `useDebounce` inexistente.
- **(f) `TextAreaUsed` local duplica `<textarea>` inline**: extraido a `src/components/ui/textarea.tsx` siguiendo la convencion shadcn v4 (igual que `input.tsx`: `data-slot`, `field-sizing-content`, `focus-visible:ring-3`, `rounded-lg`, etc). Cambios visuales menores respecto a la version inline (sin `shadow-sm`, `min-h-16` vs `min-h-20`, `ring-3` vs `ring-2`). Justificacion: hay 2 sitios con clases ligeramente distintas; extraer evita drift y alinea con `input.tsx`. Las paginas afectadas son `FeriaNuevaPage` (campo `notes` de la feria) y `FeriaEditarPage` (campo `notes` de la feria). Eliminado el helper local `TextAreaUsed` en `FeriaNuevaPage`.
- **(g) Otros**: no se han encontrado hallazgos adicionales materiales. Solo cosas menores ya cubiertas.

### 4. Limpieza de imports muertos

Varios pages tenian `import { errorMessage } from "@/lib/errors"` que quedo sin uso tras quitar `toast.error(errorMessage(e))` del catch. Eliminados de:
- `FeriaNuevaPage.tsx`
- `FeriaEditarPage.tsx`
- `FeriaDetallePage.tsx`
- `FeriasListadoPage.tsx`
- `AtraccionNuevaPage.tsx`
- `AtraccionEditarPage.tsx`
- `EdicionNuevaPage.tsx`
- `EdicionEditarPage.tsx`

`EdicionDetallePage.tsx` ya no importa `errorMessage`.

`EdicionNuevaPage.tsx` ya no importa `toast` de `sonner` (no emite toasts propios).

## Archivos tocados

### Nuevos

- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\components\ui\textarea.tsx` (primitive shadcn v4).
- `C:\Vicente\Programacion\Proyectos\FeriaNet\.teams\active\TEAM-008-epica-1-cleanup-p3.md` (este archivo).

### Modificados

- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\domain\fair_edition.rs`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src-tauri\src\domain\mod.rs`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\hooks\queries\fairs.ts`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\hooks\queries\attractions.ts`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\hooks\queries\editions.ts`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\pages\FeriaNuevaPage.tsx`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\pages\FeriaEditarPage.tsx`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\pages\FeriaDetallePage.tsx`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\pages\FeriasListadoPage.tsx`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\pages\AtraccionNuevaPage.tsx`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\pages\AtraccionEditarPage.tsx`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\pages\EdicionNuevaPage.tsx`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\pages\EdicionDetallePage.tsx`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\pages\EdicionEditarPage.tsx`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\pages\DashboardPage.tsx`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\components\app\ConfirmDestructiveDialog.tsx`

### Borrados

- Ninguno.

## Coordinacion

No aplica Rule 25 (ningun TEAM activo simultaneo). Unico agente trabajando.

## Criterios de cierre

- [ ] Hooks emiten `onError` consistente. Ningun hook emite `onSuccess: toast.success`.
- [ ] Paginas no envuelven mutaciones en `try/catch` solo para toast.error.
- [ ] Callers de `ConfirmDestructiveDialog` y `handleDialogConfirm` mantienen try/catch con `throw` (o vacio) pero sin `toast.error` dentro.
- [ ] `DashboardPage` JSDoc refleja comportamiento real.
- [ ] `#[allow(dead_code)]` y `#[allow(unused_imports)]` obsoletos borrados.
- [ ] `ConfirmDestructiveDialog` no tiene prop `onSuccess`.
- [ ] `FeriaDetallePage` no tiene `void editionKeys` ni import `editionKeys`.
- [ ] `FeriaNuevaPage` no tiene comentario huerfano de debounce.
- [ ] `TextAreaUsed` eliminado; `Textarea` shadcn usado en `FeriaNuevaPage` y `FeriaEditarPage`.
- [ ] `npm run build` pasa.
- [ ] `cd src-tauri && cargo check` pasa sin warnings nuevos.
- [ ] 5-7 commits atomicos con push por commit, sin force.
- [ ] `.counter` actualizado a `8` e `INDEX.md` con fila TEAM-008.
- [ ] Pensamiento E2E: ningun flujo pierde mensaje de error tras el refactor.

## Riesgos

Ninguno material. Cambios puramente cosmeticos y refactor de patron.

- **Riesgo bajo**: la extraccion del `Textarea` cambia ligeramente el visual (sin `shadow-sm`, `min-h-16` en lugar de `min-h-20`, ring-3 en lugar de ring-2). Alineado con `input.tsx` (mismo estilo shadcn v4). Si el feedback del usuario indica que el textarea actual queda peor, revertir este cambio es trivial.
- **Riesgo bajo**: el patron de toast puede tener regresiones si un caller futuro se olvida de emitir `toast.success` (queda operacion silenciosa). Mitigable documentando en JSDoc (ya hecho).

## Evidencia

> Rellenar al cierre.

## Proximo paso

Tras cierre: `@orquestador` consolida y propone la épica 2 (caja diaria + TPV).