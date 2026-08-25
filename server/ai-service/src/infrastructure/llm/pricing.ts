type ModelPricing = {
  /** Dólares por 1 milhão de tokens. */
  readonly inputPerMillion: number;
  readonly outputPerMillion: number;
};

// Tabela usada só para estimar custo no painel de consumo; a cobrança real é da OpenAI.
const PRICING: Record<string, ModelPricing> = {
  "gpt-5-nano": { inputPerMillion: 0.05, outputPerMillion: 0.4 },
  "gpt-5-mini": { inputPerMillion: 0.25, outputPerMillion: 2.0 },
  "gpt-5": { inputPerMillion: 1.25, outputPerMillion: 10.0 },
  "gpt-4.1-nano": { inputPerMillion: 0.1, outputPerMillion: 0.4 },
  "gpt-4.1-mini": { inputPerMillion: 0.4, outputPerMillion: 1.6 },
  "gpt-4o-mini": { inputPerMillion: 0.15, outputPerMillion: 0.6 },
};

const FALLBACK_PRICING: ModelPricing = PRICING["gpt-5-mini"] as ModelPricing;

function pricingFor(model: string): ModelPricing {
  const exact = PRICING[model];
  if (exact !== undefined) return exact;

  // Modelos versionados chegam como "gpt-5-mini-2026-01-01"; casamos pelo prefixo mais longo.
  const prefix = Object.keys(PRICING)
    .filter((key) => model.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];

  return prefix !== undefined ? (PRICING[prefix] as ModelPricing) : FALLBACK_PRICING;
}

export function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = pricingFor(model);
  const cost =
    (inputTokens / 1_000_000) * pricing.inputPerMillion +
    (outputTokens / 1_000_000) * pricing.outputPerMillion;
  return Math.round(cost * 1_000_000) / 1_000_000;
}
