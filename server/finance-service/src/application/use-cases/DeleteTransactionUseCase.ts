import { err, ok, type Result } from "../result.js";
import type { ITransactionRepository } from "../../domain/repositories/ITransactionRepository.js";

export type DeleteTransactionError =
  | { readonly code: "TRANSACTION_NOT_FOUND" }
  | { readonly code: "FORBIDDEN" };

export class DeleteTransactionUseCase {
  constructor(private readonly transactions: ITransactionRepository) {}

  async execute(
    transactionId: string,
    userId: string,
  ): Promise<Result<null, DeleteTransactionError>> {
    const tx = await this.transactions.findById(transactionId);
    if (tx === null) return err({ code: "TRANSACTION_NOT_FOUND" });
    if (tx.userId !== userId) return err({ code: "FORBIDDEN" });

    await this.transactions.delete(transactionId);
    return ok(null);
  }
}
