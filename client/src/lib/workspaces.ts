import { Plane, User, type LucideIcon } from "lucide-react";

export const WORKSPACE_IDS = ["personal", "travel"] as const;

export type WorkspaceId = (typeof WORKSPACE_IDS)[number];

export function isWorkspaceId(value: string): value is WorkspaceId {
  return (WORKSPACE_IDS as readonly string[]).includes(value);
}

export type WorkspaceMeta = {
  readonly id: WorkspaceId;
  readonly label: string;
  readonly description: string;
  readonly icon: LucideIcon;
  /** Para onde o app vai ao entrar neste contexto. */
  readonly homePath: string;
  /** Prefixo que identifica as rotas deste contexto. */
  readonly pathPrefix: string | null;
  /**
   * Cor da barra de status no PWA instalado. Precisa ser literal: a meta tag
   * theme-color não aceita var(), então não dá para reaproveitar o token CSS.
   * Espelha --color-surface-950 de cada contexto.
   */
  readonly themeColor: string;
  /** Amostra da cor de acento, mostrada no seletor de contexto. */
  readonly swatchClass: string;
};

export const WORKSPACES: Record<WorkspaceId, WorkspaceMeta> = {
  personal: {
    id: "personal",
    label: "Pessoal",
    description: "Metas, hábitos, finanças, agenda e cofre de ideias.",
    icon: User,
    homePath: "/dashboard",
    pathPrefix: null,
    themeColor: "#0b1220",
    swatchClass: "bg-blue-500",
  },
  travel: {
    id: "travel",
    label: "Viagens",
    description: "Bagagem, pendências, reservas e roteiro de cada viagem.",
    icon: Plane,
    homePath: "/viagens",
    pathPrefix: "/viagens",
    themeColor: "#14110b",
    swatchClass: "bg-amber-400",
  },
};

export const WORKSPACE_LIST: readonly WorkspaceMeta[] = WORKSPACE_IDS.map(
  (id) => WORKSPACES[id],
);

/**
 * A URL manda no contexto: um link salvo em /viagens não pode abrir com a
 * navegação do workspace pessoal.
 */
export function workspaceFromPath(pathname: string): WorkspaceId | null {
  for (const meta of WORKSPACE_LIST) {
    if (meta.pathPrefix !== null && pathname.startsWith(meta.pathPrefix)) {
      return meta.id;
    }
  }
  return null;
}
