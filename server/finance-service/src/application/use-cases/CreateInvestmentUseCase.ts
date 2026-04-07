import { randomUUID } from "node:crypto";
import { err, ok, type Result } from "../result.js";
import type { CreateInvestmentDto } from "../dtos/CreateInvestmentDto.js";
import { Investment } from "../../domain/entities/Investment.js";
import type { InvestmentValidationError } from "../../domain/entities/Investment.js";
import type { IInvestmentRepository } from "../../domain/repositories/IInvestmentRepository.js";

export type CreateInvestmentSuccess = {
  readonly id: string;
  readonly name: string;
  readonly investedAmount: number;
  readonly currentBalance: number;
  readonly createdAt: string;
};

export class CreateInvestmentUseCase {
  constructor(private readonly investments: IInvestmentRepository) {}

  async execute(
    userId: string,
    dto: CreateInvestmentDto,
  ): Promise<Result<CreateInvestmentSuccess, InvestmentValidationError>> {
    const now = new Date();
    const result = Investment.create({
      id: randomUUID(),
      userId,
      name: dto.name,
      investedAmount: dto.investedAmount,
      currentBalance: dto.investedAmount,
      createdAt: now,
      updatedAt: now,
    });

    if (!result.ok) return err(result.error);

    const inv = result.investment;
    await this.investments.save(inv);

    return ok({
      id: inv.id,
      name: inv.name,
      investedAmount: inv.investedAmount,
      currentBalance: inv.currentBalance,
      createdAt: inv.createdAt.toISOString(),
    });
  }
}
