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
      <p className="text-sm leading-relaxed text-ink-muted">{description}</p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="min-h-11 rounded-2xl border border-edge px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-surface-800 disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className={`min-h-11 rounded-2xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
            danger ? "bg-red-600 text-white hover:bg-red-500" : "ls-accent-fill"
          }`}
        >
          {pending ? "Aguarde…" : confirmLabel}
        </button>
      </div>
    </AppModalShell>
  );
}
