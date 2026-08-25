import type { AiUsage } from "../entities/AiUsage.js";

export type UsageTotals = {
  readonly requests: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly estimatedCostUsd: number;
};

export interface IAiUsageRepository {
  save(usage: AiUsage): Promise<void>;
  /** Consumo do usuário a partir de uma data — base do teto mensal de gasto. */
  sumSince(userId: string, since: Date): Promise<UsageTotals>;
}
