import type { Investment } from "../entities/Investment.js";
import type { Paginated, PaginationParams } from "../pagination.js";

export type InvestmentTotals = {
  readonly totalInvested: number;
  readonly totalBalance: number;
};

export interface IInvestmentRepository {
  save(investment: Investment): Promise<void>;
  findById(id: string): Promise<Investment | null>;
  findPageByUserId(
    userId: string,
    pagination: PaginationParams,
  ): Promise<Paginated<Investment>>;
  /** Totais agregados no banco — não dependem da página carregada. */
  sumTotalsByUserId(userId: string): Promise<InvestmentTotals>;
  update(investment: Investment): Promise<void>;
  delete(id: string): Promise<void>;
}
