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
  const res = await apiRequest(path, { ...options, service: "finance" });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const error = data.error as { code?: string } | undefined;
    throw new FinanceApiError(
      error?.code ?? "REQUEST_FAILED",
      error?.code ?? "REQUEST_FAILED",
    );
  }
  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}

export async function getFinancialSummary(): Promise<FinancialSummary> {
  return financeRequest<FinancialSummary>("/transactions/summary");
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
