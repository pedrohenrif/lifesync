import type { ReactElement } from "react";
import { useEffect, useMemo } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { LogOut, Home, Target, Activity, Wallet, BookMarked, ShieldCheck } from "lucide-react";
import { useMe } from "../hooks/useMe";
import { useAuthStore } from "../stores/authStore";

type NavItem = { readonly to: string; readonly label: string; readonly icon: typeof Home };

const BASE_NAV_ITEMS: readonly NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/goals", label: "Metas", icon: Target },
  { to: "/habits", label: "Hábitos", icon: Activity },
  { to: "/finance", label: "Finanças", icon: Wallet },
  { to: "/vault", label: "Cofre", icon: BookMarked },
];

const ADMIN_NAV_ITEM: NavItem = { to: "/admin", label: "Backoffice", icon: ShieldCheck };

export function AuthLayout(): ReactElement {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();
  const meQuery = useMe(token !== null);

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
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-300">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
          <span className="text-sm">Carregando sessão...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-500">{user?.name ?? user?.email ?? ""}</span>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
