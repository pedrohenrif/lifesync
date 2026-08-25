import { apiRequest } from "./client";
import type { PaymentMethod, TransactionType } from "./finance";
import type { NoteCategory, NoteStage } from "./vault";

export type TransactionDraft = {
  readonly title: string;
  readonly amount: number;
  readonly type: TransactionType;
  readonly category: string;
  /** YYYY-MM-DD */
  readonly date: string;
  readonly paymentMethod: PaymentMethod;
  readonly isFixed: boolean;
  readonly installments: number | null;
  /** Entre 0 e 1. Abaixo de 0.5 a UI destaca que a IA chutou. */
  readonly confidence: number;
};

export type AiUsage = {
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly estimatedCostUsd: number;
};

export type ParseFinanceResponse = {
  readonly drafts: readonly TransactionDraft[];
  readonly usage: AiUsage;
};

export type NoteSuggestion = {
  readonly summary: string;
  readonly tags: readonly string[];
  readonly category: NoteCategory;
  readonly stage: NoteStage;
  readonly nextQuestions: readonly string[];
};

export type SuggestNoteResponse = {
  readonly suggestion: NoteSuggestion;
  readonly usage: AiUsage;
};

export type AiUsageSummary = {
  readonly enabled: boolean;
  readonly model: string;
  readonly monthlyBudgetUsd: number;
  readonly spentUsd: number;
  readonly remainingUsd: number;
  readonly requests: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
};

/** Mensagens amigáveis para os códigos que o ai-service devolve. */
const ERROR_MESSAGES: Record<string, string> = {
  AI_DISABLED: "A IA não está configurada neste ambiente.",
  AI_BUDGET_EXCEEDED: "Você atingiu o limite de gasto com IA deste mês.",
  AI_RATE_LIMITED: "Muitas requisições seguidas. Tente de novo em instantes.",
  AI_TIMEOUT: "A IA demorou demais para responder. Tente de novo.",
  AI_UPSTREAM_ERROR: "A OpenAI está indisponível no momento.",
  AI_INVALID_OUTPUT: "A IA respondeu em um formato inesperado. Tente reescrever a frase.",
  NO_TRANSACTION_FOUND: "Não identifiquei nenhum lançamento nessa frase.",
  UNAUTHORIZED: "Sua sessão expirou. Entre novamente.",
};

export class AiApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(ERROR_MESSAGES[code] ?? "Não foi possível falar com a IA.");
    this.name = "AiApiError";
    this.status = status;
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractErrorCode(data: unknown): string {
  if (!isRecord(data)) return "UNKNOWN_ERROR";
  const error = data.error;
  if (!isRecord(error)) return "UNKNOWN_ERROR";
  return typeof error.code === "string" ? error.code : "UNKNOWN_ERROR";
}

async function aiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await apiRequest(path, options);
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new AiApiError(response.status, extractErrorCode(data));
  }

  return data as T;
}

export async function parseFinanceCommand(text: string): Promise<ParseFinanceResponse> {
  return aiRequest<ParseFinanceResponse>("/ai/finance/parse", {
    method: "POST",
    body: { text },
  });
}

export async function suggestNoteMetadata(input: {
  readonly title: string;
  readonly content: string;
  readonly existingTags?: readonly string[];
}): Promise<SuggestNoteResponse> {
  return aiRequest<SuggestNoteResponse>("/ai/vault/suggest", {
    method: "POST",
    body: input,
  });
}

export async function getAiUsage(): Promise<AiUsageSummary> {
  return aiRequest<AiUsageSummary>("/ai/usage");
}
