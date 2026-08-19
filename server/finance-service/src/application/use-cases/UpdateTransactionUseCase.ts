import { err, ok, type Result } from "../result.js";
import type { UpdateTransactionDto } from "../dtos/UpdateTransactionDto.js";
import type {
  PaymentMethod,
  TransactionType,
  TransactionValidationError,
} from "../../domain/entities/Transaction.js";
import type { ITransactionRepository } from "../../domain/repositories/ITransactionRepository.js";

export type UpdateTransactionSuccess = {
  readonly id: string;
};

export type UpdateTransactionError =
  | TransactionValidationError
  | { readonly code: "TRANSACTION_NOT_FOUND" }
  | { readonly code: "FORBIDDEN" }
  | { readonly code: "INVALID_DATE" };

function parseLocalDate(isoDate: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate.trim());
  if (match === null) return null;
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export class UpdateTransactionUseCase {
  constructor(private readonly transactions: ITransactionRepository) {}

  async execute(
    transactionId: string,
    userId: string,
    dto: UpdateTransactionDto,
  ): Promise<Result<UpdateTransactionSuccess, UpdateTransactionError>> {
    const existing = await this.transactions.findById(transactionId);
    if (existing === null) return err({ code: "TRANSACTION_NOT_FOUND" });
    if (existing.userId !== userId) return err({ code: "FORBIDDEN" });

    const parsedDate = parseLocalDate(dto.date);
    if (parsedDate === null) return err({ code: "INVALID_DATE" });

    const updated = existing.withUpdatedDetails({
      title: dto.title,
      amount: dto.amount,
      type: dto.type as TransactionType,
      category: dto.category,
      paymentMethod: dto.paymentMethod as PaymentMethod,
      isFixed: dto.isFixed,
      date: parsedDate,
    });

    if (!updated.ok) return err(updated.error);

    await this.transactions.update(updated.transaction);
    return ok({ id: updated.transaction.id });
  }
}
