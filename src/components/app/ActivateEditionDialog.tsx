/**
 * components/app/ActivateEditionDialog.tsx — FeriaNet
 *
 * Dialog de confirmacion para la regla de negocio "una sola edicion
 * `active` por feria" (data-model §5.10). El backend NO enforcea esta
 * regla, asi que el frontend la protege visualmente: cuando el usuario
 * intenta activar una edicion y ya hay otra activa de la misma feria,
 * aparece este dialog con dos opciones:
 *
 *   1. Cancelar.
 *   2. Cerrar la otra y activar esta (secuencia de dos commands Tauri).
 *
 * El dialog es reutilizable: lo invocan `EdicionDetallePage`,
 * `EdicionNuevaPage` y `EdicionEditarPage` con labels y callbacks
 * concretos.
 *
 * IMPORTANTE (R1): la secuencia `close + activate` es NO transaccional.
 * Si la 2ª llamada falla, la edicion activa actual queda cerrada pero
 * la nueva NO queda activa. El caller muestra el toast de error y deja
 * el estado como este; el operador puede reintentar la activacion
 * desde el dropdown de detalle (ya sin conflicto, porque la otra esta
 * cerrada). El backend-enforcement queda como deuda (TEAM-007+).
 */

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ActivateEditionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Etiqueta visible de la edicion objetivo (la que se quiere activar). */
  targetLabel: string;
  /** Etiqueta visible de la edicion que ya esta activa y bloquearia la nueva. */
  conflictLabel: string;
  /** Callback al pulsar "Cerrar otra y activar esta". Debe lanzar si falla. */
  onConfirm: () => Promise<unknown> | unknown;
  /** Estado de carga; mientras esta `true`, los botones quedan disabled. */
  busy?: boolean;
  /** Slot opcional para contexto adicional (ej. advertencia sobre R1). */
  extraNote?: ReactNode;
}

export function ActivateEditionDialog({
  open,
  onOpenChange,
  targetLabel,
  conflictLabel,
  onConfirm,
  busy = false,
  extraNote,
}: ActivateEditionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogTitle>Ya hay una edicion activa</AlertDialogTitle>
          <AlertDialogDescription>
            Esta feria ya tiene una edicion activa:{" "}
            <strong>{conflictLabel}</strong>. Para activar{" "}
            <strong>{targetLabel}</strong>, primero debes cerrar la otra.
            <br />
            <br />
            ¿Cerrar <strong>{conflictLabel}</strong> y activar{" "}
            <strong>{targetLabel}</strong> ahora?
          </AlertDialogDescription>
        </AlertDialogHeader>
        {extraNote && <div className="text-xs text-muted-foreground">{extraNote}</div>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={(e) => {
              e.preventDefault();
              void onConfirm();
            }}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            Cerrar otra y activar esta
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
