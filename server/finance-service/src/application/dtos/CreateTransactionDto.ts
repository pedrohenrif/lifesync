export type CreateTransactionDto = {
  readonly title: string;
  readonly amount: number;
  readonly type: "INCOME" | "EXPENSE";
  readonly category: string;
  readonly date: string;
  readonly paymentMethod: "DEBIT" | "CREDIT";
  readonly isFixed: boolean;
  readonly installments?: number;
};
