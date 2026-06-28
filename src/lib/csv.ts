/**
 * lib/csv.ts — FeriaNet
 *
 * Exportacion CSV client-side para los informes (epica 4).
 *
 * Convierte una tabla logica (`headers` + `rows`) en un Blob UTF-8
 * con BOM para que Excel/LibreOffice reconozcan tildes y la letra
 * `euros` al abrir, y dispara la descarga via anchor temporal.
 *
 * Reglas operativas:
 *  - Escape segun RFC 4180: comillas, comas y saltos de linea
 *    envuelven la celda en `"` y duplican las comillas internas.
 *  - Numeros se serializan tal cual (sin formato local). El usuario
 *    vera `1234.56`. Esto es intencionado: el CSV es para analisis,
 *    no para imprimir.
 *  - Filas y headers vacios no producen archivo.
 *  - Se libera el `ObjectURL` tras el `click()` para no fugar memoria.
 *
 * Uso:
 *   exportToCSV(
 *     "informe-dia-2026-05-12.csv",
 *     ["Fecha", "Atraccion", "Ventas", "Tickets", "Total EUR"],
 *     [["2026-05-12", "Camas elasticas", 3, 12, 84]],
 *   )
 */

export type CsvCell = string | number;

export function exportToCSV(
  filename: string,
  headers: readonly string[],
  rows: readonly (readonly CsvCell[])[],
): void {
  if (headers.length === 0) return;

  const escape = (v: CsvCell): string => {
    const s = typeof v === "number" ? String(v) : v;
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines: string[] = [];
  lines.push(headers.map(escape).join(","));
  for (const row of rows) {
    lines.push(row.map(escape).join(","));
  }
  // `\n` es lo que esperan Excel/LO en Windows. CRLF tambien funciona
  // pero `\n` es suficiente y evita line-ending mixto si el SO del
  // operador es exotico.
  const csv = lines.join("\n");

  // BOM UTF-8 (0xFEFF) para que Excel detecte la codificacion y
  // muestre tildes y `~n` correctamente sin pedir confirmacion.
  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  // `a` no necesita estar en el DOM para que `click()` dispare la
  // descarga en navegadores modernos (incl. WebView2 de Tauri).
  a.click();
  URL.revokeObjectURL(url);
}