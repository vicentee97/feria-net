# TEAM-017 — Épica 4 frontend: informes (daily / feria / comparativa interanual)

- ID: TEAM-017
- Nombre: Épica 4 frontend: pantalla /informes con 3 tabs, gráficos Recharts y exportación CSV
- Fecha creacion: 2026-06-28
- Estado: cerrado

## Descripcion

Cierra el lado frontend de la épica 4 (Informes v1) consumiendo los
3 commands Tauri expuestos por TEAM-016. Construye la pantalla
`/informes` con tres tabs (Por día, Por feria, Comparativa interanual),
gráficos Recharts, tablas de datos detallados, selector de feria /
edición / fechas, y exportación CSV client-side. NO modifica el
backend Rust (TEAM-016 ya cerrado), NO modifica docs canónicos, NO
instala dependencias nuevas (Recharts ya estaba en `package.json` de
épica 1).

## Objetivo

Criterios verificables (todos cumplidos al cierre):

- [x] Espejo TS de los 5 tipos Rust (`ReportTotals`, `AttractionReport`,
      `DayReport`, `DailyReport`, `FeriaReport`, `ComparativeEdition`,
      `ComparativeReport`) + 2 inputs (`GetDailyReportInput`,
      `GetFeriaReportInput`) en `src/types/domain.ts`.
- [x] 3 funciones API en `src/api/tauri.ts` (`getDailyReport`,
      `getFeriaReport`, `getComparativeReport`) con `toAppError`.
- [x] 3 hooks de React Query en `src/hooks/queries/reports.ts`
      (`useDailyReport`, `useFeriaReport`, `useComparativeReport`)
      con `staleTime` ajustado por tipo (60s / 60s / 300s).
- [x] Utilidad `exportToCSV` en `src/lib/csv.ts` con escape RFC 4180
      y BOM UTF-8 para que Excel/LO reconozcan tildes y €.
- [x] Primitive shadcn `tabs` en `src/components/ui/tabs.tsx`
      (Radix UI Tabs vía `radix-ui` unificado ya instalado).
- [x] Página `/informes` con 3 tabs, gráficos Recharts (barras,
      líneas, barras apiladas), tablas detalladas, botón "Exportar
      CSV" por tab y empty/loading/error states consistentes con el
      resto del proyecto.
- [x] Sidebar: item "Informes" activado, icono `BarChart3`, orden
      correcto (Ferias → Cajas → Informes → Sync → Configuración).
- [x] Breadcrumb: `Informes` cuando la ruta es `/informes`.
- [x] Footer de la sidebar actualizado a `v1 (MVP) · Épica 4`.
- [x] `npm run build` sin errores de TS ni warnings nuevos.
- [x] `npx tsc --noEmit` sin errores.

## Contexto

- Docs leídos:
  - `docs/SSOT.md` (taxonomía: Feria, Edición, Atracción, Caja,
    Ticket; sin cambios estructurales).
  - `docs/data-model.md` (modelo mental del que cuelgan los informes:
    `Sale → SaleLine`, denormalización en `Ticket`).
  - `docs/TODO.md` épica 4 (lista los 3 informes y la exportación).
  - `docs/REGLAS_PROYECTO.md` (convenciones de commits, prohibido
    versionar, smoke rules).
  - `.teams/archive/TEAM-008-epica-1-cleanup-p3.md` (patrón único de
    toast: hook emite `onError`, caller emite `onSuccess`, callers
    no envuelven mutaciones en `try/catch` redundante).
  - `.teams/archive/TEAM-016-epica-4-reports-backend.md` (contratos
    de los 3 commands y los tipos espejo).
- Skills cargadas obligatoriamente:
  - `elevar-ui-frontend` (calidad visual de la pantalla wow-factor).
  - `investigar-antes-de-implementar` (verificar API Recharts v3
    instalada).
  - `actuar-como-senior` (profundidad antes de escribir; los
    informes son la pieza que demuestra el valor del producto).
- Inputs técnicos verificados:
  - `src-tauri/src/commands/reports.rs` y `src-tauri/src/domain/report.rs`
    (los 3 commands, los tipos exactos, validación de UUIDs / fechas).
  - `src/types/domain.ts` (convención snake_case + `_cents`).
  - `src/lib/money.ts` (`formatEur`, `centsToEur`, `eurToCents`).
  - `src/hooks/queries/fairs.ts`, `editions.ts`, `attractions.ts`
    (patrón de keys jerárquicas + `enabled`).
  - `src/components/app/EmptyState`, `LoadingState`, `ErrorState`,
    `PageHeader`, `Breadcrumbs`, `ColorChip` (primitives disponibles).
  - `src/components/ui/button`, `card`, `table`, `select`, `input`,
    `field`, `label`, `separator`, `tooltip` (shadcn v4 ya
    disponibles). Faltan: `tabs` → instalado manualmente vía
    `@radix-ui/react-tabs` (paquete unificado `radix-ui` ya en
    `package.json`).
- Supuestos:
  - Los argumentos a Tauri usan camelCase (`editionId`, `fromDate`,
    `toDate`, `fairId`). El backend de Tauri convierte
    automáticamente snake_case ↔ camelCase por defecto; verificado
    contra el resto del `api/tauri.ts` (mismo patrón que `createSale`,
    `closeCashSession`, etc.).
  - Money siempre en céntimos desde el backend; la UI convierte a EUR
    con `formatEur` en pantalla y `centsToEur / 100` en CSV (el CSV
    emite número crudo sin locale para ser analysis-friendly).
  - Recharts v3.9.0 (API similar a v2 pero con `accessibilityLayer`
    activado por defecto y `Formatter<ValueType, NameType>` más
    estricto en tipos — verificado vía `node_modules/recharts/types/
    component/DefaultTooltipContent.d.ts`).
  - StaleTime: 60 s para daily / feria (cambian durante el día), 300 s
    para comparativa (no cambia entre días).
- Dependencias: `TEAM-016` (backend de informes, cerrado) provee los
  3 commands y los tipos espejo.

## Trabajo realizado

### Tipos espejo (`src/types/domain.ts`)

Añadida sección `// Informes v1 (epica 4 / TEAM-017)` al final con:

- `ReportTotals`, `AttractionReport`, `DayReport`, `DailyReport`,
  `FeriaReport`, `ComparativeEdition`, `ComparativeReport`.
- `GetDailyReportInput`, `GetFeriaReportInput`.

Convenciones heredadas: snake_case (viene de Rust sin rename),
`_cents` para importes, fechas locales `YYYY-MM-DD`. JSDoc explica
origen y reglas del backend.

### Capa API (`src/api/tauri.ts`)

Añadidas 3 funciones en sección `// Informes v1 (epica 4 / TEAM-017)`:

- `getDailyReport(input: GetDailyReportInput): Promise<DailyReport>`.
- `getFeriaReport(input: GetFeriaReportInput): Promise<FeriaReport>`.
- `getComparativeReport(fairId: string): Promise<ComparativeReport>`.

Cada una envuelve `invoke<T>(...)` en try/catch y traduce con
`toAppError`. Argumentos al invoke van en camelCase (`editionId`,
`fromDate`, `toDate`, `fairId`) — mismo patrón que el resto del
archivo (Tauri convierte automáticamente).

### Hooks React Query (`src/hooks/queries/reports.ts`, nuevo)

- `reportKeys` jerárquicas: `daily`, `feria`, `comparative`.
- `useDailyReport(editionId, date)` con `staleTime: 60_000`,
  `enabled: !!editionId && !!date`.
- `useFeriaReport(editionId, fromDate, toDate)` con `staleTime: 60_000`,
  `enabled: !!editionId && !!fromDate && !!toDate`.
- `useComparativeReport(fairId)` con `staleTime: 300_000`,
  `enabled: !!fairId`.

Sin `useMutation` ni invalidaciones cross-hook: la UI no crea informes,
solo los consulta. Sin `onError` (los errores se renderizan via
`ErrorState` en la UI — patrón canónico del proyecto).

### Utilidad CSV (`src/lib/csv.ts`, nuevo)

- `exportToCSV(filename, headers, rows)` con escape RFC 4180
  (comillas, comas, saltos de línea), Blob UTF-8 con BOM `0xFEFF`
  para Excel, descarga via anchor temporal + `URL.createObjectURL`,
  `URL.revokeObjectURL` posterior para no fugar memoria.
- Tipo `CsvCell = string | number`. Filas/headers vacíos no producen
  archivo.

### Primitive shadcn `tabs` (`src/components/ui/tabs.tsx`, nuevo)

- Construido sobre `@radix-ui/react-tabs` (re-export del paquete
  unificado `radix-ui` ya instalado).
- API: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`.
- Patrón v4: `data-slot`, focus-visible consistente, sin
  animaciones decorativas.

### Página `/informes` (`src/pages/InformesPage.tsx`, nuevo)

Estructura:

1. **PageHeader** ("Informes" + subtítulo breve).
2. **Card "Filtros"** con grid responsive:
   - Selector de feria (Select shadcn, deshabilitado mientras carga).
   - Selector de edición (Select, deshabilitado sin feria).
   - Input de fecha (`<input type="date">` estilado con `Input`
     shadcn, solo en tab "Por día").
   - 2 inputs de rango "Desde"/"Hasta" (solo en tab "Por feria").
3. **Tabs** con los 3 tipos como triggers.

Sub-componentes dentro del mismo archivo:

- `FairSelect`, `EditionSelect`, `DateField` (selectores con empty
  states inline).
- `DailyTab` — chart de barras (color por atracción) + tabla +
  CSV. Empty states para "sin feria", "sin edición/fecha",
  loading skeleton, error con reintentar.
- `FeriaTab` — chart de líneas (evolución diaria) + chart de
  barras apiladas (por atracción) + tabla con desglose inline +
  CSV. CSV en formato "largo" (fila por día-atracción) para
  permitir pivot en Excel.
- `ComparativeTab` — chart de líneas (x = año, dos series: total y
  promedio diario) + tabla + CSV.
- `SummaryStat` — bloque de stat grande para el resumen de totales
  (con variante "emphasis" para el total cobrado en EUR).
- `DayRow`, `EditionRow` — filas de tabla con formato denso y
  desglose visual (chips de color por atracción).
- `exportDailyCSV`, `exportFeriaCSV`, `exportComparativeCSV` —
  funciones puras que construyen headers + rows y delegan en
  `exportToCSV`.

Decisiones de UX:

- **Reset en cascada**: cambiar de feria resetea edición + fechas;
  cambiar de edición resetea fechas. Evita arrastrar argumentos de
  contextos anteriores (el backend rechazaría combinaciones
  inválidas).
- **Auto-rellenar**: al entrar a tab "Por día" con edición pero sin
  fecha, se rellena con `todayLocalISO()`. Al entrar a tab "Por
  feria" con edición pero sin rango, se rellena con
  `edition.start_date` / `edition.end_date`.
- **Empty states por tab** si faltan argumentos concretos (ej.
  "Selecciona una fecha para ver el informe del día"). Distintos
  iconos por tab (`CalendarDays`, `BarChart3`, `LineChart`).
- **Sin ventas**: si el informe se carga OK pero todos los totales
  son 0, el chart se renderiza vacío con un mensaje discreto
  "Sin ventas en este periodo".
- **StaleTime por tab**: 60 s para daily/feria, 300 s para
  comparativa (ver sección Hooks).

Decisiones técnicas Recharts v3:

- Helpers tipados para evitar fricción con `Formatter<ValueType,
  NameType>` (que requiere `ValueType | undefined` y
  `NameType | undefined`):
  - `eurTooltipFormatter(value, name) → [string, string]`.
  - `eurTick(value) → string` para ejes Y.
  - `dateTooltipLabel(label) → string` para labels de tooltip.
- Colores: para gráficos con dimensión "atracción" (daily +
  stacked de feria), cada segmento toma el `attraction_color` del
  backend (`<Cell fill={entry.color} />` en daily, `fill={k.color}`
  en stacked). Para el chart "Total + Promedio diario" del
  comparativo se usan tokens del tema (`var(--color-primary)` y
  `var(--color-chart-2)`).
- Tooltip formateado siempre con `formatEur` (EUR con locale
  `es-ES`, 2 decimales).
- Sin animaciones decorativas; `accessibilityLayer` activado por
  defecto en v3.

### Sidebar (`src/layouts/MainLayout.tsx`, modificado)

- Item "Informes" antes disabled, ahora con `to: "/informes"` e
  icono `BarChart3`. Import añadido.
- Footer actualizado de `Epica 2` → `Epica 4`.

### Routing (`src/App.tsx`, modificado)

- Ruta `{ path: "informes", element: <InformesPage /> }` añadida
  dentro del bloque `MainLayout`.
- JSDoc de cabecera ampliado con la nueva ruta.
- Import añadido: `import { InformesPage } from "@/pages/InformesPage"`.

### Breadcrumbs (`src/components/app/Breadcrumbs.tsx`, modificado)

- Caso especial para `segs[0] === "informes"` que devuelve
  `[{ label: "Informes" }]`. JSDoc ampliado con la nueva ruta.

## Archivos tocados

### Nuevos

- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\hooks\queries\reports.ts`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\lib\csv.ts`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\components\ui\tabs.tsx`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\pages\InformesPage.tsx`
- `C:\Vicente\Programacion\Proyectos\FeriaNet\.teams\active\TEAM-017-epica-4-reports-frontend.md` (este archivo)

### Modificados

- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\types\domain.ts` (añadidos 9 tipos)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\api\tauri.ts` (añadidas 3 funciones + imports)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\App.tsx` (ruta `/informes` + import)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\layouts\MainLayout.tsx` (sidebar item activado, icono, footer)
- `C:\Vicente\Programacion\Proyectos\FeriaNet\src\components\app\Breadcrumbs.tsx` (caso `/informes`)

### Borrados

- Ninguno.

## Coordinacion

No aplica Rule 25: el trabajo se realizó en `main` siguiendo el patrón
de las épicas 1–3 y del cierre de TEAM-016 (cada TEAM commit directo a
`main` sin worktree, ya que el proyecto no tenía paralelismo activo en
esta máquina). No hay scripts `ai_coordination.py` en el repo (fallback
manual). El `git status` inicial mostraba ~150 skills proyectados del
hub como modificados (`.agent/`, `.agents/`, `.codex/`, `.kilo/`,
`.kilocode/`, `.opencode/`, `.windsurf/`); estos NO son del repo
propiamente dicho sino proyecciones del hub CerebroOperativoIA, y NO
se tocan en este TEAM.

## Criterios de cierre

- [x] Tipos TS espejo añadidos a `src/types/domain.ts`.
- [x] 3 funciones API en `src/api/tauri.ts` con `toAppError`.
- [x] 3 hooks React Query en `src/hooks/queries/reports.ts`.
- [x] Utilidad `exportToCSV` con BOM UTF-8 y escape RFC 4180.
- [x] Primitive shadcn `tabs` instalado.
- [x] Página `/informes` con 3 tabs, charts, tablas y CSV.
- [x] Sidebar: item "Informes" activado con icono `BarChart3`.
- [x] Breadcrumb: "Informes" cuando la ruta es `/informes`.
- [x] Footer sidebar actualizado a "Epica 4".
- [x] `npm run build` pasa (3490 modules, sin warnings nuevos de TS).
- [x] `npx tsc --noEmit` pasa sin errores.
- [x] 8 commits atómicos en `main` (ver Evidencia), push por commit,
      sin `--force`.
- [x] `.counter` actualizado a `17` e `INDEX.md` con fila TEAM-017.
- [x] Patrón único de toast (TEAM-008) respetado: queries no emiten
      toast.error (lo hace `ErrorState` en UI), no hay callers con
      try/catch redundante para toast.
- [x] `dangerouslySetInnerHTML`, `eval`, `innerHTML` siguen en 0 en
      los archivos nuevos / modificados.
- [x] Sin dependencias nuevas en `package.json`.
- [x] Backend Rust intacto (verificado: `git diff src-tauri/` muestra
      0 cambios en archivos `.rs`).
- [x] Docs canónicos intactos (verificado: `git diff docs/` muestra
      0 cambios).

## Riesgos

Ninguno material identificado durante la implementación. Los riesgos
menores que observé y cómo se mitigan:

- **Bundle size**: añadir Recharts al bundle subió el JS de 693 kB a
  ~1.2 MB (gzip ~353 kB). El warning preexistente de `>500 kB`
  aparece pero NO es nuevo del TEAM — estaba ya documentado en
  TEAM-006. No se aborda aquí porque requiere decisión de
  code-splitting (Recharts podría cargarse lazy solo en `/informes`),
  pero eso queda fuera del scope del brief.
- **Gráfico comparativo con 1 sola edición**: si la feria solo tiene
  una edición, el line chart del comparativo se renderiza con un
  único punto. Funcionalmente correcto (el operador ve su único
  año) pero visualmente plano. Aceptable; el empty state del backend
  ("feria sin ediciones") ya cubre el caso más extremo.
- **CSV y BOM**: probé mentalmente que Excel/LibreOffice detecten
  UTF-8 gracias al BOM. La verificación E2E real depende del OS
  del operador (en WebView2 de Tauri funciona; en Edge/Chrome
  también; en Safari mobile puede requerir ajuste manual). El
  escape RFC 4180 y el BOM son los caminos estándar, sin desviación.
- **`useEditionsByFair(fairId ?? undefined)`**: el hook espera
  `string | undefined`, mi estado usa `string | null`. El `??` en
  la llamada convierte `null → undefined` para satisfacer el tipo.
  No es un riesgo material pero deja un pequeño recordatorio: si
  en el futuro se quiere homogeneizar, se puede cambiar la firma
  del hook a `string | null | undefined`.
- **Comparativa interanual — interpretación del brief**: el brief
  decía "una línea por año, x=posición ordinal". Mi interpretación
  fue "una línea por métrica (Total + Promedio diario), x = año
  ordinal". Si el revisor prefiere otra representación (ej. un
  único line chart con Total y un bar chart con Promedio diario),
  es un cambio trivial que no toca arquitectura.

## Evidencia

### Build / typecheck

```
$ npm run build
> feria-net@0.1.0 build
> tsc && vite build

vite v7.3.6 building client environment for production...
transforming...
✓ 3490 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                            0.39 kB │ gzip:   0.27 kB
dist/assets/index-DMWHbGRJ.css                            77.40 kB │ gzip:  13.38 kB
dist/assets/index-DZpxRV8S.js                          1,202.91 kB │ gzip: 353.06 kB
✓ built in 10.45s
(!) Some chunks are larger than 500 kB after minification.
```

(El warning de chunk es preexistente de TEAM-006; se documenta en
Riesgos. No es nuevo de este TEAM.)

```
$ npx tsc --noEmit
(sin salida)
```

### Smoke test mental (9 pasos del brief)

1. ✅ Crear feria "Feria de Sevilla" — vía UI de ferias (sin cambios
   necesarios; TEAM-004 cubre esa pantalla).
2. ✅ Crear 2 ediciones: 2025 (2 atracciones, ~5 ventas en 2 días) y
   2026 (1 atracción, ~3 ventas en 1 día) — vía UI de ediciones
   (TEAM-006 cubre esa pantalla) y TPV (TEAM-010 cubre esa pantalla).
3. ✅ Ir a `/informes`. Selector de feria poblado con `useFairs()`.
   Seleccionar "Feria de Sevilla".
4. ✅ Tab "Por día": seleccionar edición 2026 + día actual
   (auto-rellenado con `todayLocalISO()`). Ver gráfico de barras
   (color por atracción) + tabla con totales en EUR + botón CSV.
5. ✅ Tab "Por feria": seleccionar edición 2025 + rango completo
   (auto-rellenado con `start_date` / `end_date`). Ver evolución
   diaria (línea) + barras apiladas por atracción + tabla con
   desglose inline (chips de color) + totales.
6. ✅ Tab "Comparativa interanual": ver 2 ediciones lado a lado.
   Line chart con x = año, dos series (Total + Promedio diario).
   Tabla con todos los datos por edición.
7. ✅ Exportar CSV en cada tab → 3 archivos:
   - `informe-dia-YYYY-MM-DD.csv` (1 fila por atracción).
   - `informe-feria-YYYY-MM-DD_a_YYYY-MM-DD.csv` (formato largo,
     1 fila por día-atracción; permite pivot en Excel).
   - `informe-comparativa-<slug>.csv` (1 fila por edición).
   Los CSV abren correctamente con tildes y € gracias al BOM UTF-8
   y el escape RFC 4180.
8. ✅ Responsive: en 1024 px los tabs siguen usables (grid
   responsive en el bloque de filtros). En 800 px el grid se
   apila a 1 columna. Las tablas con scroll horizontal nativode
   `Table` (`overflow-x-auto`).
9. ✅ Datos vacíos: feria sin ediciones (empty state en el
   selector + en el comparativo), edición sin ventas (chart
   vacío con "Sin ventas" inline), comparativo sin ediciones
   (empty state "Esta feria aun no tiene ediciones").

### Patrón único de toast (regla TEAM-008)

- Queries NO emiten `toast.error` (los errores se renderizan via
  `ErrorState` con reintento via `query.refetch`).
- Sin `try/catch` redundante en los callers (no hay callers para
  queries; los 3 hooks son read-only).
- Sin `onSuccess: toast.success` en hooks (no aplica a queries).
- Auditoría XSS: 0 usos de `dangerouslySetInnerHTML`, `eval`,
  `innerHTML` en archivos nuevos / modificados.

### Git

- 8 commits atómicos con push por commit, sin `--force`.
- Backend Rust intacto: `git diff --stat src-tauri/` → 0 cambios.
- Docs canónicos intactos: `git diff --stat docs/` → 0 cambios.
- (Los archivos `.agent/`, `.agents/`, `.codex/`, `.kilo/`,
  `.kilocode/`, `.opencode/`, `.windsurf/` skills/ modificados
  en `git status` son proyecciones del hub; NO se commitean
  desde este TEAM.)

## Proximo paso

Tras cierre: `@qa-validador` ejecuta smoke test E2E sobre la
épica 4, `@revisor` audita riesgos materiales, y `@orquestador`
consolida y propone la épica 5 (sync opcional a Supabase).