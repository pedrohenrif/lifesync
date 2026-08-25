import { ok, type Result } from "../result.js";
import type {
  ITransactionRepository,
  TransactionPeriod,
} from "../../domain/repositories/ITransactionRepository.js";
import type { Transaction } from "../../domain/entities/Transaction.js";
import {
  mapPaginated,
  type Paginated,
  type PaginationParams,
} from "../../domain/pagination.js";

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export type TransactionSummaryItem = {
  readonly id: string;
  readonly title: string;
  readonly amount: number;
  readonly type: string;
  readonly category: string;
  readonly paymentMethod: string;
  readonly isFixed: boolean;
  readonly installment: { current: number; total: number } | null;
  readonly date: string;
  readonly createdAt: string;
};

export type FinancialSummary = {
  readonly totalIncome: number;
  readonly totalExpense: number;
  readonly balance: number;
  readonly transactions: Paginated<TransactionSummaryItem>;
};

function toSummaryItem(tx: Transaction): TransactionSummaryItem {
  return {
    id: tx.id,
    title: tx.title,
    amount: tx.amount,
    type: tx.type,
    category: tx.category,
    paymentMethod: tx.paymentMethod,
    isFixed: tx.isFixed,
    installment: tx.installment,
    date: toLocalDateKey(tx.date),
    createdAt: tx.createdAt.toISOString(),
  };
}

export class GetFinancialSummaryUseCase {
  constructor(private readonly transactions: ITransactionRepository) {}

  async execute(
    userId: string,
    pagination: PaginationParams,
    year?: number,
    month?: number,
  ): Promise<Result<FinancialSummary, never>> {
    const period: TransactionPeriod | undefined =
      year !== undefined && month !== undefined ? { year, month } : undefined;

    // Os totais vêm de agregação no banco para não dependerem da página carregada.
    const [page, totals] = await Promise.all([
      this.transactions.findPageByUserId(userId, pagination, period),
      this.transactions.sumTotalsByUserId(userId, period),
    ]);

    return ok({
      totalIncome: round(totals.totalIncome),
      totalExpense: round(totals.totalExpense),
      balance: round(totals.totalIncome - totals.totalExpense),
      transactions: mapPaginated(page, toSummaryItem),
    });
  }
}
