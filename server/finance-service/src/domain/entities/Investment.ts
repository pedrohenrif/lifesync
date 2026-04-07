export interface InvestmentProps {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly investedAmount: number;
  readonly currentBalance: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type InvestmentValidationError =
  | { readonly code: "USER_ID_REQUIRED" }
  | { readonly code: "NAME_REQUIRED" }
  | { readonly code: "INVALID_INVESTED_AMOUNT" }
  | { readonly code: "INVALID_BALANCE" };

export type CreateInvestmentResult =
  | { readonly ok: true; readonly investment: Investment }
  | { readonly ok: false; readonly error: InvestmentValidationError };

export class Investment {
  private constructor(private readonly props: InvestmentProps) {}

  static create(props: InvestmentProps): CreateInvestmentResult {
    if (props.userId.trim().length === 0) {
      return { ok: false, error: { code: "USER_ID_REQUIRED" } };
    }
    if (props.name.trim().length === 0) {
      return { ok: false, error: { code: "NAME_REQUIRED" } };
    }
    if (props.investedAmount < 0 || !Number.isFinite(props.investedAmount)) {
      return { ok: false, error: { code: "INVALID_INVESTED_AMOUNT" } };
    }
    if (!Number.isFinite(props.currentBalance)) {
      return { ok: false, error: { code: "INVALID_BALANCE" } };
    }

    return {
      ok: true,
      investment: new Investment({ ...props, name: props.name.trim() }),
    };
  }

  withUpdatedBalance(newBalance: number): CreateInvestmentResult {
    return Investment.create({ ...this.props, currentBalance: newBalance, updatedAt: new Date() });
  }

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get name(): string { return this.props.name; }
  get investedAmount(): number { return this.props.investedAmount; }
  get currentBalance(): number { return this.props.currentBalance; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  get profitAmount(): number {
    return Math.round((this.currentBalance - this.investedAmount) * 100) / 100;
  }

  get profitPercent(): number {
    if (this.investedAmount === 0) return 0;
    return Math.round(((this.currentBalance - this.investedAmount) / this.investedAmount) * 10000) / 100;
  }
}
