/**
 * components/app/ConfirmDestructiveDialog.tsx — FeriaNet
 *
 * Dialogo de confirmacion para acciones destructivas. Patron:
 *  - Titulo y descripcion claros, con el nombre del recurso afectado.
 *  - Boton destructivo en color de peligro.
 *  - Estado de carga mientras la mutacion esta en vuelo.
 *
 * Pensado para borrado de ferias, ediciones y soft-delete de
 * atracciones. Reutilizable: el caller pasa el trigger y los textos.
 */

import type { ReactNode } from "react";
import { useState } from "react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ConfirmDestructiveDialogProps {
  trigger: ReactNode;
  title: string;
  description: ReactNode;
  /** Texto del boton destructivo. Default: "Eliminar". */
  actionLabel?: string;
  /** Callback async; si lanza, el dialogo permanece abierto. */
  onConfirm: () => Promise<unknown> | unknown;
  /** Texto del boton cancelar. Default: "Cancelar". */
  cancelLabel?: string;
  /** Mensaje del toast de exito (lo emite el caller, este dialogo solo ejecuta). */
  onSuccess?: () => void;
}

export function ConfirmDestructiveDialog({
  trigger,
  title,
  description,
  actionLabel = "Eliminar",
  onConfirm,
  cancelLabel = "Cancelar",
  onSuccess,
}: ConfirmDestructiveDialogProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
      onSuccess?.();
    } catch {
      // El caller maneja el toast de error; dejamos el dialog abierto.
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => !busy && setOpen(v)}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={busy}
            onClick={(e) => {
              e.preventDefault();
              void handleConfirm();
            }}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
