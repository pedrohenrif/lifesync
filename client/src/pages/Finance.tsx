import { type ReactElement, useState, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Trash2,
  X,
  CreditCard,
  RefreshCw,
  BarChart3,
  Repeat,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  PieChart as PieChartIcon,
  Trophy,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  useFinancialSummary,
  useFinanceAnalytics,
  useCreateTransaction,
  useDeleteTransaction,
} from "../hooks/useFinance";
import {
  useInvestments,
  useCreateInvestment,
  useUpdateInvestmentBalance,
  useAddContribution,
  useDeleteInvestment,
} from "../hooks/useInvestments";
import type { Transaction, TransactionType, PaymentMethod, ExpenseGroupId } from "../api/finance";
import type { Investment } from "../api/investments";

/* ─── Constantes ─── */

const CATEGORY_OPTIONS = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Saúde",
  "Educação",
  "Lazer",
  "Salário",
  "Freelance",
  "Investimentos",
  "Outros",
] as const;

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
] as const;

type TabId = "overview" | "investments" | "analysis";

const GROUP_CHART_COLORS: Record<ExpenseGroupId, string> = {
  FIXED: "#34d399",
  LEISURE: "#a78bfa",
  PERSONAL: "#fbbf24",
  OTHER: "#fb7185",
};

const CASH_FLOW_COLORS = { income: "#22d3ee", expense: "#f87171" } as const;

const ANALYSIS_CARD =
  "rounded-2xl bg-zinc-900 p-6 ring-1 ring-zinc-800/80";

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "#18181b",
  border: "1px solid #3f3f46",
  borderRadius: "8px",
  color: "#f4f4f5",
} as const;

/* ─── Utilitários ─── */

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function getCurrentMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

const INPUT_CLASS =
  "w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-zinc-600 placeholder:text-zinc-600";

/* ─── Seletor de Mês ─── */

function MonthSelector({
  year,
  month,
  onChange,
}: {
  readonly year: number;
  readonly month: number;
  readonly onChange: (year: number, month: number) => void;
}): ReactElement {
  const handlePrev = () => {
    if (month === 1) onChange(year - 1, 12);
    else onChange(year, month - 1);
  };

  const handleNext = () => {
    if (month === 12) onChange(year + 1, 1);
    else onChange(year, month + 1);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handlePrev}
        className="rounded-lg border border-zinc-800 p-1.5 text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[160px] text-center text-sm font-medium text-zinc-200">
        {MONTH_NAMES[month - 1]} {year}
      </span>
      <button
        type="button"
        onClick={handleNext}
        className="rounded-lg border border-zinc-800 p-1.5 text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ─── Summary Card ─── */

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  readonly label: string;
  readonly value: number;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly accent: "green" | "red" | "neutral";
}): ReactElement {
  const bg = accent === "green" ? "bg-emerald-500/10" : accent === "red" ? "bg-red-500/10" : "bg-zinc-800";
  const iconColor = accent === "green" ? "text-emerald-400" : accent === "red" ? "text-red-400" : "text-zinc-100";
  const textColor = accent === "green" ? "text-emerald-400" : accent === "red" ? "text-red-400" : "text-zinc-100";

  return (
    <div className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${bg} ${iconColor}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-zinc-500">{label}</p>
        <p className={`text-xl font-bold ${textColor}`}>{formatCurrency(value)}</p>
      </div>
    </div>
  );
}

/* ─── Formulário de Transação ─── */

function CreateTransactionForm({ onClose }: { readonly onClose: () => void }): ReactElement {
  const createMutation = useCreateTransaction();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [category, setCategory] = useState<string>(CATEGORY_OPTIONS[0]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("DEBIT");
  const [isFixed, setIsFixed] = useState(false);
  const [installments, setInstallments] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number.parseFloat(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) return;

    const parsedInstallments =
      paymentMethod === "CREDIT" && installments.trim().length > 0
        ? Number.parseInt(installments, 10)
        : undefined;

    createMutation.mutate(
      { title: title.trim(), amount: numericAmount, type, category, date, paymentMethod, isFixed, installments: parsedInstallments },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">Nova Transação</h3>
        <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition"><X className="h-4 w-4" /></button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input className={INPUT_CLASS} placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input className={INPUT_CLASS} placeholder="Valor (total)" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <select className={INPUT_CLASS} value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
          <option value="EXPENSE">Despesa</option>
          <option value="INCOME">Receita</option>
        </select>
        <select className={INPUT_CLASS} value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORY_OPTIONS.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
        </select>
        <input className={INPUT_CLASS} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs font-medium text-zinc-500">Pagamento:</span>
        <div className="flex gap-2">
          {(["DEBIT", "CREDIT"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setPaymentMethod(m); if (m === "DEBIT") setInstallments(""); }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                paymentMethod === m ? "bg-zinc-700 text-zinc-100" : "border border-zinc-800 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {m === "CREDIT" ? <CreditCard className="h-3.5 w-3.5" /> : <DollarSign className="h-3.5 w-3.5" />}
              {m === "DEBIT" ? "Débito" : "Crédito"}
            </button>
          ))}
        </div>
      </div>

      {paymentMethod === "CREDIT" && (
        <div>
          <label className="text-xs text-zinc-500">Nº de Parcelas (deixe vazio para à vista)</label>
          <input className={INPUT_CLASS + " mt-1"} type="number" min="2" max="48" placeholder="Ex: 12" value={installments} onChange={(e) => setInstallments(e.target.value)} />
        </div>
      )}

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={isFixed} onChange={(e) => setIsFixed(e.target.checked)} className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 accent-orange-500" />
        <span className="text-xs text-zinc-400">Receita/Despesa fixa (recorrente mensal)</span>
        <Repeat className="h-3.5 w-3.5 text-zinc-600" />
      </label>

      <button type="submit" disabled={createMutation.isPending} className="w-full rounded-lg bg-zinc-100 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-white disabled:opacity-50">
        {createMutation.isPending ? "Salvando..." : "Adicionar Transação"}
      </button>
    </form>
  );
}

/* ─── Linha de Transação ─── */

function TransactionRow({ transaction }: { readonly transaction: Transaction }): ReactElement {
  const deleteMutation = useDeleteTransaction();
  const isIncome = transaction.type === "INCOME";

  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 transition hover:bg-zinc-900">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isIncome ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
          {isIncome ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-200">
            {transaction.title}
            {transaction.isFixed && <Repeat className="ml-1.5 inline h-3 w-3 text-orange-400" />}
            {transaction.paymentMethod === "CREDIT" && <CreditCard className="ml-1.5 inline h-3 w-3 text-blue-400" />}
          </p>
          <p className="text-xs text-zinc-500">
            {transaction.category} &middot; {formatDate(transaction.date)}
            {transaction.installment !== null && (
              <span className="ml-1 text-blue-400">
                ({transaction.installment.current}/{transaction.installment.total})
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className={`text-sm font-semibold ${isIncome ? "text-emerald-400" : "text-red-400"}`}>
          {isIncome ? "+" : "-"} {formatCurrency(transaction.amount)}
        </span>
        <button
          type="button"
          onClick={() => deleteMutation.mutate(transaction.id)}
          disabled={deleteMutation.isPending}
          className="rounded-md p-1.5 text-zinc-600 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── Seção de Transações ─── */

function TransactionSection({
  title,
  icon: Icon,
  transactions,
  emptyText,
}: {
  readonly title: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly transactions: readonly Transaction[];
  readonly emptyText: string;
}): ReactElement {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-zinc-500" />
        <h2 className="text-sm font-semibold text-zinc-400">{title}</h2>
        <span className="text-xs text-zinc-600">({transactions.length})</span>
      </div>
      {transactions.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-600">{emptyText}</p>
      ) : (
        <div className="space-y-1.5">
          {transactions.map((tx) => (
            <TransactionRow key={tx.id} transaction={tx} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Aba Visão Geral ─── */

function OverviewTab(): ReactElement {
  const [showForm, setShowForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);

  const { data, isPending, isError } = useFinancialSummary(selectedMonth.year, selectedMonth.month);

  const { incomes, fixedExpenses, variableExpenses } = useMemo(() => {
    if (data === undefined) return { incomes: [], fixedExpenses: [], variableExpenses: [] };
    return {
      incomes: data.transactions.filter((tx) => tx.type === "INCOME"),
      fixedExpenses: data.transactions.filter((tx) => tx.type === "EXPENSE" && tx.isFixed),
      variableExpenses: data.transactions.filter((tx) => tx.type === "EXPENSE" && !tx.isFixed),
    };
  }, [data]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <MonthSelector
          year={selectedMonth.year}
          month={selectedMonth.month}
          onChange={(year, month) => setSelectedMonth({ year, month })}
        />
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700"
        >
          <Plus className="h-4 w-4" />
          Nova Transação
        </button>
      </div>

      {isPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900" />
          ))}
        </div>
      ) : isError || data === undefined ? (
        <div className="py-24 text-center text-sm text-red-400">Erro ao carregar os dados financeiros.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCard label="Receitas" value={data.totalIncome} icon={TrendingUp} accent="green" />
            <SummaryCard label="Despesas" value={data.totalExpense} icon={TrendingDown} accent="red" />
            <SummaryCard label="Saldo do Mês" value={data.balance} icon={DollarSign} accent="neutral" />
          </div>

          {showForm && <CreateTransactionForm onClose={() => setShowForm(false)} />}

          <TransactionSection title="Receitas" icon={TrendingUp} transactions={incomes} emptyText="Nenhuma receita neste mês." />
          <TransactionSection title="Despesas Fixas" icon={Repeat} transactions={fixedExpenses} emptyText="Nenhuma despesa fixa neste mês." />
          <TransactionSection title="Despesas Variáveis / Parceladas" icon={CreditCard} transactions={variableExpenses} emptyText="Nenhuma despesa variável neste mês." />
        </>
      )}
    </div>
  );
}

/* ─── Aba Análise ─── */

function AnalysisTab(): ReactElement {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const { data, isPending, isError } = useFinanceAnalytics(selectedMonth.year, selectedMonth.month);

  const pieData = useMemo(() => {
    if (data === undefined) return [];
    return data.expenseByGroup
      .filter((g) => g.amount > 0)
      .map((g) => ({
        name: g.label,
        value: g.amount,
        fill: GROUP_CHART_COLORS[g.id],
      }));
  }, [data]);

  const barData = useMemo(() => {
    if (data === undefined) return [];
    return [
      {
        label: "Mês atual",
        Entradas: data.totalIncome,
        Saídas: data.totalExpense,
      },
    ];
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <MonthSelector
          year={selectedMonth.year}
          month={selectedMonth.month}
          onChange={(y, m) => setSelectedMonth({ year: y, month: m })}
        />
        <p className="max-w-xs text-right text-xs leading-relaxed text-zinc-500">
          Grupos: <span className="text-zinc-400">fixas</span>,{" "}
          <span className="text-zinc-400">saídas/lazer</span>,{" "}
          <span className="text-zinc-400">pessoal</span> e{" "}
          <span className="text-zinc-400">outros</span>.
        </p>
      </div>

      {isPending ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-2xl bg-zinc-900 ring-1 ring-zinc-800/80 lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-2xl bg-zinc-900 ring-1 ring-zinc-800/80" />
          <div className="h-64 animate-pulse rounded-2xl bg-zinc-900 ring-1 ring-zinc-800/80 lg:col-span-3" />
        </div>
      ) : isError || data === undefined ? (
        <div className="py-24 text-center text-sm text-red-400">Não foi possível carregar a análise.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
            <div className={`lg:col-span-2 ${ANALYSIS_CARD}`}>
              <h2 className="text-sm font-medium text-zinc-300">Distribuição das despesas</h2>
              <p className="mt-1 text-xs text-zinc-500">Percentual de cada grupo sobre o total gasto no mês.</p>
              {pieData.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-zinc-600">
                  Sem despesas neste mês — nada para exibir no gráfico.
                </div>
              ) : (
                <div className="mt-4 h-[280px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="58%"
                        outerRadius="82%"
                        paddingAngle={2}
                      >
                        {pieData.map((d) => (
                          <Cell key={d.name} fill={d.fill} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) =>
                          typeof value === "number" ? formatCurrency(value) : String(value ?? "")
                        }
                        contentStyle={CHART_TOOLTIP_STYLE}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: 12 }}
                        formatter={(value) => (
                          <span className="text-xs text-zinc-400">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className={ANALYSIS_CARD}>
              <div className="mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400/90" />
                <h2 className="text-sm font-medium text-zinc-300">Maiores gastos</h2>
              </div>
              <p className="mb-4 text-xs text-zinc-500">Três grupos com maior volume no período.</p>
              {data.topExpenseGroups.length === 0 ? (
                <p className="text-sm text-zinc-600">Nenhuma despesa no mês.</p>
              ) : (
                <ul className="space-y-4">
                  {data.topExpenseGroups.map((g, i) => (
                    <li
                      key={g.id}
                      className="flex items-start justify-between gap-3 border-b border-zinc-800/60 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-500">#{i + 1}</p>
                        <p className="truncate text-sm text-zinc-200">{g.label}</p>
                        <p className="text-xs text-zinc-500">{g.percentOfExpense.toFixed(1)}% das despesas</p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-zinc-100">
                        {formatCurrency(g.amount)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className={ANALYSIS_CARD}>
            <h2 className="text-sm font-medium text-zinc-300">Fluxo de caixa</h2>
            <p className="mt-1 text-xs text-zinc-500">Entradas e saídas do mês lado a lado.</p>
            <div className="mt-4 h-[260px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
                    }
                  />
                  <Tooltip
                    formatter={(value) =>
                      typeof value === "number" ? formatCurrency(value) : String(value ?? "")
                    }
                    contentStyle={CHART_TOOLTIP_STYLE}
                  />
                  <Bar
                    dataKey="Entradas"
                    fill={CASH_FLOW_COLORS.income}
                    radius={[8, 8, 0, 0]}
                    maxBarSize={80}
                  />
                  <Bar
                    dataKey="Saídas"
                    fill={CASH_FLOW_COLORS.expense}
                    radius={[8, 8, 0, 0]}
                    maxBarSize={80}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Card de Investimento ─── */

function InvestmentCard({ investment }: { readonly investment: Investment }): ReactElement {
  const [editMode, setEditMode] = useState<"none" | "balance" | "contribute">("none");
  const [balance, setBalance] = useState(String(investment.currentBalance));
  const [contributeAmount, setContributeAmount] = useState("");
  const updateMutation = useUpdateInvestmentBalance();
  const contributeMutation = useAddContribution();
  const deleteMutation = useDeleteInvestment();

  const isPositive = investment.profitAmount >= 0;

  const handleSaveBalance = () => {
    const num = Number.parseFloat(balance);
    if (Number.isNaN(num)) return;
    updateMutation.mutate({ id: investment.id, currentBalance: num }, { onSuccess: () => setEditMode("none") });
  };

  const handleContribute = () => {
    const num = Number.parseFloat(contributeAmount);
    if (Number.isNaN(num) || num <= 0) return;
    contributeMutation.mutate({ id: investment.id, amount: num }, {
      onSuccess: () => { setEditMode("none"); setContributeAmount(""); },
    });
  };

  const handleCancel = () => {
    setEditMode("none");
    setBalance(String(investment.currentBalance));
    setContributeAmount("");
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-200">{investment.name}</h3>
        <button
          type="button"
          onClick={() => deleteMutation.mutate(investment.id)}
          disabled={deleteMutation.isPending}
          className="rounded-md p-1 text-zinc-600 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-zinc-500">Investido</p>
          <p className="text-sm font-semibold text-zinc-300">{formatCurrency(investment.investedAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Saldo Atual</p>
          <p className="text-sm font-semibold text-zinc-100">{formatCurrency(investment.currentBalance)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Lucro/Prejuízo</p>
          <p className={`text-sm font-semibold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
            {isPositive ? "+" : ""}{formatCurrency(investment.profitAmount)}{" "}
            <span className="text-xs">({isPositive ? "+" : ""}{investment.profitPercent.toFixed(2)}%)</span>
          </p>
        </div>
      </div>

      {editMode === "balance" && (
        <div className="flex items-center gap-2">
          <input className={INPUT_CLASS + " flex-1"} type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="Novo saldo total" />
          <button type="button" onClick={handleSaveBalance} disabled={updateMutation.isPending} className="rounded-lg bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-white disabled:opacity-50">Salvar</button>
          <button type="button" onClick={handleCancel} className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400 transition hover:text-zinc-200"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {editMode === "contribute" && (
        <div className="flex items-center gap-2">
          <input className={INPUT_CLASS + " flex-1"} type="number" step="0.01" min="0.01" value={contributeAmount} onChange={(e) => setContributeAmount(e.target.value)} placeholder="Valor do aporte" />
          <button type="button" onClick={handleContribute} disabled={contributeMutation.isPending} className="rounded-lg bg-emerald-600/20 px-4 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-600/30 disabled:opacity-50">Aportar</button>
          <button type="button" onClick={handleCancel} className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400 transition hover:text-zinc-200"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {editMode === "none" && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setEditMode("contribute")}
            className="flex items-center justify-center gap-2 rounded-lg border border-emerald-800/50 py-2 text-xs font-medium text-emerald-400 transition hover:border-emerald-600 hover:bg-emerald-600/10"
          >
            <PiggyBank className="h-3.5 w-3.5" />
            Aportar
          </button>
          <button
            type="button"
            onClick={() => setEditMode("balance")}
            className="flex items-center justify-center gap-2 rounded-lg border border-zinc-800 py-2 text-xs font-medium text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Atualizar Saldo
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Formulário de Investimento ─── */

function CreateInvestmentForm({ onClose }: { readonly onClose: () => void }): ReactElement {
  const createMutation = useCreateInvestment();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number.parseFloat(amount);
    if (Number.isNaN(num) || num < 0) return;
    createMutation.mutate({ name: name.trim(), investedAmount: num }, { onSuccess: () => onClose() });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">Novo Investimento</h3>
        <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition"><X className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input className={INPUT_CLASS} placeholder="Nome (ex: Tesouro Selic)" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className={INPUT_CLASS} placeholder="Valor aportado" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </div>
      <button type="submit" disabled={createMutation.isPending} className="w-full rounded-lg bg-zinc-100 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-white disabled:opacity-50">
        {createMutation.isPending ? "Salvando..." : "Adicionar Investimento"}
      </button>
    </form>
  );
}

/* ─── Aba Investimentos ─── */

function InvestmentsTab(): ReactElement {
  const [showForm, setShowForm] = useState(false);
  const { data, isPending, isError } = useInvestments();

  if (isPending) {
    return (
      <div className="flex justify-center py-24 text-zinc-500 text-sm">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
        <span className="ml-3">Carregando investimentos...</span>
      </div>
    );
  }

  if (isError || data === undefined) {
    return <div className="py-24 text-center text-sm text-red-400">Erro ao carregar investimentos.</div>;
  }

  const totalProfit = Math.round((data.totalBalance - data.totalInvested) * 100) / 100;
  const totalPercent = data.totalInvested > 0 ? Math.round(((data.totalBalance - data.totalInvested) / data.totalInvested) * 10000) / 100 : 0;
  const isUp = totalProfit >= 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700"
        >
          <Plus className="h-4 w-4" />
          Novo Investimento
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Total Investido" value={data.totalInvested} icon={BarChart3} accent="neutral" />
        <SummaryCard label="Saldo Total" value={data.totalBalance} icon={Wallet} accent="green" />
        <div className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${isUp ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
            {isUp ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
          </div>
          <div>
            <p className="text-sm text-zinc-500">Rendimento</p>
            <p className={`text-xl font-bold ${isUp ? "text-emerald-400" : "text-red-400"}`}>
              {isUp ? "+" : ""}{formatCurrency(totalProfit)}{" "}
              <span className="text-sm font-medium">({isUp ? "+" : ""}{totalPercent.toFixed(2)}%)</span>
            </p>
          </div>
        </div>
      </div>

      {showForm && <CreateInvestmentForm onClose={() => setShowForm(false)} />}

      {data.investments.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-600">Nenhum investimento registrado ainda.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {data.investments.map((inv) => (
            <InvestmentCard key={inv.id} investment={inv} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Página Principal ─── */

export function Finance(): ReactElement {
  const [tab, setTab] = useState<TabId>("overview");

  const tabs: readonly { readonly id: TabId; readonly label: string; readonly icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "overview", label: "Visão Geral", icon: Wallet },
    { id: "investments", label: "Investimentos", icon: BarChart3 },
    { id: "analysis", label: "Análise", icon: PieChartIcon },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Wallet className="h-6 w-6 text-zinc-400" />
        <h1 className="text-xl font-bold text-zinc-100">Finanças</h1>
      </div>

      <div className="flex w-full max-w-2xl flex-wrap gap-1 rounded-xl bg-zinc-900 p-1 ring-1 ring-zinc-800/80">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
              tab === id ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <OverviewTab />
      ) : tab === "investments" ? (
        <InvestmentsTab />
      ) : (
        <AnalysisTab />
      )}
    </div>
  );
}
