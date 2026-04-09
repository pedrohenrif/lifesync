import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Target,
  Flame,
  Activity,
  Check,
  Circle,
  Calendar,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useFinancialSummary } from "../hooks/useFinance";
import { useHabits } from "../hooks/useHabits";
import { useGoals } from "../hooks/useGoals";
import { DailyCheckIn } from "../components/journal/DailyCheckIn";

/* ─── Utilitários ─── */

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatTodayLong(): string {
  const now = new Date();
  return now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).replace(/^\w/, (c) => c.toUpperCase());
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatTargetDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

const CARD_CLASS = "rounded-2xl border border-zinc-800 bg-zinc-900 p-4 md:p-6";

/* ─── Skeletons ─── */

function SkeletonLine({ width = "w-full" }: { readonly width?: string }): ReactElement {
  return <div className={`h-4 rounded bg-zinc-800 animate-pulse ${width}`} />;
}

function SkeletonCard({ lines = 3 }: { readonly lines?: number }): ReactElement {
  return (
    <div className={`${CARD_CLASS} space-y-4`}>
      <SkeletonLine width="w-1/3" />
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonLine key={i} width={i % 2 === 0 ? "w-full" : "w-2/3"} />
      ))}
    </div>
  );
}

/* ─── Card Link ─── */

function CardLink({ to, label }: { readonly to: string; readonly label: string }): ReactElement {
  return (
    <Link
      to={to}
      className="mt-4 flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-300"
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

/* ─── Painel de Finanças ─── */

function FinancePanel(): ReactElement {
  const now = new Date();
  const { data, isPending, isError } = useFinancialSummary(now.getFullYear(), now.getMonth() + 1);

  if (isPending) return <SkeletonCard lines={4} />;
  if (isError || data === undefined) {
    return (
      <div className={CARD_CLASS}>
        <p className="text-sm text-red-400">Erro ao carregar finanças.</p>
      </div>
    );
  }

  return (
    <div className={`${CARD_CLASS} flex flex-col`}>
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="h-5 w-5 text-zinc-400" />
        <h2 className="text-sm font-semibold text-zinc-400">Finanças</h2>
      </div>

      <p className="text-2xl font-bold tracking-tight text-zinc-100 md:text-3xl">
        {formatCurrency(data.balance)}
      </p>
      <p className="text-xs text-zinc-500 mt-1">Saldo atual do mês</p>

      <div className="mt-4 flex flex-wrap items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">{formatCurrency(data.totalIncome)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingDown className="h-4 w-4 text-red-400" />
          <span className="text-sm font-medium text-red-400">{formatCurrency(data.totalExpense)}</span>
        </div>
      </div>

      <CardLink to="/finance" label="Ir para Finanças" />
    </div>
  );
}

/* ─── Painel de Hábitos ─── */

function HabitsPanel(): ReactElement {
  const { data, isPending, isError } = useHabits();

  if (isPending) return <SkeletonCard lines={5} />;
  if (isError || data === undefined) {
    return (
      <div className={CARD_CLASS}>
        <p className="text-sm text-red-400">Erro ao carregar hábitos.</p>
      </div>
    );
  }

  const today = todayISO();
  const habits = data.habits;
  const doneCount = habits.filter((h) => h.completedDates.includes(today)).length;

  return (
    <div className={`${CARD_CLASS} flex flex-col`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-400">Hábitos de Hoje</h2>
        </div>
        <span className="text-xs text-zinc-500">
          {doneCount}/{habits.length} feitos
        </span>
      </div>

      {habits.length === 0 ? (
        <p className="text-sm text-zinc-600 py-4">Nenhum hábito cadastrado.</p>
      ) : (
        <ul className="space-y-2.5 flex-1">
          {habits.map((habit) => {
            const done = habit.completedDates.includes(today);
            return (
              <li key={habit.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {done ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  ) : (
                    <Circle className="h-5 w-5 text-zinc-700" />
                  )}
                  <span className={`text-sm ${done ? "text-zinc-400 line-through" : "text-zinc-200"}`}>
                    {habit.name}
                  </span>
                </div>
                {habit.currentStreak > 0 && (
                  <div className="flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-orange-400" />
                    <span className="text-xs font-medium text-orange-400">{habit.currentStreak}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <CardLink to="/habits" label="Ver todos os hábitos" />
    </div>
  );
}

/* ─── Painel de Metas Ativas ─── */

const MAX_GOALS_SHOWN = 4;

function GoalsPanel(): ReactElement {
  const { data, isPending, isError } = useGoals();

  if (isPending) return <SkeletonCard lines={4} />;
  if (isError || data === undefined) {
    return (
      <div className={CARD_CLASS}>
        <p className="text-sm text-red-400">Erro ao carregar metas.</p>
      </div>
    );
  }

  const active = data.goals
    .filter((g) => g.status === "PENDING" || g.status === "IN_PROGRESS")
    .slice(0, MAX_GOALS_SHOWN);

  const total = data.goals.filter((g) => g.status === "PENDING" || g.status === "IN_PROGRESS").length;

  return (
    <div className={`${CARD_CLASS} flex flex-col`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-400">Metas Ativas</h2>
        </div>
        <span className="text-xs text-zinc-500">{total} ativas</span>
      </div>

      {active.length === 0 ? (
        <p className="text-sm text-zinc-600 py-4">Nenhuma meta ativa no momento.</p>
      ) : (
        <ul className="space-y-3 flex-1">
          {active.map((goal) => (
            <li key={goal.id} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">{goal.title}</p>
                <span
                  className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    goal.status === "IN_PROGRESS"
                      ? "bg-blue-500/10 text-blue-400"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {goal.status === "IN_PROGRESS" ? "Em andamento" : "Pendente"}
                </span>
              </div>
              {goal.targetDate !== null && (
                <div className="flex shrink-0 items-center gap-1 text-xs text-zinc-500">
                  <Calendar className="h-3 w-3" />
                  {formatTargetDate(goal.targetDate)}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {total > MAX_GOALS_SHOWN && (
        <p className="mt-2 text-xs text-zinc-600">+{total - MAX_GOALS_SHOWN} mais...</p>
      )}

      <CardLink to="/goals" label="Ver todas as metas" />
    </div>
  );
}

/* ─── Página Principal (Dashboard Cockpit) ─── */

export function Home(): ReactElement {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header de boas-vindas */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100 sm:text-2xl">
          Olá, {user?.email ?? "usuário"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{formatTodayLong()}</p>
      </div>

      {/* Daily Check-In */}
      <DailyCheckIn />

      {/* Bento Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:row-span-1">
          <FinancePanel />
        </div>
        <div className="lg:row-span-1">
          <HabitsPanel />
        </div>
        <div className="lg:row-span-1">
          <GoalsPanel />
        </div>
      </div>
    </div>
  );
}
