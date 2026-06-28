/**
 * pages/InformesPage.tsx — FeriaNet
 *
 * Pantalla de informes v1 (epica 4 / TEAM-017). Cubre los 3 tipos:
 *  - Por dia:        totales por atraccion + total general del dia.
 *  - Por feria:      totales agregados de una edicion sobre un rango.
 *  - Comparativa:    misma feria en ediciones de anos distintos.
 *
 * Estructura visual:
 *  - Cabecera + subtitulo breve.
 *  - Card "Filtros" con selector de feria, edicion, fecha o rango
 *    (los selectores se muestran/ocultan segun el tab activo).
 *  - Tabs shadcn (`components/ui/tabs`) para alternar entre los 3.
 *  - Cada tab renderiza su chart + tabla + boton de exportacion CSV.
 *
 * Decisiones de diseno (UX):
 *  - Selector de feria obligatorio para empezar; el resto se adapta.
 *  - Al cambiar de feria, se resetean edicion y resto de filtros.
 *  - Al cambiar de edicion en tab "Por feria", el rango se auto-rellena
 *    con `start_date` / `end_date` de la edicion (la primera vez).
 *  - Al cambiar de tab "Por dia" sin fecha, se auto-rellena con hoy.
 *  - Empty state por tab si faltan sus argumentos concretos
 *    (ej: "Selecciona una fecha para ver el informe del dia").
 *  - Si hay argumentos pero no hay ventas, el chart se pinta vacio
 *    con un aviso discreto "Sin ventas en este periodo".
 *
 * Decisiones tecnicas:
 *  - Recharts v3 (ya en `package.json`). El chart usa
 *    `ResponsiveContainer` + `BarChart` / `LineChart` con `accessibilityLayer`
 *    activado por defecto.
 *  - Sin `react-day-picker`: `<input type="date">` nativo, estilado con
 *    el primitive `Input` de shadcn.
 *  - Sin estado global: `useState` local. Los hooks de React Query
 *    cachean por combinacion de argumentos (keys en `reports.ts`).
 *  - Errores via `ErrorState` con `onRetry = query.refetch`. No se
 *    emiten `toast.error` desde queries (patron canonico del proyecto).
 *
 * Accesibilidad:
 *  - Cada tab tiene `aria-label` implicito via TabsPrimitive.
 *  - Los inputs de fecha llevan `<label>` asociado via `Field`/`FieldLabel`.
 *  - Los charts exponen titulo y descripcion accesibles (props
 *    `title` / `description` de Recharts v3).
 */

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, CalendarDays, Download, LineChart as LineChartIcon, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ColorChip } from "@/components/app/ColorChip";
import { EmptyState } from "@/components/app/EmptyState";
import { ErrorState } from "@/components/app/ErrorState";
import { ListSkeleton } from "@/components/app/LoadingState";
import { PageHeader } from "@/components/app/PageHeader";
import { useEditionsByFair } from "@/hooks/queries/editions";
import { useFairs } from "@/hooks/queries/fairs";
import {
  useComparativeReport,
  useDailyReport,
  useFeriaReport,
} from "@/hooks/queries/reports";
import { exportToCSV } from "@/lib/csv";
import { formatLocalDate, todayLocalISO } from "@/lib/datetime";
import { formatEur } from "@/lib/money";

import type { AttractionReport, ComparativeEdition, DayReport } from "@/types/domain";

// ============================================================
// Tipos auxiliares del modulo (no exportados; uso interno)
// ============================================================

type TabKey = "daily" | "feria" | "comparative";

/** Recharts pasa `value` como `number | string | (number|string)[]`. */
type TickFormatter = (value: number | string) => string;

// Formateador canonico para ticks y tooltips EUR. Usado por todos
// los charts de la pagina para mantener consistencia visual.
const eurTick: TickFormatter = (v) =>
  typeof v === "number" ? formatEur(v) : String(v);

/**
 * Formatter para `<Tooltip>` de Recharts v3. La firma coincide
 * exactamente con `Formatter<ValueType, NameType>` de recharts, donde
 * `ValueType = number | string | ReadonlyArray<number | string>` y
 * `NameType = number | string` (ambos `| undefined` en el callable).
 * Devuelve `[display, name]` para que Recharts respete tanto el valor
 * formateado como la etiqueta del `dataKey`.
 */
function eurTooltipFormatter(
  value:
    | number
    | string
    | readonly (number | string)[]
    | undefined,
  name: number | string | undefined,
): [string, string] {
  const display =
    typeof value === "number"
      ? formatEur(value)
      : Array.isArray(value)
        ? value.map((v) => (typeof v === "number" ? formatEur(v) : String(v))).join(", ")
        : String(value ?? "");
  return [display, String(name ?? "")];
}

/** labelFormatter para fechas: convierte a `dd/MM/yyyy`. */
function dateTooltipLabel(label: unknown): string {
  return formatLocalDate(typeof label === "string" ? label : String(label ?? ""));
}

// ============================================================
// Pagina principal
// ============================================================

export function InformesPage() {
  // --- Estado de filtros (controlado por el usuario) ---
  const [fairId, setFairId] = useState<string | null>(null);
  const [editionId, setEditionId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("daily");

  // --- Datos de selectores ---
  const fairsQuery = useFairs();
  const editionsQuery = useEditionsByFair(fairId ?? undefined);
  const selectedEdition = useMemo(
    () =>
      fairId && editionId
        ? editionsQuery.data?.find((e) => e.id === editionId) ?? null
        : null,
    [editionsQuery.data, fairId, editionId],
  );

  // Reset en cascada al cambiar de feria.
  // Si el usuario cambia la feria, no queremos arrastrar edicion/fechas
  // de una feria anterior porque el backend rechazaria el informe o
  // devolveria datos incoherentes.
  useEffect(() => {
    setEditionId(null);
    setDate(null);
    setFromDate(null);
    setToDate(null);
  }, [fairId]);

  // Reset de fechas al cambiar de edicion.
  useEffect(() => {
    setDate(null);
    setFromDate(null);
    setToDate(null);
  }, [editionId]);

  // Al cambiar de tab, no reseteamos el estado del usuario
  // (puede querer volver atras sin perder lo que escribio). Pero
  // cuando entran al tab y hay edicion + fechas vacias, los
  // auto-rellenamos mas abajo.

  // Auto-rellenar fecha del tab "Por dia" al enfocarlo.
  useEffect(() => {
    if (tab === "daily" && editionId && !date) {
      setDate(todayLocalISO());
    }
  }, [tab, editionId, date]);

  // Auto-rellenar rango del tab "Por feria" al enfocarlo.
  useEffect(() => {
    if (tab === "feria" && selectedEdition) {
      if (!fromDate) setFromDate(selectedEdition.start_date);
      if (!toDate) setToDate(selectedEdition.end_date);
    }
  }, [tab, selectedEdition, fromDate, toDate]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        title="Informes"
        subtitle="Consulta las ventas por dia, por feria o comparalas entre anos."
      />

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Selecciona una feria para empezar. Los demas filtros se adaptan
            al tipo de informe que elijas abajo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <FairSelect
              value={fairId}
              onChange={setFairId}
              fairs={fairsQuery.data ?? []}
              loading={fairsQuery.isPending}
              error={fairsQuery.isError ? fairsQuery.error : null}
              onRetry={() => fairsQuery.refetch()}
            />
            {tab !== "comparative" && (
              <EditionSelect
                value={editionId}
                onChange={setEditionId}
                disabled={!fairId || editionsQuery.isPending}
                editions={editionsQuery.data ?? []}
                loading={editionsQuery.isPending}
              />
            )}
            {tab === "daily" && (
              <DateField
                label="Fecha"
                value={date}
                onChange={setDate}
                disabled={!editionId}
              />
            )}
            {tab === "feria" && (
              <>
                <DateField
                  label="Desde"
                  value={fromDate}
                  onChange={setFromDate}
                  disabled={!editionId}
                />
                <DateField
                  label="Hasta"
                  value={toDate}
                  onChange={setToDate}
                  disabled={!editionId}
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as TabKey)}
      >
        <TabsList>
          <TabsTrigger value="daily">
            <CalendarDays className="size-4" />
            Por dia
          </TabsTrigger>
          <TabsTrigger value="feria">
            <BarChart3 className="size-4" />
            Por feria
          </TabsTrigger>
          <TabsTrigger value="comparative">
            <LineChartIcon className="size-4" />
            Comparativa interanual
          </TabsTrigger>
        </TabsList>
        <TabsContent value="daily">
          <DailyTab
            fairId={fairId}
            editionId={editionId}
            date={date}
          />
        </TabsContent>
        <TabsContent value="feria">
          <FeriaTab
            fairId={fairId}
            editionId={editionId}
            fromDate={fromDate}
            toDate={toDate}
          />
        </TabsContent>
        <TabsContent value="comparative">
          <ComparativeTab fairId={fairId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// Sub-componente: Selector de feria
// ============================================================

interface FairSelectProps {
  value: string | null;
  onChange: (v: string | null) => void;
  fairs: { id: string; name: string }[];
  loading: boolean;
  error: unknown;
  onRetry: () => void;
}

function FairSelect({
  value,
  onChange,
  fairs,
  loading,
  error,
  onRetry,
}: FairSelectProps) {
  if (error) {
    return (
      <Field>
        <FieldLabel>Feria</FieldLabel>
        <ErrorState
          error={error}
          onRetry={onRetry}
          title="No se pudieron cargar las ferias"
        />
      </Field>
    );
  }
  return (
    <Field>
      <FieldLabel>Feria</FieldLabel>
      <Select
        value={value ?? ""}
        onValueChange={(v) => onChange(v || null)}
      >
        <SelectTrigger className="w-full" disabled={loading}>
          <SelectValue
            placeholder={loading ? "Cargando ferias..." : "Selecciona una feria"}
          />
        </SelectTrigger>
        <SelectContent>
          {fairs.length === 0 && !loading && (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              Aun no tienes ferias. Crea una desde la seccion Ferias.
            </div>
          )}
          {fairs.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

// ============================================================
// Sub-componente: Selector de edicion
// ============================================================

interface EditionSelectProps {
  value: string | null;
  onChange: (v: string | null) => void;
  editions: { id: string; year: number; status: string }[];
  loading: boolean;
  disabled: boolean;
}

function EditionSelect({
  value,
  onChange,
  editions,
  loading,
  disabled,
}: EditionSelectProps) {
  return (
    <Field>
      <FieldLabel>Edicion</FieldLabel>
      <Select
        value={value ?? ""}
        onValueChange={(v) => onChange(v || null)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={
              !disabled
                ? "Selecciona una feria primero"
                : loading
                  ? "Cargando ediciones..."
                  : "Selecciona una edicion"
            }
          />
        </SelectTrigger>
        <SelectContent>
          {editions.length === 0 && !loading && (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              Esta feria no tiene ediciones todavia.
            </div>
          )}
          {editions.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              Edicion {e.year}
              {e.status === "active" ? " (en curso)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

// ============================================================
// Sub-componente: Input de fecha
// ============================================================

interface DateFieldProps {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  disabled: boolean;
}

function DateField({ label, value, onChange, disabled }: DateFieldProps) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Input
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
      />
      {disabled && (
        <FieldDescription>
          Selecciona una edicion para poder fijar la fecha.
        </FieldDescription>
      )}
    </Field>
  );
}

// ============================================================
// Tab "Por dia"
// ============================================================

interface DailyTabProps {
  fairId: string | null;
  editionId: string | null;
  date: string | null;
}

function DailyTab({ fairId, editionId, date }: DailyTabProps) {
  const query = useDailyReport(editionId, date);
  const report = query.data;

  if (!fairId) {
    return (
      <EmptyState
        icon={<TrendingUp className="size-5" />}
        title="Selecciona una feria"
        description="Elige una feria arriba para empezar a consultar informes."
      />
    );
  }
  if (!editionId || !date) {
    return (
      <EmptyState
        icon={<CalendarDays className="size-5" />}
        title="Selecciona una edicion y una fecha"
        description="El informe del dia muestra las ventas de una fecha concreta."
      />
    );
  }
  if (query.isPending) {
    return <ListSkeleton rows={4} />;
  }
  if (query.isError) {
    return (
      <ErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        title="No se pudo cargar el informe del dia"
      />
    );
  }
  if (!report) return null;

  const chartData = report.attractions.map((a) => ({
    name: a.attraction_name,
    color: a.attraction_color,
    total: a.totals.total_amount_cents,
    tickets: a.totals.total_tickets,
  }));

  const hasAnySales = report.totals.total_sales > 0;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Resumen del dia</CardTitle>
          <CardDescription>
            {report.fair_name} - Edicion {report.edition_year} -{" "}
            {formatLocalDate(report.date)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryStat
              label="Ventas registradas"
              value={report.totals.total_sales.toString()}
            />
            <SummaryStat
              label="Tickets vendidos"
              value={report.totals.total_tickets.toString()}
            />
            <SummaryStat
              label="Total cobrado"
              value={formatEur(report.totals.total_amount_cents)}
              emphasis
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total por atraccion</CardTitle>
          <CardDescription>
            Distribucion del importe total del dia entre atracciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={chartData.length > 4 ? -15 : 0}
                  textAnchor={chartData.length > 4 ? "end" : "middle"}
                  height={chartData.length > 4 ? 60 : 30}
                />
                <YAxis tickFormatter={eurTick} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={eurTooltipFormatter}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Bar dataKey="total" name="Total EUR">
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {!hasAnySales && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Sin ventas en este dia.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Detalle por atraccion</CardTitle>
            <CardDescription>
              Una fila por atraccion. Los totales coinciden con el grafico.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportDailyCSV(report)}
          >
            <Download className="size-4" />
            Exportar CSV
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Atraccion</TableHead>
                <TableHead>Color</TableHead>
                <TableHead className="text-right">Ventas</TableHead>
                <TableHead className="text-right">Tickets</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.attractions.map((a) => (
                <TableRow key={a.attraction_id}>
                  <TableCell className="font-medium">
                    {a.attraction_name}
                  </TableCell>
                  <TableCell>
                    <ColorChip color={a.attraction_color} size={18} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {a.totals.total_sales}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {a.totals.total_tickets}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatEur(a.totals.total_amount_cents)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function exportDailyCSV(report: {
  date: string;
  attractions: AttractionReport[];
}): void {
  const dateSlug = report.date;
  const rows: (string | number)[][] = report.attractions.map((a) => [
    a.attraction_name,
    a.attraction_color,
    a.totals.total_sales,
    a.totals.total_tickets,
    (a.totals.total_amount_cents / 100).toFixed(2),
  ]);
  exportToCSV(
    `informe-dia-${dateSlug}.csv`,
    ["Atraccion", "Color", "Ventas", "Tickets", "Total EUR"],
    rows,
  );
}

// ============================================================
// Tab "Por feria"
// ============================================================

interface FeriaTabProps {
  fairId: string | null;
  editionId: string | null;
  fromDate: string | null;
  toDate: string | null;
}

function FeriaTab({ fairId, editionId, fromDate, toDate }: FeriaTabProps) {
  const query = useFeriaReport(editionId, fromDate, toDate);
  const report = query.data;

  if (!fairId) {
    return (
      <EmptyState
        icon={<TrendingUp className="size-5" />}
        title="Selecciona una feria"
        description="Elige una feria arriba para empezar a consultar informes."
      />
    );
  }
  if (!editionId || !fromDate || !toDate) {
    return (
      <EmptyState
        icon={<BarChart3 className="size-5" />}
        title="Selecciona una edicion y un rango"
        description="El informe por feria agrega las ventas entre dos fechas."
      />
    );
  }
  if (query.isPending) {
    return <ListSkeleton rows={6} />;
  }
  if (query.isError) {
    return (
      <ErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        title="No se pudo cargar el informe por feria"
      />
    );
  }
  if (!report) return null;

  // Datos para el chart de lineas (evolucion diaria).
  const lineData = report.days.map((d) => ({
    date: d.date,
    total: d.totals.total_amount_cents,
  }));

  // Datos para el chart de barras apiladas: por dia, una columna
  // por atraccion con su color.
  const stackKeys = report.by_attraction.map((a) => ({
    name: a.attraction_name,
    color: a.attraction_color,
  }));
  const stackData = report.days.map((d) => {
    const row: Record<string, string | number> = { date: d.date };
    for (const key of stackKeys) {
      const dayAttr = d.attractions.find(
        (a) => a.attraction_name === key.name,
      );
      row[key.name] = dayAttr ? dayAttr.totals.total_amount_cents : 0;
    }
    return row;
  });

  const hasAnySales = report.totals.total_sales > 0;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Resumen del periodo</CardTitle>
          <CardDescription>
            {report.fair_name} - Edicion {report.edition_year} -{" "}
            {formatLocalDate(report.from_date)} a{" "}
            {formatLocalDate(report.to_date)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryStat
              label="Ventas registradas"
              value={report.totals.total_sales.toString()}
            />
            <SummaryStat
              label="Tickets vendidos"
              value={report.totals.total_tickets.toString()}
            />
            <SummaryStat
              label="Total cobrado"
              value={formatEur(report.totals.total_amount_cents)}
              emphasis
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evolucion diaria</CardTitle>
          <CardDescription>
            Importe total cobrado por cada dia del periodo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineData}
                margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => formatLocalDate(v)}
                />
                <YAxis tickFormatter={eurTick} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={eurTooltipFormatter}
                  labelFormatter={dateTooltipLabel}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total EUR"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {!hasAnySales && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Sin ventas en este periodo.
            </p>
          )}
        </CardContent>
      </Card>

      {stackKeys.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Desglose por atraccion</CardTitle>
            <CardDescription>
              Como se reparten los ingresos entre atracciones en cada dia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stackData}
                  margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={dateTooltipLabel}
                  />
                  <YAxis tickFormatter={eurTick} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={eurTooltipFormatter}
                    labelFormatter={dateTooltipLabel}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {stackKeys.map((k) => (
                    <Bar
                      key={k.name}
                      dataKey={k.name}
                      stackId="a"
                      fill={k.color}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Detalle por dia</CardTitle>
            <CardDescription>
              Totales diarios con desglose por atraccion.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportFeriaCSV(report)}
          >
            <Download className="size-4" />
            Exportar CSV
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Ventas</TableHead>
                <TableHead className="text-right">Tickets</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Desglose</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.days.map((d) => (
                <DayRow key={d.date} day={d} />
              ))}
              {report.days.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-6 text-center text-sm text-muted-foreground"
                  >
                    No hay dias operados en este periodo.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function DayRow({ day }: { day: DayReport }) {
  // Desglose visual: cada atraccion con su chip de color y su total.
  return (
    <TableRow>
      <TableCell className="font-medium">
        {formatLocalDate(day.date)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {day.totals.total_sales}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {day.totals.total_tickets}
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {formatEur(day.totals.total_amount_cents)}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-2">
          {day.attractions
            .filter((a) => a.totals.total_amount_cents > 0)
            .map((a) => (
              <span
                key={a.attraction_id}
                className="inline-flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-0.5 text-xs"
              >
                <ColorChip color={a.attraction_color} size={12} />
                <span className="font-medium">{a.attraction_name}</span>
                <span className="text-muted-foreground tabular-nums">
                  {formatEur(a.totals.total_amount_cents)}
                </span>
              </span>
            ))}
          {day.attractions.every(
            (a) => a.totals.total_amount_cents === 0,
          ) && (
            <span className="text-xs text-muted-foreground">
              Sin ventas
            </span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function exportFeriaCSV(report: {
  from_date: string;
  to_date: string;
  days: DayReport[];
  by_attraction: AttractionReport[];
}): void {
  // CSV "largo": una fila por (dia, atraccion). Permite reconstruir
  // cualquier pivot en Excel/Sheets sin perdida.
  const headers = [
    "Fecha",
    "Atraccion",
    "Color",
    "Ventas",
    "Tickets",
    "Total EUR",
  ];
  const rows: (string | number)[][] = [];
  for (const d of report.days) {
    for (const a of d.attractions) {
      rows.push([
        d.date,
        a.attraction_name,
        a.attraction_color,
        a.totals.total_sales,
        a.totals.total_tickets,
        (a.totals.total_amount_cents / 100).toFixed(2),
      ]);
    }
  }
  const slug = `${report.from_date}_a_${report.to_date}`;
  exportToCSV(`informe-feria-${slug}.csv`, headers, rows);
}

// ============================================================
// Tab "Comparativa interanual"
// ============================================================

interface ComparativeTabProps {
  fairId: string | null;
}

function ComparativeTab({ fairId }: ComparativeTabProps) {
  const query = useComparativeReport(fairId);
  const report = query.data;

  if (!fairId) {
    return (
      <EmptyState
        icon={<TrendingUp className="size-5" />}
        title="Selecciona una feria"
        description="La comparativa interanual muestra todas las ediciones de una misma feria."
      />
    );
  }
  if (query.isPending) {
    return <ListSkeleton rows={4} />;
  }
  if (query.isError) {
    return (
      <ErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        title="No se pudo cargar la comparativa"
      />
    );
  }
  if (!report) return null;

  if (report.editions.length === 0) {
    return (
      <EmptyState
        icon={<LineChartIcon className="size-5" />}
        title="Esta feria aun no tiene ediciones"
        description="Crea una edicion para empezar a comparar anos."
      />
    );
  }

  const lineData = report.editions.map((e) => ({
    year: e.year,
    label: String(e.year),
    total: e.totals.total_amount_cents,
    avgDaily: e.avg_daily_amount_cents,
  }));

  const hasAnySales = report.editions.some(
    (e) => e.totals.total_sales > 0,
  );

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Comparativa interanual</CardTitle>
          <CardDescription>
            {report.fair_name} - {report.editions.length}{" "}
            {report.editions.length === 1 ? "edicion" : "ediciones"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineData}
                margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  type="category"
                />
                <YAxis tickFormatter={eurTick} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={eurTooltipFormatter}
                  labelFormatter={(label) => `Edicion ${String(label ?? "")}`}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="avgDaily"
                  name="Promedio diario"
                  stroke="var(--color-chart-2, #6366f1)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {!hasAnySales && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Ninguna edicion tiene ventas registradas.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Detalle por edicion</CardTitle>
            <CardDescription>
              Totales agregados de cada edicion de la feria.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportComparativeCSV(report)}
          >
            <Download className="size-4" />
            Exportar CSV
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ano</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead className="text-right">Dias operados</TableHead>
                <TableHead className="text-right">Ventas</TableHead>
                <TableHead className="text-right">Tickets</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Promedio diario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.editions.map((e) => (
                <EditionRow key={e.edition_id} edition={e} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function EditionRow({ edition }: { edition: ComparativeEdition }) {
  return (
    <TableRow>
      <TableCell className="font-medium tabular-nums">
        {edition.year}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatLocalDate(edition.start_date)} -{" "}
        {formatLocalDate(edition.end_date)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {edition.days_count}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {edition.totals.total_sales}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {edition.totals.total_tickets}
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {formatEur(edition.totals.total_amount_cents)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatEur(edition.avg_daily_amount_cents)}
      </TableCell>
    </TableRow>
  );
}

function exportComparativeCSV(report: {
  fair_name: string;
  editions: ComparativeEdition[];
}): void {
  const slug = report.fair_name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "feria";
  const rows: (string | number)[][] = report.editions.map((e) => [
    e.year,
    e.start_date,
    e.end_date,
    e.days_count,
    e.totals.total_sales,
    e.totals.total_tickets,
    (e.totals.total_amount_cents / 100).toFixed(2),
    (e.avg_daily_amount_cents / 100).toFixed(2),
  ]);
  exportToCSV(
    `informe-comparativa-${slug}.csv`,
    [
      "Ano",
      "Desde",
      "Hasta",
      "Dias operados",
      "Ventas",
      "Tickets",
      "Total EUR",
      "Promedio diario EUR",
    ],
    rows,
  );
}

// ============================================================
// Sub-componente: stat grande del resumen
// ============================================================

interface SummaryStatProps {
  label: string;
  value: string;
  emphasis?: boolean;
}

function SummaryStat({ label, value, emphasis }: SummaryStatProps) {
  return (
    <div
      className={
        emphasis
          ? "rounded-lg border bg-primary/5 p-4"
          : "rounded-lg border bg-muted/30 p-4"
      }
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={
          emphasis
            ? "mt-1 text-2xl font-semibold tabular-nums text-primary"
            : "mt-1 text-2xl font-semibold tabular-nums"
        }
      >
        {value}
      </p>
    </div>
  );
}