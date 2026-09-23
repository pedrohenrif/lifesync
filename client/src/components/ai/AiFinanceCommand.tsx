import type { FormEvent, ReactElement } from "react";
import { useState } from "react";
import { Sparkles, Loader2, Check, X, AlertTriangle } from "lucide-react";
import type { TransactionDraft } from "../../api/ai";
import { useParseFinanceCommand } from "../../hooks/useAi";
import { useCreateTransaction } from "../../hooks/useFinance";
import { AppModalShell } from "../ui/AppModalShell";

const INPUT_CLASS = "ls-input";

/** Abaixo disso a IA basicamente adivinhou algum campo, então avisamos o usuário. */
const LOW_CONFIDENCE = 0.5;

const PERSONAL_EXAMPLES = [
  "almoço 42 reais ontem no débito",
  "recebi 3500 de salário dia 5",
  "geladeira 2400 em 12x no crédito",
  "aluguel 1800 todo mês",
];

const TRAVEL_EXAMPLES = [
  "uber 32 no débito",
  "almoço 80",
  "ingresso do cristo 45 no crédito",
];

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function DraftRow({
  draft,
  isSelected,
  onToggle,
}: {
  readonly draft: TransactionDraft;
  readonly isSelected: boolean;
  readonly onToggle: () => void;
}): ReactElement {
  const isIncome = draft.type === "INCOME";
  const isUncertain = draft.confidence < LOW_CONFIDENCE;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${
        isSelected
          ? "border-accent-600/60 bg-accent-600/10"
          : "border-edge bg-surface-900 hover:border-accent-600/40"
      }`}
    >
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
          isSelected ? "border-accent-600 bg-accent-600" : "border-edge"
        }`}
      >
        {isSelected && <Check className="h-3 w-3 text-accent-fg" />}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium text-ink">{draft.title}</span>
          <span
            className={`shrink-0 text-sm font-semibold ${isIncome ? "text-emerald-600" : "text-red-600"}`}
          >
            {isIncome ? "+" : "−"}
            {formatCurrency(draft.amount)}
          </span>
        </span>

        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-muted">
          <span>{draft.category}</span>
          <span className="text-ink-faint">·</span>
          <span>{formatDate(draft.date)}</span>
          <span className="text-ink-faint">·</span>
          <span>{draft.paymentMethod === "CREDIT" ? "Crédito" : "Débito"}</span>
          {draft.installments !== null && (
            <>
              <span className="text-ink-faint">·</span>
              <span className="text-accent-700">{draft.installments}x</span>
            </>
          )}
          {draft.isFixed && (
            <>
              <span className="text-ink-faint">·</span>
              <span className="text-accent-700">fixa</span>
            </>
          )}
        </span>

        {isUncertain && (
          <span className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-700">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            Interpretação incerta — confira os valores antes de salvar.
          </span>
        )}
      </span>
    </button>
  );
}

type AiFinanceCommandProps = {
  readonly onClose: () => void;
  readonly tripId?: string;
};

export function AiFinanceCommand({ onClose, tripId }: AiFinanceCommandProps): ReactElement {
  const [text, setText] = useState("");
  const [drafts, setDrafts] = useState<readonly TransactionDraft[]>([]);
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());

  const parseCommand = useParseFinanceCommand();
  const createTransaction = useCreateTransaction();
  const examples = tripId !== undefined ? TRAVEL_EXAMPLES : PERSONAL_EXAMPLES;

  const handleParse = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed.length < 3) return;

    parseCommand.mutate(trimmed, {
      onSuccess: (data) => {
        setDrafts(data.drafts);
        setSelected(new Set(data.drafts.map((_, index) => index)));
      },
    });
  };

  const toggle = (index: number): void => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const reset = (): void => {
    setDrafts([]);
    setSelected(new Set());
  };

  // Cada rascunho vira uma chamada normal de criação; a IA nunca grava direto.
  const handleConfirm = async (): Promise<void> => {
    const chosen = drafts.filter((_, index) => selected.has(index));
    for (const draft of chosen) {
      await createTransaction.mutateAsync({
        title: draft.title,
        amount: draft.amount,
        type: draft.type,
        category: draft.category,
        date: draft.date,
        paymentMethod: draft.paymentMethod,
        isFixed: draft.isFixed,
        ...(draft.installments !== null ? { installments: draft.installments } : {}),
        ...(tripId !== undefined ? { tripId } : {}),
      });
    }
    onClose();
  };

  const hasDrafts = drafts.length > 0;

  return (
    <AppModalShell
      title={tripId !== undefined ? "Lançar gasto da viagem" : "Lançar com IA"}
      onClose={onClose}
      maxWidthClass="max-w-lg"
    >
      <div className="space-y-4">
        <form onSubmit={handleParse} className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Descreva o gasto ou a receita como você falaria..."
            rows={3}
            className={`${INPUT_CLASS} resize-none`}
            autoFocus
          />

          <div className="flex flex-wrap gap-1.5">
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setText(example)}
                className="rounded-full border border-edge px-2.5 py-1 text-[10px] text-ink-muted transition hover:border-accent-600/50 hover:text-ink"
              >
                {example}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={parseCommand.isPending || text.trim().length < 3}
            className="ls-btn-block flex items-center justify-center gap-2"
          >
            {parseCommand.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {parseCommand.isPending ? "Interpretando..." : "Interpretar"}
          </button>
        </form>

        {hasDrafts && (
          <div className="space-y-3 border-t border-edge pt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-ink-muted">
                Confira antes de salvar ({selected.size} de {drafts.length})
              </p>
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-1 text-[11px] text-ink-faint transition hover:text-ink"
              >
                <X className="h-3 w-3" />
                Descartar
              </button>
            </div>

            <div className="space-y-2">
              {drafts.map((draft, index) => (
                <DraftRow
                  key={`${draft.title}-${draft.date}-${index}`}
                  draft={draft}
                  isSelected={selected.has(index)}
                  onToggle={() => toggle(index)}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={createTransaction.isPending || selected.size === 0}
              className="ls-btn-block flex items-center justify-center gap-2"
            >
              {createTransaction.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {createTransaction.isPending
                ? "Salvando..."
                : `Confirmar ${selected.size} lançamento${selected.size !== 1 ? "s" : ""}`}
            </button>
          </div>
        )}
      </div>
    </AppModalShell>
  );
}
