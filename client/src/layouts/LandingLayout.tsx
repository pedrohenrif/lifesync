import type { ReactElement } from "react";
import { Link, Navigate, Outlet } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useAuthStore } from "../stores/authStore";

export function LandingLayout(): ReactElement {
  const token = useAuthStore((s) => s.token);

  if (token !== null) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight text-zinc-100 transition hover:text-white"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </span>
            LifeSync
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100"
            >
              Entrar
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-white"
            >
              Criar conta
            </Link>
          </nav>
        </div>
      </header>

      <Outlet />
    </div>
  );
}
