import { useEffect } from "react";
import { WORKSPACES, type WorkspaceId } from "../lib/workspaces";

/**
 * Pinta o contexto ativo no documento inteiro.
 *
 * O atributo vai no <html> (e não no shell do React) por dois motivos: o
 * overscroll do iOS mostra o fundo do documento, não o da div; e os modais em
 * portal também precisam herdar as variáveis do contexto.
 */
export function useWorkspaceTheme(workspace: WorkspaceId): void {
  useEffect(() => {
    const { themeColor } = WORKSPACES[workspace];
    const root = document.documentElement;

    root.dataset.workspace = workspace;

    // São duas metas (uma com media query), então as duas precisam acompanhar.
    const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
    metas.forEach((meta) => meta.setAttribute("content", themeColor));
  }, [workspace]);
}
