import { apiRequest } from "./client";

export type TransactionType = "INCOME" | "EXPENSE";
export type PaymentMethod = "DEBIT" | "CREDIT";

export type Installment = {
  readonly current: number;
  readonly total: number;
};

export type Transaction = {
  readonly id: string;
  readonly title: string;
  readonly amount: number;
  readonly type: TransactionType;
  readonly category: string;
  readonly paymentMethod: PaymentMethod;
  readonly isFixed: boolean;
  readonly installment: Installment | null;
  readonly date: string;
  readonly createdAt: string;
};

export type FinancialSummary = {
  readonly totalIncome: number;
  readonly totalExpense: number;
  readonly balance: number;
  readonly transactions: readonly Transaction[];
};

export type ExpenseGroupId = "FIXED" | "LEISURE" | "PERSONAL" | "OTHER";

export type ExpenseGroupBreakdown = {
  readonly id: ExpenseGroupId;
  readonly label: string;
  readonly amount: number;
  readonly percentOfExpense: number;
};

export type FinanceAnalytics = {
  readonly year: number;
  readonly month: number;
  readonly totalIncome: number;
  readonly totalExpense: number;
  readonly expenseByGroup: readonly ExpenseGroupBreakdown[];
  readonly topExpenseGroups: readonly ExpenseGroupBreakdown[];
};

export type CreateTransactionInput = {
  readonly title: string;
  readonly amount: number;
  readonly type: TransactionType;
  readonly category: string;
  readonly date: string;
  readonly paymentMethod: PaymentMethod;
  readonly isFixed: boolean;
  readonly installments?: number;
};

export type UpdateTransactionInput = {
  readonly title: string;
  readonly amount: number;
  readonly type: TransactionType;
  readonly category: string;
  readonly date: string;
  readonly paymentMethod: PaymentMethod;
  readonly isFixed: boolean;
};

const FINANCE_ERROR_MESSAGES: Record<string, string> = {
  TRANSACTION_NOT_FOUND: "Transação não encontrada.",
  INVESTMENT_NOT_FOUND: "Investimento não encontrado.",
  FORBIDDEN: "Você não pode alterar este registro.",
  INVALID_DATE: "Data inválida.",
  INVALID_INSTALLMENTS: "Número de parcelas inválido.",
  TITLE_REQUIRED: "Informe um título.",
  INVALID_AMOUNT: "Informe um valor válido.",
  CATEGORY_REQUIRED: "Informe uma categoria.",
  INVALID_TYPE: "Tipo de transação inválido.",
  INVALID_PAYMENT_METHOD: "Forma de pagamento inválida.",
  NAME_REQUIRED: "Informe um nome.",
  INVALID_BALANCE: "Saldo inválido.",
  VALIDATION_ERROR: "Revise os campos e tente novamente.",
  REQUEST_FAILED: "Não foi possível concluir esta ação.",
};

export class FinanceApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "FinanceApiError";
  }
}

export async function financeRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await apiRequest(path, options);
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const error = data.error as { code?: string } | undefined;
    const code = error?.code ?? "REQUEST_FAILED";
    throw new FinanceApiError(FINANCE_ERROR_MESSAGES[code] ?? FINANCE_ERROR_MESSAGES.REQUEST_FAILED, code);
  }
  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}

export async function getFinanceAnalytics(year: number, month: number): Promise<FinanceAnalytics> {
  const params = new URLSearchParams({ year: String(year), month: String(month) });
  return financeRequest<FinanceAnalytics>(`/finance/analytics?${params.toString()}`);
}

export async function getFinancialSummary(year?: number, month?: number): Promise<FinancialSummary> {
  const params = new URLSearchParams();
  if (year !== undefined) params.set("year", String(year));
  if (month !== undefined) params.set("month", String(month));
  const qs = params.toString();
  return financeRequest<FinancialSummary>(`/transactions/summary${qs.length > 0 ? `?${qs}` : ""}`);
}

export async function createTransaction(
  input: CreateTransactionInput,
): Promise<{ count: number; firstId: string }> {
  return financeRequest<{ count: number; firstId: string }>("/transactions", {
    method: "POST",
    body: input,
  });
}

export async function deleteTransaction(id: string): Promise<null> {
  return financeRequest<null>(`/transactions/${id}`, { method: "DELETE" });
}

export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput,
): Promise<{ id: string }> {
  return financeRequest<{ id: string }>(`/transactions/${id}`, {
    method: "PATCH",
    body: input,
  });
}
