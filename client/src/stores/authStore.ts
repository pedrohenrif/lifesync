import { create } from "zustand";

const TOKEN_STORAGE_KEY = "@lifesync:token";
const USER_STORAGE_KEY = "@lifesync:user";

export type AuthUser = {
  readonly id: string;
  readonly email: string;
};

type AuthState = {
  readonly token: string | null;
  readonly user: AuthUser | null;
  readonly isAuthenticated: boolean;
  setSession: (payload: { readonly token: string; readonly user: AuthUser }) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
};

function parseStoredUser(raw: string | null): AuthUser | null {
  if (raw === null) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "id" in parsed &&
      "email" in parsed &&
      typeof parsed.id === "string" &&
      typeof parsed.email === "string"
    ) {
      return { id: parsed.id, email: parsed.email };
    }
  } catch {
    return null;
  }

  return null;
}

function getInitialToken(): string | null {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token === null || token.length === 0) {
    return null;
  }
  return token;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: getInitialToken(),
  user: parseStoredUser(localStorage.getItem(USER_STORAGE_KEY)),
  get isAuthenticated() {
    return get().token !== null;
  },
  setSession: ({ token, user }) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    set({ token, user });
  },
  setUser: (user) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    set({ token: null, user: null });
  },
}));
