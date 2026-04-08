import { err, ok, type Result } from "../result.js";
import type { IInvestmentRepository } from "../../domain/repositories/IInvestmentRepository.js";

export type AddContributionError =
  | { readonly code: "INVESTMENT_NOT_FOUND" }
  | { readonly code: "FORBIDDEN" }
  | { readonly code: "INVALID_AMOUNT" };

export type AddContributionSuccess = {
  readonly id: string;
  readonly investedAmount: number;
  readonly currentBalance: number;
  readonly profitAmount: number;
  readonly profitPercent: number;
};

export class AddInvestmentContributionUseCase {
  constructor(private readonly investments: IInvestmentRepository) {}

  async execute(
    investmentId: string,
    userId: string,
    amount: number,
  ): Promise<Result<AddContributionSuccess, AddContributionError>> {
    if (amount <= 0 || !Number.isFinite(amount)) {
      return err({ code: "INVALID_AMOUNT" });
    }

    const inv = await this.investments.findById(investmentId);
    if (inv === null) return err({ code: "INVESTMENT_NOT_FOUND" });
    if (inv.userId !== userId) return err({ code: "FORBIDDEN" });

    const updated = inv.withContribution(amount);
    if (!updated.ok) return err({ code: "INVALID_AMOUNT" });

    await this.investments.update(updated.investment);

    return ok({
      id: updated.investment.id,
      investedAmount: updated.investment.investedAmount,
      currentBalance: updated.investment.currentBalance,
      profitAmount: updated.investment.profitAmount,
      profitPercent: updated.investment.profitPercent,
    });
  }
}
