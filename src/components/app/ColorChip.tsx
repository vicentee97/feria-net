/**
 * components/app/ColorChip.tsx — FeriaNet
 *
 * Chip visual del color identificativo de una atraccion.
 * Renderiza el hex como fondo con buen contraste de texto (blanco si
 * el color es oscuro, negro si es claro). Pensado para listados
 * densos: 24x24 px en lineas de tabla.
 */

import { cn } from "@/lib/utils";

interface ColorChipProps {
  color: string;
  className?: string;
  /** Tamano en px (cuadrado). Default 24. */
  size?: number;
  withHex?: boolean;
}

export function ColorChip({
  color,
  className,
  size = 24,
  withHex = false,
}: ColorChipProps) {
  const { bg } = pickContrast(color);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-md ring-1 ring-inset ring-black/5 dark:ring-white/10",
        className,
      )}
    >
      <span
        className="block shrink-0 rounded-[5px]"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
        }}
        aria-hidden="true"
      />
      {withHex && (
        <span
          className="text-xs font-mono uppercase"
          style={{ color: bg }}
          title={color}
        >
          {color}
        </span>
      )}
    </span>
  );
}

/**
 * Devuelve el color de texto con mejor contraste frente al fondo.
 * Usa el calculo de luminancia W3C (https://www.w3.org/WAI/GL/wiki/Relative_luminance).
 */
function pickContrast(hex: string): { fg: string; bg: string } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { fg: "#000", bg: hex };
  const v = m[1];
  const r = parseInt(v.slice(0, 2), 16) / 255;
  const g = parseInt(v.slice(2, 4), 16) / 255;
  const b = parseInt(v.slice(4, 6), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const fg = lum > 0.55 ? "#111" : "#fff";
  return { fg, bg: hex };
}
