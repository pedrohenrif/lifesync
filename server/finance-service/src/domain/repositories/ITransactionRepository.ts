import type { Transaction } from "../entities/Transaction.js";

export interface ITransactionRepository {
  save(transaction: Transaction): Promise<void>;
  saveMany(transactions: readonly Transaction[]): Promise<void>;
  findById(id: string): Promise<Transaction | null>;
  findAllByUserId(userId: string): Promise<Transaction[]>;
  delete(id: string): Promise<void>;
}
