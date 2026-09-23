import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import { WORKSPACE_LIST, WORKSPACES, type WorkspaceId } from "../../lib/workspaces";

/**
 * Alterna o escopo do app no mesmo gesto dos bancos e do Duolingo:
 * os dois lados ficam visíveis, o ativo é a pílula preenchida.
 */
export function WorkspaceSwitcher(): ReactElement {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const navigate = useNavigate();

  const handleSelect = (id: WorkspaceId): void => {
    if (id === workspace) return;
    setWorkspace(id);
    navigate(WORKSPACES[id].homePath);
  };

  return (
    <div
      className="flex w-full max-w-sm rounded-2xl border border-edge bg-surface-900 p-1 shadow-sm"
      role="tablist"
      aria-label="Contexto do aplicativo"
    >
      {WORKSPACE_LIST.map((meta) => {
        const Icon = meta.icon;
        const isActive = meta.id === workspace;

        return (
          <button
            key={meta.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => handleSelect(meta.id)}
            className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-extrabold tracking-tight transition ${
              isActive
                ? "ls-accent-fill shadow-sm"
                : "text-ink-muted hover:bg-surface-800 hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4" />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
