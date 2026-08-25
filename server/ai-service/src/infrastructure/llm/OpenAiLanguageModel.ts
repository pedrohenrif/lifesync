import { err, ok, type Result } from "../../application/result.js";
import type {
  ILanguageModel,
  LanguageModelError,
  StructuredCompletion,
  StructuredPrompt,
} from "../../application/ports/ILanguageModel.js";
import type { ReasoningEffort } from "../config/env.js";
import { estimateCostUsd } from "./pricing.js";

export type OpenAiConfig = {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly model: string;
  readonly reasoningEffort: ReasoningEffort | null;
  readonly timeoutMs: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readTokenCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/** Extrai o texto da primeira escolha; qualquer desvio de formato vira AI_INVALID_OUTPUT. */
function readMessageContent(payload: unknown): string | null {
  if (!isRecord(payload) || !Array.isArray(payload.choices)) return null;
  const [choice] = payload.choices;
  if (!isRecord(choice) || !isRecord(choice.message)) return null;
  const content = choice.message.content;
  return typeof content === "string" && content.length > 0 ? content : null;
}

export class OpenAiLanguageModel implements ILanguageModel {
  constructor(private readonly config: OpenAiConfig) {}

  isEnabled(): boolean {
    return this.config.apiKey.trim().length > 0;
  }

  async generateStructured(
    prompt: StructuredPrompt,
  ): Promise<Result<StructuredCompletion, LanguageModelError>> {
    if (!this.isEnabled()) {
      return err({ code: "AI_DISABLED" });
    }

    const body: Record<string, unknown> = {
      model: this.config.model,
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      max_completion_tokens: prompt.maxOutputTokens,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: prompt.schemaName,
          strict: true,
          schema: prompt.jsonSchema,
        },
      },
    };

    if (this.config.reasoningEffort !== null) {
      body.reasoning_effort = this.config.reasoningEffort;
    }

    const response = await this.post(body);
    if (!response.ok) return err(response.error);

    const payload = response.value;
    const content = readMessageContent(payload);
    if (content === null) {
      return err({ code: "AI_INVALID_OUTPUT" });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return err({ code: "AI_INVALID_OUTPUT" });
    }

    const usageRaw = isRecord(payload) && isRecord(payload.usage) ? payload.usage : {};
    const inputTokens = readTokenCount(usageRaw.prompt_tokens);
    const outputTokens = readTokenCount(usageRaw.completion_tokens);
    const model =
      isRecord(payload) && typeof payload.model === "string"
        ? payload.model
        : this.config.model;

    return ok({
      content: parsed,
      usage: {
        model,
        inputTokens,
        outputTokens,
        estimatedCostUsd: estimateCostUsd(model, inputTokens, outputTokens),
      },
    });
  }

  private async post(body: unknown): Promise<Result<unknown, LanguageModelError>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (response.status === 429) {
        return err({ code: "AI_RATE_LIMITED" });
      }
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        console.error(`OpenAI error ${response.status}: ${detail}`);
        return err({ code: "AI_UPSTREAM_ERROR", status: response.status });
      }

      return ok(await response.json());
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return err({ code: "AI_TIMEOUT" });
      }
      console.error("OpenAI request failed", error);
      return err({ code: "AI_UPSTREAM_ERROR", status: 0 });
    } finally {
      clearTimeout(timeout);
    }
  }
}
