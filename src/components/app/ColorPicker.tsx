/**
 * components/app/ColorPicker.tsx — FeriaNet
 *
 * Selector de color identificativo de una atraccion. Combina un input
 * nativo HTML5 `<input type="color">` (maxima compatibilidad y a11y)
 * con un preview visual y un campo editable del hex.
 *
 * Valor controlado: string `#RRGGBB`. Si se externaliza vacio, se
 * mantiene vacio (sin fallback) para que el formulario pueda mostrar
 * el mensaje de error.
 */

import { useId } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  id?: string;
  label?: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  /** Mensaje de error a mostrar debajo del campo. */
  error?: string;
  className?: string;
  disabled?: boolean;
}

export function ColorPicker({
  id,
  label,
  description,
  value,
  onChange,
  error,
  className,
  disabled,
}: ColorPickerProps) {
  const reactId = useId();
  const inputId = id ?? `color-${reactId}`;
  const hexId = `${inputId}-hex`;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label htmlFor={inputId} className="text-sm">
          {label}
        </Label>
      )}
      <div className="flex items-center gap-2">
        <label
          htmlFor={inputId}
          className={cn(
            "relative inline-flex h-9 w-12 shrink-0 cursor-pointer items-center justify-center rounded-md border border-input ring-offset-background transition-colors",
            "hover:border-foreground/30 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <span
            className="block size-6 rounded-[4px] ring-1 ring-inset ring-black/10 dark:ring-white/20"
            style={{ backgroundColor: value || "#000000" }}
            aria-hidden="true"
          />
          <input
            id={inputId}
            type="color"
            value={normalizeHex(value) || "#000000"}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            disabled={disabled}
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
            aria-label={label ?? "Color identificativo"}
          />
        </label>
        <Input
          id={hexId}
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="#RRGGBB"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="font-mono uppercase"
          aria-invalid={Boolean(error)}
          aria-describedby={
            description ? `${inputId}-desc` : error ? `${inputId}-err` : undefined
          }
        />
      </div>
      {description && !error && (
        <p
          id={`${inputId}-desc`}
          className="text-xs text-muted-foreground"
        >
          {description}
        </p>
      )}
      {error && (
        <p id={`${inputId}-err`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function normalizeHex(value: string): string | null {
  if (!value) return null;
  const m = /^#?([0-9a-fA-F]{6})$/.exec(value.trim());
  if (!m) return null;
  return `#${m[1].toLowerCase()}`;
}
