export const TRANSACTION_TYPES = ["INCOME", "EXPENSE"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const PAYMENT_METHODS = ["DEBIT", "CREDIT"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Espelha as categorias oferecidas no formulário de finanças do app. */
export const TRANSACTION_CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Saúde",
  "Educação",
  "Lazer",
  "Salário",
  "Freelance",
  "Investimentos",
  "Outros",
] as const;
export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

/**
 * Rascunho de transação produzido pela IA. Nunca é persistido aqui: o usuário
 * confirma no app e o registro segue pelo fluxo normal do finance-service.
 */
export type TransactionDraft = {
  readonly title: string;
  readonly amount: number;
  readonly type: TransactionType;
  readonly category: TransactionCategory;
  /** Data no formato YYYY-MM-DD. */
  readonly date: string;
  readonly paymentMethod: PaymentMethod;
  readonly isFixed: boolean;
  readonly installments: number | null;
  /** Entre 0 e 1: quão certa a IA está da interpretação. */
  readonly confidence: number;
};
