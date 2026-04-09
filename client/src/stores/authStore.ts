import { create } from "zustand";
import type { AuthUserPayload, PrimaryFocus, UserAttributes } from "../api/auth";

const DEFAULT_ATTRS: UserAttributes = {
  health: 0,
  finance: 0,
  focus: 0,
  knowledge: 0,
  social: 0,
};

function normalizeUserFromStorage(p: Record<string, unknown>): AuthUserPayload {
  const rawFocus = p.primaryFocus;
  const primaryFocus: PrimaryFocus | null =
    rawFocus === "FINANCE" || rawFocus === "HABITS" || rawFocus === "GOALS" ? rawFocus : null;
  const base = {
    id: p.id as string,
    name: typeof p.name === "string" ? p.name : "",
    email: p.email as string,
    role: typeof p.role === "string" ? p.role : "USER",
    hasCompletedOnboarding:
      typeof p.hasCompletedOnboarding === "boolean" ? p.hasCompletedOnboarding : true,
    primaryFocus,
  };
  const level = typeof p.level === "number" ? Math.max(1, Math.floor(p.level)) : 1;
  const xpToNext =
    typeof p.xpToNextLevel === "number" ? Math.max(1, Math.floor(p.xpToNextLevel)) : 100;
  const currentXp = typeof p.currentXp === "number" ? Math.max(0, Math.floor(p.currentXp)) : 0;
  const totalXp = typeof p.totalXp === "number" ? Math.max(0, Math.floor(p.totalXp)) : 0;
  const coins = typeof p.coins === "number" ? Math.max(0, Math.floor(p.coins)) : 0;
  const attrsRaw = p.attributes;
  let attributes = DEFAULT_ATTRS;
  if (typeof attrsRaw === "object" && attrsRaw !== null) {
    const o = attrsRaw as Record<string, unknown>;
    const n = (v: unknown) =>
      typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
    attributes = {
      health: n(o.health),
      finance: n(o.finance),
      focus: n(o.focus),
      knowledge: n(o.knowledge),
      social: n(o.social),
    };
  }
  const pr = p.personalRewards;
  const personalRewards = Array.isArray(pr)
    ? pr.filter(
        (x): x is AuthUserPayload["personalRewards"][number] =>
          typeof x === "object" &&
          x !== null &&
          typeof (x as { id?: string }).id === "string" &&
          typeof (x as { title?: string }).title === "string" &&
          typeof (x as { costCoins?: number }).costCoins === "number" &&
          typeof (x as { createdAt?: string }).createdAt === "string",
      )
    : [];
  return {
    ...base,
    level,
    currentXp,
    xpToNextLevel: xpToNext,
    totalXp,
    coins,
    attributes,
    personalRewards,
  };
}

const TOKEN_STORAGE_KEY = "@lifesync:token";
const USER_STORAGE_KEY = "@lifesync:user";

export type AuthUser = AuthUserPayload;

type AuthState = {
  readonly token: string | null;
  readonly user: AuthUser | null;
  readonly isAuthenticated: boolean;
  setSession: (payload: { readonly token: string; readonly user: AuthUser }) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
};

function parseStoredUser(raw: string | null): AuthUser | null {
  if (raw === null) return null;

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
      return normalizeUserFromStorage(parsed as Record<string, unknown>);
    }
  } catch {
    return null;
  }

  return null;
}

function getInitialToken(): string | null {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token === null || token.length === 0) return null;
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
