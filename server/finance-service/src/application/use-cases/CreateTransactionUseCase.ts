import { randomUUID } from "node:crypto";
import { err, ok, type Result } from "../result.js";
import type { CreateTransactionDto } from "../dtos/CreateTransactionDto.js";
import { Transaction } from "../../domain/entities/Transaction.js";
import type { TransactionValidationError, PaymentMethod, TransactionType } from "../../domain/entities/Transaction.js";
import type { ITransactionRepository } from "../../domain/repositories/ITransactionRepository.js";

export type CreateTransactionSuccess = {
  readonly count: number;
  readonly firstId: string;
};

export type CreateTransactionError =
  | TransactionValidationError
  | { readonly code: "INVALID_DATE" }
  | { readonly code: "INVALID_INSTALLMENTS" };

const FIXED_PROJECTION_MONTHS = 12;

function addMonths(base: Date, months: number): Date {
  const result = new Date(base);
  const day = result.getDate();
  result.setMonth(result.getMonth() + months);
  if (result.getDate() !== day) {
    result.setDate(0);
  }
  return result;
}

export class CreateTransactionUseCase {
  constructor(private readonly transactions: ITransactionRepository) {}

  async execute(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<Result<CreateTransactionSuccess, CreateTransactionError>> {
    const parsedDate = new Date(dto.date);
    if (Number.isNaN(parsedDate.getTime())) {
      return err({ code: "INVALID_DATE" });
    }

    const totalInstallments = dto.installments ?? 1;
    if (
      dto.paymentMethod === "CREDIT" &&
      totalInstallments > 1 &&
      (!Number.isInteger(totalInstallments) || totalInstallments < 2 || totalInstallments > 48)
    ) {
      return err({ code: "INVALID_INSTALLMENTS" });
    }

    // Cartão de crédito com parcelas
    if (dto.paymentMethod === "CREDIT" && totalInstallments > 1) {
      return this.createInstallments(userId, dto, parsedDate, totalInstallments);
    }

    // Receita/Despesa fixa (recorrente) → projeção de 12 meses
    if (dto.isFixed) {
      return this.createFixedProjection(userId, dto, parsedDate);
    }

    // Transação avulsa simples
    return this.createSingle(userId, dto, parsedDate);
  }

  private async createSingle(
    userId: string,
    dto: CreateTransactionDto,
    date: Date,
  ): Promise<Result<CreateTransactionSuccess, CreateTransactionError>> {
    const id = randomUUID();
    const result = Transaction.create({
      id,
      userId,
      title: dto.title,
      amount: dto.amount,
      type: dto.type as TransactionType,
      category: dto.category,
      paymentMethod: dto.paymentMethod as PaymentMethod,
      isFixed: false,
      installment: null,
      date,
      createdAt: new Date(),
    });

    if (!result.ok) return err(result.error);
    await this.transactions.save(result.transaction);
    return ok({ count: 1, firstId: id });
  }

  private async createInstallments(
    userId: string,
    dto: CreateTransactionDto,
    startDate: Date,
    total: number,
  ): Promise<Result<CreateTransactionSuccess, CreateTransactionError>> {
    const perInstallment = Math.round((dto.amount / total) * 100) / 100;
    const now = new Date();
    const batch: Transaction[] = [];
    let firstId = "";

    for (let i = 0; i < total; i++) {
      const id = randomUUID();
      if (i === 0) firstId = id;

      const installmentDate = addMonths(startDate, i);
      const result = Transaction.create({
        id,
        userId,
        title: `${dto.title} (${i + 1}/${total})`,
        amount: perInstallment,
        type: dto.type as TransactionType,
        category: dto.category,
        paymentMethod: "CREDIT",
        isFixed: false,
        installment: { current: i + 1, total },
        date: installmentDate,
        createdAt: now,
      });

      if (!result.ok) return err(result.error);
      batch.push(result.transaction);
    }

    await this.transactions.saveMany(batch);
    return ok({ count: total, firstId });
  }

  private async createFixedProjection(
    userId: string,
    dto: CreateTransactionDto,
    startDate: Date,
  ): Promise<Result<CreateTransactionSuccess, CreateTransactionError>> {
    const now = new Date();
    const batch: Transaction[] = [];
    let firstId = "";

    for (let i = 0; i < FIXED_PROJECTION_MONTHS; i++) {
      const id = randomUUID();
      if (i === 0) firstId = id;

      const projectedDate = addMonths(startDate, i);
      const result = Transaction.create({
        id,
        userId,
        title: dto.title,
        amount: dto.amount,
        type: dto.type as TransactionType,
        category: dto.category,
        paymentMethod: dto.paymentMethod as PaymentMethod,
        isFixed: true,
        installment: null,
        date: projectedDate,
        createdAt: now,
      });

      if (!result.ok) return err(result.error);
      batch.push(result.transaction);
    }

    await this.transactions.saveMany(batch);
    return ok({ count: FIXED_PROJECTION_MONTHS, firstId });
  }
}
