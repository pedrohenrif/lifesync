import { ok, type Result } from "../result.js";
import type { IAiUsageRepository } from "../../domain/repositories/IAiUsageRepository.js";
import { startOfCurrentMonth } from "../services/AiRunner.js";

export type GetAiUsageSuccess = {
  readonly enabled: boolean;
  readonly model: string;
  readonly monthlyBudgetUsd: number;
  readonly spentUsd: number;
  readonly remainingUsd: number;
  readonly requests: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
};

export class GetAiUsageUseCase {
  constructor(
    private readonly usageRepository: IAiUsageRepository,
    private readonly monthlyBudgetUsd: number,
    private readonly model: string,
    private readonly isEnabled: boolean,
  ) {}

  async execute(userId: string): Promise<Result<GetAiUsageSuccess, never>> {
    const totals = await this.usageRepository.sumSince(userId, startOfCurrentMonth(new Date()));

    return ok({
      enabled: this.isEnabled,
      model: this.model,
      monthlyBudgetUsd: this.monthlyBudgetUsd,
      spentUsd: Math.round(totals.estimatedCostUsd * 1_000_000) / 1_000_000,
      remainingUsd: Math.max(0, this.monthlyBudgetUsd - totals.estimatedCostUsd),
      requests: totals.requests,
      inputTokens: totals.inputTokens,
      outputTokens: totals.outputTokens,
    });
  }
}
