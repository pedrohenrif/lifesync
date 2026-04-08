import { ok, type Result } from "../result.js";
import type { ITransactionRepository } from "../../domain/repositories/ITransactionRepository.js";

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
  readonly transactions: readonly TransactionSummaryItem[];
};

export class GetFinancialSummaryUseCase {
  constructor(private readonly transactions: ITransactionRepository) {}

  async execute(
    userId: string,
    year?: number,
    month?: number,
  ): Promise<Result<FinancialSummary, never>> {
    const all =
      year !== undefined && month !== undefined
        ? await this.transactions.findByUserIdAndMonth(userId, year, month)
        : await this.transactions.findAllByUserId(userId);

    let totalIncome = 0;
    let totalExpense = 0;

    const transactions: TransactionSummaryItem[] = all.map((tx) => {
      if (tx.type === "INCOME") {
        totalIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
      }

      return {
        id: tx.id,
        title: tx.title,
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        paymentMethod: tx.paymentMethod,
        isFixed: tx.isFixed,
        installment: tx.installment,
        date: tx.date.toISOString(),
        createdAt: tx.createdAt.toISOString(),
      };
    });

    return ok({
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      balance: Math.round((totalIncome - totalExpense) * 100) / 100,
      transactions,
    });
  }
}
