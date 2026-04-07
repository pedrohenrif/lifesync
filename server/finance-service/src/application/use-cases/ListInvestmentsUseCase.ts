import { ok, type Result } from "../result.js";
import type { IInvestmentRepository } from "../../domain/repositories/IInvestmentRepository.js";

export type InvestmentSummary = {
  readonly id: string;
  readonly name: string;
  readonly investedAmount: number;
  readonly currentBalance: number;
  readonly profitAmount: number;
  readonly profitPercent: number;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type ListInvestmentsSuccess = {
  readonly investments: readonly InvestmentSummary[];
  readonly totalInvested: number;
  readonly totalBalance: number;
};

export class ListInvestmentsUseCase {
  constructor(private readonly investments: IInvestmentRepository) {}

  async execute(userId: string): Promise<Result<ListInvestmentsSuccess, never>> {
    const all = await this.investments.findAllByUserId(userId);

    let totalInvested = 0;
    let totalBalance = 0;

    const investments: InvestmentSummary[] = all.map((inv) => {
      totalInvested += inv.investedAmount;
      totalBalance += inv.currentBalance;
      return {
        id: inv.id,
        name: inv.name,
        investedAmount: inv.investedAmount,
        currentBalance: inv.currentBalance,
        profitAmount: inv.profitAmount,
        profitPercent: inv.profitPercent,
        createdAt: inv.createdAt.toISOString(),
        updatedAt: inv.updatedAt.toISOString(),
      };
    });

    return ok({
      investments,
      totalInvested: Math.round(totalInvested * 100) / 100,
      totalBalance: Math.round(totalBalance * 100) / 100,
    });
  }
}
