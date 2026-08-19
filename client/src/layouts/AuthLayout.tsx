import type { ReactElement } from "react";
import { useEffect, useMemo } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import {
  LogOut,
  Home,
  Target,
  Activity,
  Wallet,
  BookMarked,
  ShieldCheck,
  Download,
  Sparkles,
} from "lucide-react";
import { useMe } from "../hooks/useMe";
import { usePwaInstall } from "../hooks/usePwaInstall";
import { PushNotificationPrompt } from "../components/notifications/PushNotificationPrompt";
import { useAuthStore } from "../stores/authStore";

const ONBOARDING_PATH = "/onboarding";

type NavItem = { readonly to: string; readonly label: string; readonly icon: typeof Home };

const BASE_NAV_ITEMS: readonly NavItem[] = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/goals", label: "Metas", icon: Target },
  { to: "/habits", label: "Hábitos", icon: Activity },
  { to: "/finance", label: "Finanças", icon: Wallet },
  { to: "/profile", label: "Evolução", icon: Sparkles },
  { to: "/vault", label: "Cofre", icon: BookMarked },
];

const ADMIN_NAV_ITEM: NavItem = { to: "/admin", label: "Backoffice", icon: ShieldCheck };

/** Navegação principal no PWA (polegar). */
const BOTTOM_NAV_ITEMS: readonly NavItem[] = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/goals", label: "Metas", icon: Target },
  { to: "/habits", label: "Hábitos", icon: Activity },
  { to: "/finance", label: "Finanças", icon: Wallet },
  { to: "/profile", label: "Evolução", icon: Sparkles },
];

export function AuthLayout(): ReactElement {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();
  const meQuery = useMe(token !== null);
  const { canShowInstall, install } = usePwaInstall();

  useEffect(() => {
    if (token === null) return;
    if (meQuery.isError) {
      logout();
      return;
    }
    if (meQuery.data !== undefined) {
      setUser(meQuery.data.user);
    }
  }, [logout, meQuery.data, meQuery.isError, setUser, token]);

  const navItems = useMemo<readonly NavItem[]>(() => {
    if (user?.role === "ADMIN") {
      return [...BASE_NAV_ITEMS, ADMIN_NAV_ITEM];
    }
    return BASE_NAV_ITEMS;
  }, [user?.role]);

  if (token === null) {
    return <Navigate to="/login" replace />;
  }

  if (meQuery.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 text-zinc-300">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
          <span className="text-sm">Carregando sessão...</span>
        </div>
      </div>
    );
  }

  const isOnboardingRoute = location.pathname === ONBOARDING_PATH;

  if (!isOnboardingRoute && user !== null && user.hasCompletedOnboarding === false) {
    return <Navigate to={ONBOARDING_PATH} replace />;
  }

  if (isOnboardingRoute && user !== null && user.hasCompletedOnboarding === true) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isOnboardingRoute) {
    return (
      <div className="min-h-screen bg-navy-950 text-zinc-100">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-navy-950 text-zinc-100">
      <header
        className="sticky top-0 z-40 border-b border-blue-950/80 bg-navy-950/95 backdrop-blur-md"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {/* Mobile: marca + atalhos Cofre / Admin / Sair */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 md:hidden">
          <Link
            to="/dashboard"
            className="shrink-0 text-sm font-semibold tracking-tight text-zinc-100 transition hover:text-white"
          >
            LifeSync
          </Link>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
            {canShowInstall ? (
              <button
                type="button"
                onClick={() => void install()}
                className="flex max-w-[7.5rem] items-center gap-1 rounded-lg border border-blue-900/50 bg-blue-950/40 px-2 py-1.5 text-[10px] font-medium text-blue-300 transition hover:border-blue-700 hover:text-blue-200"
              >
                <Download className="h-3 w-3 shrink-0" />
                <span className="truncate">Instalar app</span>
              </button>
            ) : null}
            <Link
              to="/vault"
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition ${
                location.pathname === "/vault"
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-zinc-500 hover:bg-navy-800 hover:text-zinc-300"
              }`}
              aria-label="Cofre"
            >
              <BookMarked className="h-5 w-5" />
            </Link>
            {user?.role === "ADMIN" ? (
              <Link
                to="/admin"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition ${
                  location.pathname === "/admin"
                    ? "bg-blue-600/20 text-blue-400"
                    : "text-zinc-500 hover:bg-navy-800 hover:text-zinc-300"
                }`}
                aria-label="Backoffice"
              >
                <ShieldCheck className="h-5 w-5" />
              </Link>
            ) : null}
            <button
              type="button"
              onClick={logout}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-navy-800 hover:text-zinc-200"
              aria-label="Sair"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Desktop: navegação completa */}
        <div className="mx-auto hidden max-w-7xl items-center justify-between px-6 py-3 md:flex">
          <nav className="flex flex-wrap items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-600/20 text-blue-300"
                      : "text-zinc-500 hover:bg-navy-800 hover:text-zinc-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex min-w-0 max-w-[50%] items-center gap-3">
            {canShowInstall ? (
              <button
                type="button"
                onClick={() => void install()}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-900/50 bg-blue-950/40 px-3 py-2 text-xs font-medium text-blue-300 transition hover:border-blue-700 hover:text-blue-200"
              >
                <Download className="h-3.5 w-3.5" />
                Instalar aplicativo
              </button>
            ) : null}
            <span className="min-w-0 truncate text-xs text-zinc-500">{user?.name ?? user?.email ?? ""}</span>
            <button
              type="button"
              onClick={logout}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-zinc-800 px-3 text-xs font-medium text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 pb-24 md:px-6 md:py-8 md:pb-8">
        <div className="mx-auto max-w-7xl">
          <PushNotificationPrompt />
        </div>
        <Outlet />
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t border-blue-950/80 bg-navy-950/95 px-1 pt-2 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
        aria-label="Navegação principal"
      >
        {BOTTOM_NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex min-h-12 min-w-[3rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 transition ${
                isActive ? "bg-blue-600/15 text-blue-400" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-blue-400" : ""}`} />
              <span className="max-w-[4.5rem] truncate text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
