import { randomUUID } from "node:crypto";
import { err, ok, type Result } from "../result.js";
import type {
  ILanguageModel,
  LanguageModelError,
  LanguageModelUsage,
  StructuredPrompt,
} from "../ports/ILanguageModel.js";
import { AiUsage, type AiFeature } from "../../domain/entities/AiUsage.js";
import type { IAiUsageRepository } from "../../domain/repositories/IAiUsageRepository.js";

export type AiRunError =
  | LanguageModelError
  | {
      readonly code: "AI_BUDGET_EXCEEDED";
      readonly spentUsd: number;
      readonly budgetUsd: number;
    };

export type AiRunSuccess<TValue> = {
  readonly value: TValue;
  readonly usage: LanguageModelUsage;
};

type RunParams<TValue> = {
  readonly userId: string;
  readonly feature: AiFeature;
  readonly prompt: StructuredPrompt;
  /** Retorna null quando o JSON do modelo não bate com o formato esperado. */
  readonly parse: (content: unknown) => TValue | null;
};

export function startOfCurrentMonth(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/**
 * Encapsula o ciclo comum de toda chamada de IA: verifica o teto de gasto do mês,
 * executa o modelo e registra o consumo. Os use cases só cuidam do prompt e do formato.
 */
export class AiRunner {
  constructor(
    private readonly languageModel: ILanguageModel,
    private readonly usageRepository: IAiUsageRepository,
    private readonly monthlyBudgetUsd: number,
  ) {}

  async run<TValue>(params: RunParams<TValue>): Promise<Result<AiRunSuccess<TValue>, AiRunError>> {
    if (!this.languageModel.isEnabled()) {
      return err({ code: "AI_DISABLED" });
    }

    const spent = await this.usageRepository.sumSince(
      params.userId,
      startOfCurrentMonth(new Date()),
    );
    if (spent.estimatedCostUsd >= this.monthlyBudgetUsd) {
      return err({
        code: "AI_BUDGET_EXCEEDED",
        spentUsd: spent.estimatedCostUsd,
        budgetUsd: this.monthlyBudgetUsd,
      });
    }

    const completion = await this.languageModel.generateStructured(params.prompt);
    if (!completion.ok) return err(completion.error);

    const { content, usage } = completion.value;
    await this.recordUsage(params.userId, params.feature, usage);

    const parsed = params.parse(content);
    if (parsed === null) {
      return err({ code: "AI_INVALID_OUTPUT" });
    }

    return ok({ value: parsed, usage });
  }

  /** O consumo é registrado mesmo se a resposta vier fora do formato — o token já foi gasto. */
  private async recordUsage(
    userId: string,
    feature: AiFeature,
    usage: LanguageModelUsage,
  ): Promise<void> {
    await this.usageRepository.save(
      AiUsage.create({
        id: randomUUID(),
        userId,
        feature,
        model: usage.model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        estimatedCostUsd: usage.estimatedCostUsd,
        createdAt: new Date(),
      }),
    );
  }
}
