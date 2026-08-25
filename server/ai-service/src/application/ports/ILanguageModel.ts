import type { Result } from "../result.js";

export type StructuredPrompt = {
  readonly system: string;
  readonly user: string;
  /** Nome do schema exigido pela API de saída estruturada. */
  readonly schemaName: string;
  readonly jsonSchema: Record<string, unknown>;
  readonly maxOutputTokens: number;
};

export type LanguageModelUsage = {
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly estimatedCostUsd: number;
};

export type StructuredCompletion = {
  /** JSON já parseado; a validação de formato fica no use case. */
  readonly content: unknown;
  readonly usage: LanguageModelUsage;
};

export type LanguageModelError =
  | { readonly code: "AI_DISABLED" }
  | { readonly code: "AI_RATE_LIMITED" }
  | { readonly code: "AI_TIMEOUT" }
  | { readonly code: "AI_UPSTREAM_ERROR"; readonly status: number }
  | { readonly code: "AI_INVALID_OUTPUT" };

export interface ILanguageModel {
  isEnabled(): boolean;
  generateStructured(
    prompt: StructuredPrompt,
  ): Promise<Result<StructuredCompletion, LanguageModelError>>;
}
