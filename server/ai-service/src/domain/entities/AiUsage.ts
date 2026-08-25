/** Funcionalidade que originou a chamada — permite saber onde o token foi gasto. */
export const AI_FEATURES = ["FINANCE_PARSE", "VAULT_SUGGEST"] as const;
export type AiFeature = (typeof AI_FEATURES)[number];

export interface AiUsageProps {
  readonly id: string;
  readonly userId: string;
  readonly feature: AiFeature;
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly estimatedCostUsd: number;
  readonly createdAt: Date;
}

export class AiUsage {
  private constructor(private readonly props: AiUsageProps) {}

  static create(props: AiUsageProps): AiUsage {
    return new AiUsage(props);
  }

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get feature(): AiFeature { return this.props.feature; }
  get model(): string { return this.props.model; }
  get inputTokens(): number { return this.props.inputTokens; }
  get outputTokens(): number { return this.props.outputTokens; }
  get estimatedCostUsd(): number { return this.props.estimatedCostUsd; }
  get createdAt(): Date { return this.props.createdAt; }
}
