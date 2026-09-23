import type { ReactElement } from "react";
import { useEffect, useMemo } from "react";
import { Link, Navigate, Outlet, useLocation, useMatch } from "react-router-dom";
import {
  LogOut,
  Home,
  Target,
  Activity,
  Wallet,
  BookMarked,
  CalendarDays,
  ListChecks,
  Luggage,
  Map,
  Ticket,
  CalendarRange,
  ShieldCheck,
  Download,
  Sparkles,
} from "lucide-react";
import { useMe } from "../hooks/useMe";
import { usePwaInstall } from "../hooks/usePwaInstall";
import { useWorkspaceTheme } from "../hooks/useWorkspaceTheme";
import { PushNotificationPrompt } from "../components/notifications/PushNotificationPrompt";
import { WorkspaceSwitcher } from "../components/workspace/WorkspaceSwitcher";
import { useAuthStore } from "../stores/authStore";
import { useWorkspaceStore } from "../stores/workspaceStore";
import { WORKSPACES, workspaceFromPath } from "../lib/workspaces";

const ONBOARDING_PATH = "/onboarding";

type NavItem = { readonly to: string; readonly label: string; readonly icon: typeof Home };

const BASE_NAV_ITEMS: readonly NavItem[] = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/goals", label: "Metas", icon: Target },
  { to: "/habits", label: "Hábitos", icon: Activity },
  { to: "/finance", label: "Finanças", icon: Wallet },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
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

/**
 * No contexto de viagens as seções só existem dentro de uma viagem, então a
 * navegação depende de qual está aberta na URL.
 */
function buildTravelNavItems(activeTripId: string | null): readonly NavItem[] {
  const tripsItem: NavItem = { to: "/viagens", label: "Viagens", icon: Map };
  if (activeTripId === null) {
    return [tripsItem];
  }

  return [
    tripsItem,
    { to: `/viagens/${activeTripId}/bagagem`, label: "Bagagem", icon: Luggage },
    { to: `/viagens/${activeTripId}/pendencias`, label: "Pendências", icon: ListChecks },
    { to: `/viagens/${activeTripId}/reservas`, label: "Reservas", icon: Ticket },
    { to: `/viagens/${activeTripId}/roteiro`, label: "Roteiro", icon: CalendarRange },
    { to: `/viagens/${activeTripId}/gastos`, label: "Gastos", icon: Wallet },
  ];
}

export function AuthLayout(): ReactElement {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();
  const meQuery = useMe(token !== null);
  const { canShowInstall, install } = usePwaInstall();

  const storedWorkspace = useWorkspaceStore((s) => s.workspace);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const tripMatch = useMatch("/viagens/:tripId/*");
  const activeTripId = tripMatch?.params.tripId ?? null;

  // A rota atual decide o contexto; o store só guarda a preferência entre sessões.
  const currentWorkspace = workspaceFromPath(location.pathname) ?? "personal";

  useWorkspaceTheme(currentWorkspace);

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

  useEffect(() => {
    if (currentWorkspace !== storedWorkspace) {
      setWorkspace(currentWorkspace);
    }
  }, [currentWorkspace, storedWorkspace, setWorkspace]);

  const navItems = useMemo<readonly NavItem[]>(() => {
    if (currentWorkspace === "travel") {
      return buildTravelNavItems(activeTripId);
    }
    if (user?.role === "ADMIN") {
      return [...BASE_NAV_ITEMS, ADMIN_NAV_ITEM];
    }
    return BASE_NAV_ITEMS;
  }, [activeTripId, currentWorkspace, user?.role]);

  const bottomNavItems = useMemo<readonly NavItem[]>(
    () =>
      currentWorkspace === "travel"
        ? buildTravelNavItems(activeTripId)
        : BOTTOM_NAV_ITEMS,
    [activeTripId, currentWorkspace],
  );

  if (token === null) {
    return <Navigate to="/login" replace />;
  }

  if (meQuery.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-950 text-ink-muted">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-edge border-t-ink" />
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
      <div className="min-h-screen bg-surface-950 text-ink">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-950 text-ink transition-colors duration-500">
      <header
        className="sticky top-0 z-40 border-b border-edge bg-surface-950/90 backdrop-blur-md transition-colors duration-500"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {/* Seletor de contexto: escopo do app inteiro, acima da navegação. */}
        <div className="flex justify-center px-4 py-3">
          <WorkspaceSwitcher />
        </div>

        {/* Mobile: marca + atalhos Cofre / Admin / Sair */}
        <div className="flex items-center justify-between gap-2 px-4 pb-3 md:hidden">
          <Link
            to={WORKSPACES[currentWorkspace].homePath}
            className="shrink-0 text-sm font-semibold tracking-tight text-ink transition hover:text-ink-muted"
          >
            LifeSync
          </Link>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
            {canShowInstall ? (
              <button
                type="button"
                onClick={() => void install()}
                className="flex max-w-[7.5rem] items-center gap-1 rounded-xl border border-accent-600/25 bg-accent-600/10 px-2 py-1.5 text-[10px] font-bold text-accent-700 transition hover:border-accent-600/50"
              >
                <Download className="h-3 w-3 shrink-0" />
                <span className="truncate">Instalar app</span>
              </button>
            ) : null}
            {currentWorkspace === "personal" ? (
              <>
                <Link
                  to="/agenda"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition ${
                    location.pathname === "/agenda"
                      ? "bg-accent-600/15 text-accent-600"
                      : "text-ink-muted hover:bg-surface-800 hover:text-ink"
                  }`}
                  aria-label="Agenda"
                >
                  <CalendarDays className="h-5 w-5" />
                </Link>
                <Link
                  to="/vault"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition ${
                    location.pathname === "/vault"
                      ? "bg-accent-600/15 text-accent-600"
                      : "text-ink-muted hover:bg-surface-800 hover:text-ink"
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
                        ? "bg-accent-600/15 text-accent-600"
                        : "text-ink-muted hover:bg-surface-800 hover:text-ink"
                    }`}
                    aria-label="Backoffice"
                  >
                    <ShieldCheck className="h-5 w-5" />
                  </Link>
                ) : null}
              </>
            ) : null}
            <button
              type="button"
              onClick={logout}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-muted transition hover:bg-surface-800 hover:text-ink"
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
                      ? "bg-accent-600/15 text-accent-700"
                      : "text-ink-muted hover:bg-surface-800 hover:text-ink"
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
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-accent-600/25 bg-accent-600/10 px-3 py-2 text-xs font-bold text-accent-700 transition hover:border-accent-600/50"
              >
                <Download className="h-3.5 w-3.5" />
                Instalar aplicativo
              </button>
            ) : null}
            <span className="min-w-0 truncate text-xs text-ink-muted">{user?.name ?? user?.email ?? ""}</span>
            <button
              type="button"
              onClick={logout}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-edge px-3 text-xs font-medium text-ink-muted transition hover:border-accent-700 hover:text-ink"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* A key remonta o conteúdo ao trocar de contexto, então a animação roda de novo. */}
      <main
        key={currentWorkspace}
        className="ls-context-enter flex-1 px-4 py-6 pb-24 md:px-6 md:py-8 md:pb-8"
      >
        <div className="mx-auto max-w-7xl">
          <PushNotificationPrompt />
        </div>
        <Outlet />
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t border-edge bg-surface-950/95 px-1 pt-2 backdrop-blur-md transition-colors duration-500 md:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
        aria-label="Navegação principal"
      >
        {bottomNavItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 transition ${
                isActive ? "bg-accent-600/15 text-accent-600" : "text-ink-muted hover:text-ink"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-accent-600" : ""}`} />
              <span className="max-w-full truncate text-center text-[10px] font-medium leading-tight">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
