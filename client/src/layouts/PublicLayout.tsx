import type { ReactElement } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export function PublicLayout(): ReactElement {
  const token = useAuthStore((s) => s.token);

  if (token !== null) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <Outlet />
    </div>
  );
}
