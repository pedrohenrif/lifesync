export type TransactionType = "INCOME" | "EXPENSE";
export type PaymentMethod = "DEBIT" | "CREDIT";

export type Installment = {
  readonly current: number;
  readonly total: number;
};

export interface TransactionProps {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly amount: number;
  readonly type: TransactionType;
  readonly category: string;
  readonly paymentMethod: PaymentMethod;
  readonly isFixed: boolean;
  readonly installment: Installment | null;
  readonly date: Date;
  readonly createdAt: Date;
}

export type TransactionValidationError =
  | { readonly code: "TITLE_REQUIRED" }
  | { readonly code: "USER_ID_REQUIRED" }
  | { readonly code: "INVALID_AMOUNT" }
  | { readonly code: "CATEGORY_REQUIRED" }
  | { readonly code: "INVALID_TYPE" }
  | { readonly code: "INVALID_PAYMENT_METHOD" }
  | { readonly code: "INVALID_INSTALLMENT" };

export type CreateTransactionResult =
  | { readonly ok: true; readonly transaction: Transaction }
  | { readonly ok: false; readonly error: TransactionValidationError };

const VALID_TYPES: readonly string[] = ["INCOME", "EXPENSE"];
const VALID_METHODS: readonly string[] = ["DEBIT", "CREDIT"];

export class Transaction {
  private constructor(private readonly props: TransactionProps) {}

  static create(props: TransactionProps): CreateTransactionResult {
    if (props.userId.trim().length === 0) {
      return { ok: false, error: { code: "USER_ID_REQUIRED" } };
    }
    if (props.title.trim().length === 0) {
      return { ok: false, error: { code: "TITLE_REQUIRED" } };
    }
    if (props.amount <= 0 || !Number.isFinite(props.amount)) {
      return { ok: false, error: { code: "INVALID_AMOUNT" } };
    }
    if (props.category.trim().length === 0) {
      return { ok: false, error: { code: "CATEGORY_REQUIRED" } };
    }
    if (!VALID_TYPES.includes(props.type)) {
      return { ok: false, error: { code: "INVALID_TYPE" } };
    }
    if (!VALID_METHODS.includes(props.paymentMethod)) {
      return { ok: false, error: { code: "INVALID_PAYMENT_METHOD" } };
    }
    if (props.installment !== null) {
      const { current, total } = props.installment;
      if (
        !Number.isInteger(current) ||
        !Number.isInteger(total) ||
        current < 1 ||
        total < 1 ||
        current > total
      ) {
        return { ok: false, error: { code: "INVALID_INSTALLMENT" } };
      }
    }

    return {
      ok: true,
      transaction: new Transaction({
        ...props,
        title: props.title.trim(),
        category: props.category.trim(),
      }),
    };
  }

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get title(): string { return this.props.title; }
  get amount(): number { return this.props.amount; }
  get type(): TransactionType { return this.props.type; }
  get category(): string { return this.props.category; }
  get paymentMethod(): PaymentMethod { return this.props.paymentMethod; }
  get isFixed(): boolean { return this.props.isFixed; }
  get installment(): Installment | null { return this.props.installment; }
  get date(): Date { return this.props.date; }
  get createdAt(): Date { return this.props.createdAt; }
}
