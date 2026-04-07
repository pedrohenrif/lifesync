import { err, ok, type Result } from "../result.js";
import type { IInvestmentRepository } from "../../domain/repositories/IInvestmentRepository.js";

export type UpdateBalanceError =
  | { readonly code: "INVESTMENT_NOT_FOUND" }
  | { readonly code: "FORBIDDEN" }
  | { readonly code: "INVALID_BALANCE" };

export type UpdateBalanceSuccess = {
  readonly id: string;
  readonly currentBalance: number;
  readonly profitAmount: number;
  readonly profitPercent: number;
};

export class UpdateInvestmentBalanceUseCase {
  constructor(private readonly investments: IInvestmentRepository) {}

  async execute(
    investmentId: string,
    userId: string,
    newBalance: number,
  ): Promise<Result<UpdateBalanceSuccess, UpdateBalanceError>> {
    const inv = await this.investments.findById(investmentId);
    if (inv === null) return err({ code: "INVESTMENT_NOT_FOUND" });
    if (inv.userId !== userId) return err({ code: "FORBIDDEN" });

    const updated = inv.withUpdatedBalance(newBalance);
    if (!updated.ok) return err({ code: "INVALID_BALANCE" });

    await this.investments.update(updated.investment);

    return ok({
      id: updated.investment.id,
      currentBalance: updated.investment.currentBalance,
      profitAmount: updated.investment.profitAmount,
      profitPercent: updated.investment.profitPercent,
    });
  }
}
