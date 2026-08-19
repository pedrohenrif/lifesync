import type { ReactElement } from "react";
import { AppModalShell } from "./AppModalShell";

type ConfirmDialogProps = {
  readonly title: string;
  readonly description: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly danger?: boolean;
  readonly pending?: boolean;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  pending = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps): ReactElement {
  return (
    <AppModalShell title={title} onClose={onClose} maxWidthClass="max-w-md">
      <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="min-h-11 rounded-lg border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-900 disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className={`min-h-11 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
            danger
              ? "bg-red-600 text-white hover:bg-red-500"
              : "bg-blue-600 text-white hover:bg-blue-500"
          }`}
        >
          {pending ? "Aguarde…" : confirmLabel}
        </button>
      </div>
    </AppModalShell>
  );
}
