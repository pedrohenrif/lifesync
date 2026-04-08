import { err, ok, type Result } from "../result.js";
import type { ITransactionRepository } from "../../domain/repositories/ITransactionRepository.js";

/** Agrupamento inteligente para análise visual (alinhado às categorias do app). */
export type ExpenseGroupId = "FIXED" | "LEISURE" | "PERSONAL" | "OTHER";

export type ExpenseGroupBreakdown = {
  readonly id: ExpenseGroupId;
  readonly label: string;
  readonly amount: number;
  readonly percentOfExpense: number;
};

export type FinanceAnalytics = {
  readonly year: number;
  readonly month: number;
  readonly totalIncome: number;
  readonly totalExpense: number;
  readonly expenseByGroup: readonly ExpenseGroupBreakdown[];
  readonly topExpenseGroups: readonly ExpenseGroupBreakdown[];
};

export type GetFinanceAnalyticsError = { readonly code: "INVALID_PERIOD" };

const GROUP_ORDER: readonly ExpenseGroupId[] = ["FIXED", "LEISURE", "PERSONAL", "OTHER"];

const GROUP_LABELS: Record<ExpenseGroupId, string> = {
  FIXED: "Despesas fixas",
  LEISURE: "Saídas / lazer",
  PERSONAL: "Pessoal",
  OTHER: "Outros",
};

const LEISURE_CATEGORIES = new Set(["Lazer", "Alimentação"]);
const PERSONAL_CATEGORIES = new Set(["Saúde", "Educação", "Transporte", "Moradia"]);

function resolveExpenseGroup(category: string, isFixed: boolean): ExpenseGroupId {
  if (isFixed) return "FIXED";
  if (LEISURE_CATEGORIES.has(category)) return "LEISURE";
  if (PERSONAL_CATEGORIES.has(category)) return "PERSONAL";
  return "OTHER";
}

export class GetFinanceAnalyticsUseCase {
  constructor(private readonly transactions: ITransactionRepository) {}

  async execute(
    userId: string,
    year: number,
    month: number,
  ): Promise<Result<FinanceAnalytics, GetFinanceAnalyticsError>> {
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      return err({ code: "INVALID_PERIOD" });
    }

    const txs = await this.transactions.findByUserIdAndMonth(userId, year, month);

    let totalIncome = 0;
    let totalExpense = 0;
    const bucketTotals: Record<ExpenseGroupId, number> = {
      FIXED: 0,
      LEISURE: 0,
      PERSONAL: 0,
      OTHER: 0,
    };

    for (const tx of txs) {
      if (tx.type === "INCOME") {
        totalIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
        const g = resolveExpenseGroup(tx.category, tx.isFixed);
        bucketTotals[g] += tx.amount;
      }
    }

    totalIncome = Math.round(totalIncome * 100) / 100;
    totalExpense = Math.round(totalExpense * 100) / 100;

    const expenseByGroup: ExpenseGroupBreakdown[] = GROUP_ORDER.map((id) => {
      const amount = Math.round(bucketTotals[id] * 100) / 100;
      const percentOfExpense =
        totalExpense > 0 ? Math.round((amount / totalExpense) * 10000) / 100 : 0;
      return {
        id,
        label: GROUP_LABELS[id],
        amount,
        percentOfExpense,
      };
    });

    const topExpenseGroups = [...expenseByGroup]
      .filter((g) => g.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    return ok({
      year,
      month,
      totalIncome,
      totalExpense,
      expenseByGroup,
      topExpenseGroups,
    });
  }
}
