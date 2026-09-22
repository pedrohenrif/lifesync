import { create } from "zustand";
import { isWorkspaceId, type WorkspaceId } from "../lib/workspaces";

const WORKSPACE_STORAGE_KEY = "@lifesync:workspace";

function getInitialWorkspace(): WorkspaceId {
  const stored = localStorage.getItem(WORKSPACE_STORAGE_KEY);
  if (stored !== null && isWorkspaceId(stored)) {
    return stored;
  }
  return "personal";
}

type WorkspaceState = {
  readonly workspace: WorkspaceId;
  setWorkspace: (workspace: WorkspaceId) => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspace: getInitialWorkspace(),
  setWorkspace: (workspace) => {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, workspace);
    set({ workspace });
  },
}));
