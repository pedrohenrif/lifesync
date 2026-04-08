import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import {
  Target,
  Flame,
  Wallet,
  LayoutDashboard,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  PieChart,
  ArrowRight,
  Zap,
  Activity,
  Check,
  Circle,
  AlertTriangle,
  Clock,
  CheckSquare,
  Square,
  Star,
  MoreVertical,
  Pencil,
  Trash2,
  CreditCard,
  Repeat,
  PiggyBank,
  RefreshCw,
  Hash,
} from "lucide-react";

const MOCK_CARD = "rounded-2xl border border-zinc-800 bg-zinc-900";

/* ─── Hero: mockup fiel ao Dashboard (visão de pássaro) ─── */

function HeroBentoMockup(): ReactElement {
  return (
    <div className="relative mx-auto mt-12 max-w-5xl sm:mt-16 perspective-[1400px]">
      <div
        className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-3 shadow-2xl shadow-black/50 ring-1 ring-zinc-800/90 sm:p-4"
        style={{ transform: "rotateX(5deg)" }}
      >
        <div className="rounded-2xl bg-black/40 p-3 ring-1 ring-zinc-800/60 sm:p-4">
          {/* Header estilo Home */}
          <div className="mb-3 border-b border-zinc-800/80 pb-3">
            <p className="text-[11px] font-bold tracking-tight text-zinc-100 sm:text-xs">
              Olá, maria.silva@email.com
            </p>
            <p className="text-[9px] text-zinc-500 sm:text-[10px]">Quarta-feira, 8 de abril de 2026</p>
          </div>

          {/* Mini check-in diário */}
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-2 py-2">
            <span className="text-[9px] font-medium text-zinc-500">Hoje</span>
            <div className="flex gap-1">
              {["😕", "😐", "🙂"].map((e, i) => (
                <span
                  key={e}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm ${
                    i === 2 ? "bg-zinc-800 ring-1 ring-zinc-600" : "opacity-40"
                  }`}
                >
                  {e}
                </span>
              ))}
            </div>
            <span className="ml-auto text-[8px] text-zinc-600">Diário</span>
          </div>

          {/* Bento 3 colunas — espelho do Home.tsx */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
            {/* Finanças */}
            <div className={`${MOCK_CARD} p-3`}>
              <div className="mb-2 flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 text-zinc-400" />
                <span className="text-[9px] font-semibold text-zinc-400">Finanças</span>
              </div>
              <p className="text-lg font-bold tabular-nums leading-none text-zinc-100">R$ 2.820</p>
              <p className="mt-0.5 text-[8px] text-zinc-500">Saldo do mês</p>
              <div className="mt-2 flex gap-3 text-[9px]">
                <span className="flex items-center gap-0.5 font-medium text-emerald-400">
                  <TrendingUp className="h-2.5 w-2.5" />
                  3.000
                </span>
                <span className="flex items-center gap-0.5 font-medium text-red-400">
                  <TrendingDown className="h-2.5 w-2.5" />
                  180
                </span>
              </div>
              <p className="mt-2 text-[8px] text-zinc-600">Ir para Finanças →</p>
            </div>

            {/* Hábitos */}
            <div className={`${MOCK_CARD} p-3`}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="text-[9px] font-semibold text-zinc-400">Hábitos</span>
                </div>
                <span className="text-[8px] text-zinc-500">2/3</span>
              </div>
              <ul className="space-y-1.5">
                <li className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-500">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                    <span className="text-[9px] text-zinc-400 line-through">Meditação</span>
                  </div>
                  <Flame className="h-2.5 w-2.5 text-orange-400" />
                </li>
                <li className="flex items-center gap-1.5">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-500">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </div>
                  <span className="text-[9px] text-zinc-400 line-through">Água 2L</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Circle className="h-4 w-4 text-zinc-700" />
                  <span className="text-[9px] text-zinc-200">Leitura</span>
                </li>
              </ul>
            </div>

            {/* Metas */}
            <div className={`${MOCK_CARD} p-3`}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="text-[9px] font-semibold text-zinc-400">Metas</span>
                </div>
                <span className="text-[8px] text-zinc-500">3 ativas</span>
              </div>
              <ul className="space-y-2">
                <li>
                  <p className="truncate text-[9px] font-medium text-zinc-200">Certificação AWS</p>
                  <span className="mt-0.5 inline-block rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[7px] font-semibold text-blue-400">
                    Estudos
                  </span>
                </li>
                <li>
                  <p className="truncate text-[9px] font-medium text-zinc-200">Maratona 10km</p>
                  <div className="mt-1 flex items-center gap-0.5 text-[7px] text-amber-400">
                    <Clock className="h-2 w-2" />
                    5d
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[2rem] bg-gradient-to-b from-emerald-500/8 via-transparent to-violet-500/10 blur-3xl" />
    </div>
  );
}

/* ─── Metas: mockup de card expandido ─── */

function MockGoalCard(): ReactElement {
  const tasks = [
    { title: "Definir escopo do MVP", done: true },
    { title: "Wireframes no Figma", done: true },
    { title: "API Gateway + auth", done: true },
    { title: "Testes E2E críticos", done: false },
    { title: "Deploy produção", done: false },
  ];
  const done = tasks.filter((t) => t.done).length;
  const pct = Math.round((done / tasks.length) * 100);

  return (
    <div className={`${MOCK_CARD} max-w-md overflow-hidden shadow-xl ring-1 ring-zinc-800/80`}>
      <div className="border-b border-zinc-800/80 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            Empresarial
          </span>
          <div className="flex items-center gap-1 text-xs font-medium text-amber-400">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            Vence em 3 dias
          </div>
        </div>
        <h3 className="mt-3 text-sm font-semibold text-zinc-100">Lançar LifeSync em produção</h3>
        <p className="mt-1 text-xs text-zinc-500">Última reta antes do go-live com usuários reais.</p>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between text-[10px] text-zinc-500">
          <span>Progresso das subtarefas</span>
          <span className="tabular-nums text-zinc-400">{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <ul className="mt-3 space-y-2">
          {tasks.map((t) => (
            <li key={t.title} className="flex items-center gap-2 text-xs">
              {t.done ? (
                <CheckSquare className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <Square className="h-4 w-4 shrink-0 text-zinc-600" />
              )}
              <span className={t.done ? "text-zinc-500 line-through" : "text-zinc-300"}>{t.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MockGoalCardOverdue(): ReactElement {
  return (
    <div className={`${MOCK_CARD} max-w-xs shrink-0 border-red-900/30 p-3 opacity-90 ring-1 ring-red-900/20`}>
      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
        Estudos
      </span>
      <p className="mt-2 text-xs font-medium text-zinc-300">Prova de Cálculo II</p>
      <div className="mt-2 flex items-center gap-1 text-xs font-medium text-red-400">
        <AlertTriangle className="h-3.5 w-3.5" />
        Atrasada
      </div>
    </div>
  );
}

/* ─── Hábitos: mockup gamificado ─── */

const MOCK_WEEK = [
  { label: "S", done: true, today: false },
  { label: "T", done: true, today: false },
  { label: "Q", done: false, today: true },
  { label: "Q", done: false, today: false },
  { label: "S", done: false, today: false },
  { label: "S", done: false, today: false },
  { label: "D", done: false, today: false },
] as const;

function MockHabitCard(): ReactElement {
  return (
    <div className={`${MOCK_CARD} max-w-md overflow-hidden shadow-xl ring-1 ring-zinc-800/80`}>
      <div className="flex items-start justify-between border-b border-zinc-800/80 p-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-400" />
            <h3 className="text-sm font-semibold text-zinc-100">Leitura 30 minutos</h3>
          </div>
          <p className="mt-1 flex items-center gap-1 text-xs text-orange-400">
            <Flame className="h-3.5 w-3.5" />
            Ofensiva: <span className="font-bold tabular-nums">12</span> dias
          </p>
        </div>
        <div className="relative">
          <button
            type="button"
            className="rounded-md p-1 text-zinc-500"
            aria-hidden
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          <div className="absolute right-0 top-8 z-10 min-w-[140px] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-xl ring-1 ring-black/40">
            <div className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-300">
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </div>
            <div className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400">
              <Trash2 className="h-3.5 w-3.5" />
              Excluir
            </div>
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Esta semana</p>
        <div className="mt-2 flex items-center gap-1.5">
          {MOCK_WEEK.map((d, i) => (
            <div key={`${d.label}-${i}`} className="flex flex-col items-center gap-1">
              <span className="text-[9px] font-medium text-zinc-600">{d.label}</span>
              <div
                className={`h-6 w-6 rounded-full ${
                  d.done
                    ? "bg-orange-500"
                    : d.today
                      ? "border-2 border-zinc-500"
                      : "border border-zinc-700"
                }`}
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2.5">
          <span className="flex items-center gap-1 rounded-md bg-amber-950/50 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
            <Star className="h-2.5 w-2.5" />
            Nv 4
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full w-[65%] rounded-full bg-amber-500" />
          </div>
          <span className="text-[10px] tabular-nums text-zinc-600">65/100 XP</span>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[10px] text-zinc-500">
          <Hash className="h-3 w-3" />
          Total de check-ins: <span className="font-medium text-zinc-400">47</span>
        </p>
      </div>
    </div>
  );
}

/* ─── Finanças: mockup painel ─── */

function MiniAnalyticsDonut(): ReactElement {
  return (
    <div
      className="relative mx-auto h-28 w-28 shrink-0 rounded-full"
      style={{
        background:
          "conic-gradient(#34d399 0deg 130deg, #a78bfa 130deg 220deg, #fbbf24 220deg 290deg, #fb7185 290deg 360deg)",
      }}
    >
      <div className="absolute inset-[22%] rounded-full bg-zinc-900 ring-1 ring-zinc-800" />
    </div>
  );
}

function MockFinancePanel(): ReactElement {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className={`${MOCK_CARD} p-3 text-center`}>
          <TrendingUp className="mx-auto mb-1 h-4 w-4 text-emerald-400" />
          <p className="text-[9px] text-zinc-500">Receita</p>
          <p className="text-xs font-bold text-emerald-400">R$ 8.500</p>
        </div>
        <div className={`${MOCK_CARD} p-3 text-center`}>
          <TrendingDown className="mx-auto mb-1 h-4 w-4 text-red-400" />
          <p className="text-[9px] text-zinc-500">Despesa</p>
          <p className="text-xs font-bold text-red-400">R$ 4.120</p>
        </div>
        <div className={`${MOCK_CARD} p-3 text-center`}>
          <Wallet className="mx-auto mb-1 h-4 w-4 text-zinc-300" />
          <p className="text-[9px] text-zinc-500">Saldo</p>
          <p className="text-xs font-bold text-zinc-100">R$ 4.380</p>
        </div>
      </div>
      <div className={`${MOCK_CARD} divide-y divide-zinc-800/80`}>
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            <div>
              <p className="text-xs font-medium text-zinc-200">Salário</p>
              <p className="text-[10px] text-zinc-500">Salário · fixo</p>
            </div>
            <Repeat className="h-3 w-3 text-orange-400/80" />
          </div>
          <span className="text-xs font-semibold text-emerald-400">+ R$ 7.000</span>
        </div>
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-3.5 w-3.5 text-red-400" />
            <div>
              <p className="text-xs font-medium text-zinc-200">iPhone (1/12)</p>
              <p className="text-[10px] text-zinc-500">Eletrônicos</p>
            </div>
            <CreditCard className="h-3 w-3 text-blue-400/90" />
          </div>
          <span className="text-xs font-semibold text-red-400">− R$ 416,67</span>
        </div>
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-3.5 w-3.5 text-red-400" />
            <div>
              <p className="text-xs font-medium text-zinc-200">Plano de saúde</p>
              <p className="text-[10px] text-zinc-500">Saúde · fixo</p>
            </div>
            <Repeat className="h-3 w-3 text-orange-400/80" />
          </div>
          <span className="text-xs font-semibold text-red-400">− R$ 890</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
        <MiniAnalyticsDonut />
        <div>
          <p className="text-[10px] font-medium text-zinc-400">Análise de gastos</p>
          <p className="text-[9px] text-zinc-600">Grupos: fixas, lazer, pessoal…</p>
        </div>
      </div>
      <div className={`${MOCK_CARD} p-4`}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-200">Tesouro Selic</p>
          <span className="text-[10px] text-emerald-400">+4,2% lucro</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
          <div>
            <p className="text-zinc-500">Investido</p>
            <p className="font-semibold text-zinc-300">R$ 12k</p>
          </div>
          <div>
            <p className="text-zinc-500">Saldo</p>
            <p className="font-semibold text-zinc-100">R$ 12,5k</p>
          </div>
          <div>
            <p className="text-zinc-500">Lucro</p>
            <p className="font-semibold text-emerald-400">R$ 512</p>
          </div>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full w-[18%] rounded-full bg-emerald-500/80" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <span className="flex items-center justify-center gap-1 rounded-lg border border-emerald-800/40 py-2 text-[10px] font-medium text-emerald-400">
            <PiggyBank className="h-3 w-3" />
            Aportar
          </span>
          <span className="flex items-center justify-center gap-1 rounded-lg border border-zinc-700 py-2 text-[10px] text-zinc-400">
            <RefreshCw className="h-3 w-3" />
            Saldo
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Cockpit unificado (seção final) ─── */

function UnifiedCockpitMockup(): ReactElement {
  return (
    <div className={`${MOCK_CARD} overflow-hidden p-4 ring-1 ring-zinc-800/90 sm:p-5`}>
      <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-zinc-200">Cockpit unificado</span>
        </div>
        <span className="text-[10px] text-zinc-500">Um app · três dimensões</span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
        <div className={`${MOCK_CARD} md:col-span-2 md:row-span-2 p-4`}>
          <Wallet className="h-4 w-4 text-zinc-400" />
          <p className="mt-2 text-2xl font-bold text-zinc-100">R$ 4.380</p>
          <p className="text-[10px] text-zinc-500">Saldo consolidado do mês</p>
          <div className="mt-4 space-y-2">
            <div className="h-1.5 rounded-full bg-zinc-800">
              <div className="h-full w-3/5 rounded-full bg-emerald-500/70" />
            </div>
            <p className="text-[9px] text-zinc-600">Metas de gasto sob controle</p>
          </div>
        </div>
        <div className={`${MOCK_CARD} md:col-span-2 p-3`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-zinc-500">Hábitos hoje</span>
            <Flame className="h-4 w-4 text-orange-400" />
          </div>
          <p className="mt-2 text-lg font-bold text-zinc-100">5/6</p>
          <p className="text-[9px] text-orange-400/90">Streak médio: 9 dias</p>
        </div>
        <div className={`${MOCK_CARD} md:col-span-2 p-3`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-zinc-500">Metas ativas</span>
            <Target className="h-4 w-4 text-blue-400" />
          </div>
          <p className="mt-2 text-lg font-bold text-zinc-100">4</p>
          <p className="text-[9px] text-amber-400">2 com prazo esta semana</p>
        </div>
        <div className={`${MOCK_CARD} md:col-span-4 flex flex-wrap items-center gap-3 p-3`}>
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-800 text-[10px] text-zinc-400"
              >
                {i === 1 ? "✓" : "○"}
              </div>
            ))}
          </div>
          <p className="text-[10px] leading-relaxed text-zinc-500">
            Próximos passos: revisar despesas parceladas, manter streak de leitura, concluir subtarefa
            &quot;API Gateway&quot; na meta de lançamento.
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionShell({
  id,
  eyebrow,
  title,
  description,
  children,
  visual,
  reverse,
}: {
  readonly id?: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: React.ReactNode;
  readonly children: React.ReactNode;
  readonly visual: React.ReactNode;
  readonly reverse?: boolean;
}): ReactElement {
  return (
    <section id={id} className="border-t border-zinc-800/80 px-5 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className={reverse ? "lg:order-2" : ""}>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{eyebrow}</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">{title}</h2>
            <div className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">{description}</div>
            <div className="mt-8">{children}</div>
          </div>
          <div
            className={`relative flex justify-center ${reverse ? "lg:order-1 lg:justify-start" : "lg:justify-end"}`}
          >
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-zinc-800/20 to-transparent blur-3xl" />
            {visual}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Landing(): ReactElement {
  return (
    <div className="overflow-x-hidden bg-zinc-950">
      {/* Hero */}
      <section className="relative px-5 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.12),transparent)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-400">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            Life Manager para quem leva organização a sério
          </p>
          <h1 className="bg-gradient-to-b from-zinc-50 via-zinc-100 to-zinc-500 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl sm:leading-tight">
            Sua vida, perfeitamente sincronizada
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Abandone o caos de usar cinco apps diferentes. Gerencie{" "}
            <span className="text-zinc-300">metas</span>,{" "}
            <span className="text-zinc-300">hábitos</span> e{" "}
            <span className="text-zinc-300">finanças</span> em um único cockpit gamificado —
            pensado para produtividade real, não para mais uma lista esquecida.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              to="/register"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 px-8 py-3.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-black/20 transition hover:bg-white sm:w-auto"
            >
              Começar gratuitamente
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-700 bg-transparent px-8 py-3.5 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900/50 sm:w-auto"
            >
              Fazer login
            </Link>
          </div>
        </div>
        <HeroBentoMockup />
      </section>

      {/* Módulo Metas */}
      <SectionShell
        id="metas"
        eyebrow="Módulo Metas"
        title="Nichos, prazos inteligentes e checklist que anda"
        description={
          <>
            O <strong className="font-medium text-zinc-300">LifeSync</strong> deixa você organizar metas por contexto real —
            Estudos, Empresarial, Família, Sonhos e mais — com badges visuais instantâneas. Cada objetivo vira{" "}
            <strong className="font-medium text-zinc-300">passos acionáveis</strong>: subtarefas com check, barra de progresso
            e percentual explícito. Prazos ganham sinais claros:{" "}
            <strong className="font-medium text-red-400">atraso</strong> em vermelho,{" "}
            <strong className="font-medium text-amber-400">urgência</strong> com contagem em dias — para você priorizar sem
            abrir cinco abas no Notion.
          </>
        }
        visual={
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
            <MockGoalCard />
            <MockGoalCardOverdue />
          </div>
        }
      >
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 ring-2 ring-blue-500/40 ring-offset-4 ring-offset-zinc-950">
            <Target className="h-7 w-7 text-blue-400" />
          </span>
          <p className="text-sm text-zinc-500">
            Kanban, categorias e subtarefas — o mesmo fluxo que você usa logado, aqui em destaque.
          </p>
        </div>
      </SectionShell>

      {/* Módulo Hábitos */}
      <SectionShell
        id="habitos"
        eyebrow="Módulo Hábitos"
        title="Gamificação que prende — sem virar brinquedo"
        description={
          <>
            Cada check-in rende <strong className="font-medium text-zinc-300">XP</strong>; o nível sobe a cada marco e a barra
            mostra quanto falta para o próximo. A <strong className="font-medium text-zinc-300">ofensiva semanal</strong>{" "}
            (estilo Duolingo) deixa o ritmo visível, dia a dia. Você define{" "}
            <strong className="font-medium text-zinc-300">hábito diário</strong> ou{" "}
            <strong className="font-medium text-zinc-300">meta semanal</strong> com X dias — flexível para a sua rotina, rígida
            onde importa. Edição e exclusão ficam a um toque, com histórico de check-ins sempre à mão.
          </>
        }
        visual={<MockHabitCard />}
        reverse
      >
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 ring-2 ring-orange-500/50 ring-offset-4 ring-offset-zinc-950">
            <Flame className="h-7 w-7 text-orange-400" />
          </span>
          <p className="text-sm text-zinc-500">XP, nível, semana e menu de ações — fiéis à tela de Hábitos.</p>
        </div>
      </SectionShell>

      {/* Módulo Finanças */}
      <SectionShell
        id="financas"
        eyebrow="Módulo Finanças"
        title="Cartão, parcelas, fixas e análise — no mesmo painel"
        description={
          <>
            Controle <strong className="font-medium text-zinc-300">débito e crédito</strong>, com parcelas exibidas como
            &quot;iPhone (1/12)&quot; e ícones que distinguem recorrência de compra parcelada. Receitas e despesas{" "}
            <strong className="font-medium text-zinc-300">fixas</strong> aparecem com o selo de recorrência. A aba{" "}
            <strong className="font-medium text-zinc-300">Análise</strong> traduz o mês em gráficos (distribuição por grupos e
            fluxo de caixa). Em <strong className="font-medium text-zinc-300">Investimentos</strong>, aportes são separados de
            atualização de saldo — lucro e % refletem rendimento real, não confusão com capital novo injetado.
          </>
        }
        visual={<MockFinancePanel />}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-2 ring-emerald-500/45 ring-offset-4 ring-offset-zinc-950">
            <Wallet className="h-7 w-7 text-emerald-400" />
          </span>
          <p className="text-sm text-zinc-500">Resumo mensal, lista, donut de análise e card de investimento — como no app.</p>
        </div>
      </SectionShell>

      {/* Cockpit central + orquestração (contexto produto) */}
      <section className="border-t border-zinc-800/80 px-5 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Cockpit central</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
              O poder da unificação — um painel, alta performance
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
              LifeSync é pensado para <strong className="font-medium text-zinc-300">alta performance e dados precisos</strong>
              : metas, hábitos e finanças orquestrados na mesma experiência, com a clareza de um cockpit — não um amontoado de
              ferramentas desconectadas. A interface prioriza{" "}
              <strong className="font-medium text-zinc-300">decisão rápida</strong>: saldo do período, o que falta fazer hoje e
              o que está no radar das metas, lado a lado, no estilo Bento que você já conhece logado.
            </p>
          </div>
          <div className="mt-12">
            <UnifiedCockpitMockup />
          </div>
          <ul className="mx-auto mt-10 max-w-2xl space-y-3 text-sm text-zinc-500">
            <li className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500/80" />
              <span>
                <strong className="text-zinc-400">SPA + APIs REST</strong> — frontend ágil falando com microserviços
                especializados, cada um com seu próprio dado isolado (padrão database-per-service).
              </span>
            </li>
            <li className="flex gap-3">
              <PieChart className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500/80" />
              <span>
                A mesma <strong className="text-zinc-400">inteligência visual</strong> da aba Análise alimenta a narrativa do
                mês — sem poluir a visão geral com projeções infinitas.
              </span>
            </li>
            <li className="flex gap-3">
              <LayoutDashboard className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500/80" />
              <span>
                <strong className="text-zinc-400">Um login</strong>, um header, um lugar para retornar todos os dias.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-zinc-800/80 px-5 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-10 text-center ring-1 ring-zinc-800/80 sm:p-14">
          <h2 className="bg-gradient-to-b from-zinc-50 to-zinc-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            Sua vida, perfeitamente sincronizada
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm text-zinc-500 sm:text-base">
            Junte-se a quem trata organização pessoal como produto: métricas, hábitos e dinheiro no mesmo cockpit.
          </p>
          <Link
            to="/register"
            className="mt-10 inline-flex w-full items-center justify-center rounded-xl bg-zinc-100 px-8 py-4 text-base font-bold text-zinc-950 shadow-xl shadow-black/30 transition hover:bg-white sm:w-auto sm:px-12 sm:py-4"
          >
            Junte-se à elite da produtividade
          </Link>
          <Link
            to="/login"
            className="mt-4 block text-sm font-medium text-zinc-500 transition hover:text-zinc-300"
          >
            Já tenho conta — entrar
          </Link>
        </div>
      </section>

      <footer className="border-t border-zinc-800/80 px-5 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm font-medium text-zinc-400">LifeSync</p>
          <p className="mt-2 text-xs text-zinc-600">© 2026 Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
