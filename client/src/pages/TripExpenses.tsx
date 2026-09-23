import { useState, type FormEvent, type ReactElement } from "react";
import { format } from "date-fns";
import { Loader2, Plus, Sparkles, Trash2, Wallet } from "lucide-react";
import { AiFinanceCommand } from "../components/ai/AiFinanceCommand";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { LoadMoreButton } from "../components/ui/LoadMoreButton";
import { useAiUsage } from "../hooks/useAi";
import {
  useCreateTransaction,
  useDeleteTransaction,
  useFinancialSummary,
} from "../hooks/useFinance";
import { formatBRL, progressPercent } from "../lib/tripMeta";
import type { Transaction } from "../api/finance";
import { useTripContext } from "./TripLayout";

const TRAVEL_CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Lazer",
  "Saúde",
  "Outros",
] as const;

function todayIso(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function TripExpenses(): ReactElement {
  const { trip } = useTripContext();
  const { data: aiUsage } = useAiUsage();
  const isAiEnabled = aiUsage?.enabled === true;
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const {
    transactions,
    total,
    totalExpense,
    isPending,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useFinancialSummary(undefined, undefined, 20, trip.id);

  const [showAi, setShowAi] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<(typeof TRAVEL_CATEGORIES)[number]>("Alimentação");
  const [date, setDate] = useState(todayIso);
  const [toDelete, setToDelete] = useState<Transaction | null>(null);

  const budget = trip.budgetAmount;
  const spentPercent = budget !== null ? progressPercent(totalExpense, budget) : 0;
  const remaining = budget !== null ? budget - totalExpense : null;

  const handleAdd = (formEvent: FormEvent): void => {
    formEvent.preventDefault();
    const trimmedTitle = title.trim();
    const parsedAmount = Number.parseFloat(amount.replace(",", "."));
    if (trimmedTitle.length === 0) return;
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;

    createTransaction.mutate(
      {
        title: trimmedTitle,
        amount: parsedAmount,
        type: "EXPENSE",
        category,
        date,
        paymentMethod: "DEBIT",
        isFixed: false,
        tripId: trip.id,
      },
      {
        onSuccess: () => {
          setTitle("");
          setAmount("");
          setDate(todayIso());
        },
      },
    );
  };

  return (
    <div className="space-y-5">
      <div className="ls-card space-y-3 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
              Gastos
            </p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight text-ink">
              {formatBRL(totalExpense)}
            </p>
            {budget !== null ? (
              <p className="mt-1 text-xs font-medium text-ink-muted">
                de {formatBRL(budget)}
                {remaining !== null && (
                  <>
                    {" "}
                    ·{" "}
                    {remaining >= 0
                      ? `${formatBRL(remaining)} sobrando`
                      : `${formatBRL(Math.abs(remaining))} acima`}
                  </>
                )}
              </p>
            ) : (
              <p className="mt-1 text-xs text-ink-muted">
                Sem teto. Edite a viagem para definir um orçamento.
              </p>
            )}
          </div>
          {isAiEnabled && (
            <button
              type="button"
              onClick={() => setShowAi(true)}
              className="ls-btn !w-auto shrink-0 px-3"
            >
              <Sparkles className="h-4 w-4" />
              IA
            </button>
          )}
        </div>
        {budget !== null && (
          <div className="h-2 overflow-hidden rounded-full bg-surface-800">
            <div
              className={`h-full rounded-full transition-[width] ${
                remaining !== null && remaining < 0 ? "bg-red-500" : "bg-accent-600"
              }`}
              style={{ width: `${Math.min(100, spentPercent)}%` }}
            />
          </div>
        )}
      </div>

      <form
        onSubmit={handleAdd}
        className="space-y-2 rounded-2xl border border-edge bg-surface-900 p-3.5 shadow-sm"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="O que foi? Ex: almoço no Leme"
          className="ls-input"
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <input
            type="number"
            min={0.01}
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Valor"
            className="ls-input"
            aria-label="Valor"
          />
          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as (typeof TRAVEL_CATEGORIES)[number])
            }
            className="ls-input"
            aria-label="Categoria"
          >
            {TRAVEL_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="ls-input"
            aria-label="Data"
          />
          <button
            type="submit"
            disabled={
              createTransaction.isPending ||
              title.trim().length === 0 ||
              amount.trim().length === 0
            }
            className="ls-btn !w-auto justify-center px-3"
          >
            {createTransaction.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </button>
        </div>
      </form>

      {isPending ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-ink-faint" />
        </div>
      ) : transactions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-edge px-6 py-10 text-center text-xs leading-relaxed text-ink-muted">
          Nenhum gasto nesta viagem. Fale com a IA ou lance na mão — entra no
          extrato do Pessoal também.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {transactions.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-edge/70 bg-surface-900 px-3 py-2.5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-600/15 text-accent-700">
                <Wallet className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                <p className="mt-0.5 text-[10px] text-ink-faint">
                  {item.category} · {formatDate(item.date)}
                </p>
              </div>
              <span
                className={`shrink-0 text-sm font-semibold ${
                  item.type === "INCOME" ? "text-emerald-700" : "text-ink"
                }`}
              >
                {item.type === "INCOME" ? "+" : "−"}
                {formatBRL(item.amount)}
              </span>
              <button
                type="button"
                onClick={() => setToDelete(item)}
                className="shrink-0 rounded-md p-1.5 text-ink-faint transition hover:bg-red-50 hover:text-red-600"
                aria-label={`Remover ${item.title}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <LoadMoreButton
        hasMore={hasNextPage}
        isLoading={isFetchingNextPage}
        onLoadMore={() => void fetchNextPage()}
        loadedCount={transactions.length}
        total={total}
        label="Carregar mais gastos"
      />

      {showAi && <AiFinanceCommand tripId={trip.id} onClose={() => setShowAi(false)} />}

      {toDelete !== null && (
        <ConfirmDialog
          title="Remover gasto"
          description={`"${toDelete.title}" sai desta viagem e do extrato.`}
          confirmLabel="Remover"
          danger
          pending={deleteTransaction.isPending}
          onConfirm={() =>
            deleteTransaction.mutate(toDelete.id, {
              onSuccess: () => setToDelete(null),
            })
          }
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
