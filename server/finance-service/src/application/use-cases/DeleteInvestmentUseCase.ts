import { err, ok, type Result } from "../result.js";
import type { IInvestmentRepository } from "../../domain/repositories/IInvestmentRepository.js";

export type DeleteInvestmentError =
  | { readonly code: "INVESTMENT_NOT_FOUND" }
  | { readonly code: "FORBIDDEN" };

export class DeleteInvestmentUseCase {
  constructor(private readonly investments: IInvestmentRepository) {}

  async execute(
    investmentId: string,
    userId: string,
  ): Promise<Result<null, DeleteInvestmentError>> {
    const inv = await this.investments.findById(investmentId);
    if (inv === null) return err({ code: "INVESTMENT_NOT_FOUND" });
    if (inv.userId !== userId) return err({ code: "FORBIDDEN" });

    await this.investments.delete(investmentId);
    return ok(null);
  }
}
