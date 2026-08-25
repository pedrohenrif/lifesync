import type { Transaction } from "../entities/Transaction.js";
import type { Paginated, PaginationParams } from "../pagination.js";

export type TransactionPeriod = {
  readonly year: number;
  readonly month: number;
};

export type TransactionTotals = {
  readonly totalIncome: number;
  readonly totalExpense: number;
};

export interface ITransactionRepository {
  save(transaction: Transaction): Promise<void>;
  saveMany(transactions: readonly Transaction[]): Promise<void>;
  findById(id: string): Promise<Transaction | null>;
  /** Página de transações; sem período informado, considera todo o histórico. */
  findPageByUserId(
    userId: string,
    pagination: PaginationParams,
    period?: TransactionPeriod,
  ): Promise<Paginated<Transaction>>;
  /** Totais agregados no banco — não dependem da página carregada. */
  sumTotalsByUserId(userId: string, period?: TransactionPeriod): Promise<TransactionTotals>;
  /** Mês completo, usado pelos cálculos analíticos (volume naturalmente limitado). */
  findByUserIdAndMonth(userId: string, year: number, month: number): Promise<Transaction[]>;
  update(transaction: Transaction): Promise<void>;
  delete(id: string): Promise<void>;
}
