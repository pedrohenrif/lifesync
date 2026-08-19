import { err, ok, type Result } from "../result.js";
import type { IInvestmentRepository } from "../../domain/repositories/IInvestmentRepository.js";

export type RenameInvestmentError =
  | { readonly code: "INVESTMENT_NOT_FOUND" }
  | { readonly code: "FORBIDDEN" }
  | { readonly code: "NAME_REQUIRED" };

export type RenameInvestmentSuccess = {
  readonly id: string;
  readonly name: string;
};

export class RenameInvestmentUseCase {
  constructor(private readonly investments: IInvestmentRepository) {}

  async execute(
    investmentId: string,
    userId: string,
    name: string,
  ): Promise<Result<RenameInvestmentSuccess, RenameInvestmentError>> {
    const inv = await this.investments.findById(investmentId);
    if (inv === null) return err({ code: "INVESTMENT_NOT_FOUND" });
    if (inv.userId !== userId) return err({ code: "FORBIDDEN" });

    const updated = inv.withName(name);
    if (!updated.ok) return err({ code: "NAME_REQUIRED" });

    await this.investments.update(updated.investment);
    return ok({ id: updated.investment.id, name: updated.investment.name });
  }
}
