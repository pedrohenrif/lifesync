import type { AiUsage } from "../../domain/entities/AiUsage.js";
import type {
  IAiUsageRepository,
  UsageTotals,
} from "../../domain/repositories/IAiUsageRepository.js";
import { AiUsageModel } from "./mongoose/AiUsageSchema.js";

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export class MongoAiUsageRepository implements IAiUsageRepository {
  async save(usage: AiUsage): Promise<void> {
    await AiUsageModel.create({
      _id: usage.id,
      userId: usage.userId,
      feature: usage.feature,
      model: usage.model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      estimatedCostUsd: usage.estimatedCostUsd,
      createdAt: usage.createdAt,
    });
  }

  async sumSince(userId: string, since: Date): Promise<UsageTotals> {
    const rows = await AiUsageModel.aggregate<{
      requests: unknown;
      inputTokens: unknown;
      outputTokens: unknown;
      estimatedCostUsd: unknown;
    }>([
      { $match: { userId, createdAt: { $gte: since } } },
      {
        $group: {
          _id: null,
          requests: { $sum: 1 },
          inputTokens: { $sum: "$inputTokens" },
          outputTokens: { $sum: "$outputTokens" },
          estimatedCostUsd: { $sum: "$estimatedCostUsd" },
        },
      },
    ]).exec();

    const row = rows[0];
    return {
      requests: readNumber(row?.requests),
      inputTokens: readNumber(row?.inputTokens),
      outputTokens: readNumber(row?.outputTokens),
      estimatedCostUsd: readNumber(row?.estimatedCostUsd),
    };
  }
}
