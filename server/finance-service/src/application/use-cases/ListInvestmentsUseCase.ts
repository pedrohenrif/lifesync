import { ok, type Result } from "../result.js";
import type { IInvestmentRepository } from "../../domain/repositories/IInvestmentRepository.js";
import type { Investment } from "../../domain/entities/Investment.js";
import {
  mapPaginated,
  type Paginated,
  type PaginationParams,
} from "../../domain/pagination.js";

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
  readonly investments: Paginated<InvestmentSummary>;
  readonly totalInvested: number;
  readonly totalBalance: number;
};

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function toSummary(inv: Investment): InvestmentSummary {
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
}

export class ListInvestmentsUseCase {
  constructor(private readonly investments: IInvestmentRepository) {}

  async execute(
    userId: string,
    pagination: PaginationParams,
  ): Promise<Result<ListInvestmentsSuccess, never>> {
    // Os totais vêm de agregação no banco para não dependerem da página carregada.
    const [page, totals] = await Promise.all([
      this.investments.findPageByUserId(userId, pagination),
      this.investments.sumTotalsByUserId(userId),
    ]);

    return ok({
      investments: mapPaginated(page, toSummary),
      totalInvested: round(totals.totalInvested),
      totalBalance: round(totals.totalBalance),
    });
  }
}
