import type { ReactElement, ReactNode } from "react";
import { useId } from "react";
import { X } from "lucide-react";

type AppModalShellProps = {
  readonly title: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
  /** e.g. max-w-md, max-w-lg */
  readonly maxWidthClass?: string;
};

/**
 * Overlay + painel com scroll interno, acima da bottom nav (z-50).
 */
export function AppModalShell({
  title,
  onClose,
  children,
  maxWidthClass = "max-w-md",
}: AppModalShellProps): ReactElement {
  const titleId = useId();

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div
        className={`flex max-h-[calc(100svh-40px)] w-full ${maxWidthClass} flex-col overflow-hidden rounded-t-2xl border border-zinc-800 border-b-0 bg-zinc-950 sm:max-h-[min(96svh,calc(100svh-40px))] sm:rounded-xl sm:border-b`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-zinc-800/80 bg-zinc-950 px-4 py-3 sm:px-6">
          <h2 id={titleId} className="text-sm font-semibold text-zinc-200">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4 sm:pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}
