import type { ReactElement } from "react";
import { ShieldCheck, UserCheck, UserX, Clock, Users } from "lucide-react";
import { usePendingUsers, useReviewUser } from "../hooks/useAdmin";
import type { PendingUser } from "../api/admin";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SkeletonRow(): ReactElement {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4">
      <div className="space-y-2">
        <div className="h-4 w-40 animate-pulse rounded bg-zinc-800" />
        <div className="h-3 w-56 animate-pulse rounded bg-zinc-800" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 w-20 animate-pulse rounded-lg bg-zinc-800" />
        <div className="h-8 w-20 animate-pulse rounded-lg bg-zinc-800" />
      </div>
    </div>
  );
}

function UserCard({
  user,
  onApprove,
  onReject,
  isLoading,
}: {
  readonly user: PendingUser;
  readonly onApprove: () => void;
  readonly onReject: () => void;
  readonly isLoading: boolean;
}): ReactElement {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-100">{user.name}</p>
        <p className="mt-0.5 truncate text-xs text-zinc-500">{user.email}</p>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-600">
          <Clock className="h-3 w-3" />
          {formatDate(user.createdAt)}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={isLoading}
          onClick={onApprove}
          className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-emerald-600/20 px-4 py-2.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-600/30 disabled:opacity-50 sm:justify-start"
        >
          <UserCheck className="h-3.5 w-3.5" />
          Aprovar
        </button>
        <button
          type="button"
          disabled={isLoading}
          onClick={onReject}
          className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-red-600/20 px-4 py-2.5 text-xs font-medium text-red-400 transition hover:bg-red-600/30 disabled:opacity-50 sm:justify-start"
        >
          <UserX className="h-3.5 w-3.5" />
          Rejeitar
        </button>
      </div>
    </div>
  );
}

export function AdminDashboard(): ReactElement {
  const { data, isPending: isLoadingUsers } = usePendingUsers();
  const reviewMutation = useReviewUser();

  const pendingUsers = data?.users ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20">
          <ShieldCheck className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Backoffice</h1>
          <p className="text-sm text-zinc-500">Aprovação de novos usuários</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 text-sm text-zinc-400">
        <Users className="h-4 w-4" />
        <span>
          {isLoadingUsers
            ? "Carregando..."
            : `${pendingUsers.length} usuário${pendingUsers.length !== 1 ? "s" : ""} pendente${pendingUsers.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      <div className="space-y-3">
        {isLoadingUsers ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : pendingUsers.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-6 py-12 text-center">
            <UserCheck className="mx-auto h-8 w-8 text-zinc-700" />
            <p className="mt-3 text-sm text-zinc-500">Nenhum usuário pendente de aprovação.</p>
          </div>
        ) : (
          pendingUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              isLoading={reviewMutation.isPending}
              onApprove={() => reviewMutation.mutate({ userId: user.id, status: "ACTIVE" })}
              onReject={() => reviewMutation.mutate({ userId: user.id, status: "REJECTED" })}
            />
          ))
        )}
      </div>
    </div>
  );
}
