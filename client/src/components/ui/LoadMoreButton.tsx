import type { ReactElement } from "react";
import { Loader2 } from "lucide-react";

type LoadMoreButtonProps = {
  readonly hasMore: boolean;
  readonly isLoading: boolean;
  readonly onLoadMore: () => void;
  readonly loadedCount: number;
  readonly total: number;
  readonly label?: string;
};

export function LoadMoreButton({
  hasMore,
  isLoading,
  onLoadMore,
  loadedCount,
  total,
  label = "Carregar mais",
}: LoadMoreButtonProps): ReactElement | null {
  if (!hasMore && loadedCount >= total) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-1.5 pt-2">
      <button
        type="button"
        onClick={onLoadMore}
        disabled={isLoading || !hasMore}
        className="flex items-center gap-2 rounded-lg border border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-50"
      >
        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {isLoading ? "Carregando..." : label}
      </button>
      <span className="text-[10px] text-zinc-600">
        {loadedCount} de {total}
      </span>
    </div>
  );
}
