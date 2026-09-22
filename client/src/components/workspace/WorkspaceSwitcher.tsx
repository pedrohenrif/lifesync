import { useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown } from "lucide-react";
import { AppModalShell } from "../ui/AppModalShell";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import { WORKSPACE_LIST, WORKSPACES, type WorkspaceId } from "../../lib/workspaces";

/**
 * Alterna o escopo do app inteiro, no estilo dos bancos que separam contextos.
 * Trocar de contexto leva para a home dele, porque as rotas não se misturam.
 */
export function WorkspaceSwitcher(): ReactElement {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const active = WORKSPACES[workspace];
  const ActiveIcon = active.icon;

  const handleSelect = (id: WorkspaceId): void => {
    setIsOpen(false);
    if (id === workspace) return;

    setWorkspace(id);
    navigate(WORKSPACES[id].homePath);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-navy-900/70 px-3 py-1 text-xs font-medium text-zinc-400 transition hover:border-blue-900/70 hover:text-zinc-200"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <ActiveIcon className="h-3.5 w-3.5 text-blue-500/80" />
        {active.label}
        <ChevronDown className="h-3 w-3 text-zinc-600" />
      </button>

      {isOpen && (
        <AppModalShell title="Trocar de contexto" onClose={() => setIsOpen(false)}>
          <div className="space-y-2">
            {WORKSPACE_LIST.map((meta) => {
              const Icon = meta.icon;
              const isActive = meta.id === workspace;

              return (
                <button
                  key={meta.id}
                  type="button"
                  onClick={() => handleSelect(meta.id)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                    isActive
                      ? "border-blue-900/70 bg-blue-950/30"
                      : "border-slate-800 hover:border-zinc-700 hover:bg-navy-950/60"
                  }`}
                >
                  <Icon
                    className={`mt-0.5 h-5 w-5 shrink-0 ${
                      isActive ? "text-blue-400" : "text-zinc-500"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-100">{meta.label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                      {meta.description}
                    </p>
                  </div>
                  {isActive && <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />}
                </button>
              );
            })}
          </div>
        </AppModalShell>
      )}
    </>
  );
}
