import type { ReactElement } from "react";
import { CalendarCheck, Link2, Loader2, ShieldCheck } from "lucide-react";

type GoogleConnectCardProps = {
  readonly available: boolean;
  readonly pending: boolean;
  readonly onConnect: () => void;
};

export function GoogleConnectCard({
  available,
  pending,
  onConnect,
}: GoogleConnectCardProps): ReactElement {
  if (!available) {
    return (
      <div className="ls-card p-6 text-center">
        <CalendarCheck className="mx-auto h-8 w-8 text-zinc-700" />
        <p className="mt-3 text-sm font-medium text-zinc-300">
          Integração indisponível
        </p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-600">
          As credenciais do Google não estão configuradas neste ambiente.
        </p>
      </div>
    );
  }

  return (
    <div className="ls-card p-6">
      <CalendarCheck className="h-8 w-8 text-blue-500" />
      <h2 className="mt-4 text-base font-semibold tracking-tight text-zinc-100">
        Conecte seu Google Agenda
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">
        Veja e gerencie seus compromissos aqui dentro, junto das suas metas e hábitos.
        Os eventos continuam vivendo na sua conta Google — o LifeSync só lê e escreve
        quando você pede.
      </p>

      <ul className="mt-5 space-y-2.5 text-xs text-zinc-500">
        <li className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
          Nenhum evento é copiado para o banco do LifeSync.
        </li>
        <li className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
          Você pode desconectar a qualquer momento, aqui ou na sua conta Google.
        </li>
      </ul>

      <button
        type="button"
        onClick={onConnect}
        disabled={pending}
        className="ls-btn-block mt-6"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Link2 className="h-4 w-4" />
        )}
        {pending ? "Redirecionando…" : "Conectar com o Google"}
      </button>
    </div>
  );
}
