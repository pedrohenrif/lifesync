import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getFinancialSummary,
  getFinanceAnalytics,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  FinanceApiError,
  type CreateTransactionInput,
  type UpdateTransactionInput,
  type Transaction,
  type FinancialSummaryPage,
} from "../api/finance";
import { useInfiniteList } from "./useInfiniteList";

export function financeKey(year?: number, month?: number) {
  return ["finance-summary", year, month] as const;
}

export function useFinancialSummary(year?: number, month?: number, pageSize?: number) {
  const query = useInfiniteList<Transaction, FinancialSummaryPage>({
    queryKey: financeKey(year, month),
    fetchPage: (request) => getFinancialSummary(request, year, month),
    pageSize,
  });

  // Os totais são agregados no servidor, então qualquer página traz o valor do período.
  const totals = query.firstPage;

  return {
    ...query,
    transactions: query.items,
    totalIncome: totals?.totalIncome ?? 0,
    totalExpense: totals?.totalExpense ?? 0,
    balance: totals?.balance ?? 0,
  };
}

export function financeAnalyticsKey(year: number, month: number) {
  return ["finance-analytics", year, month] as const;
}

export function useFinanceAnalytics(year: number, month: number) {
  return useQuery({
    queryKey: financeAnalyticsKey(year, month),
    queryFn: () => getFinanceAnalytics(year, month),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTransactionInput) => createTransaction(input),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["finance-analytics"] });
      const msg =
        data.count > 1
          ? `${data.count} transações criadas com sucesso!`
          : "Transação criada com sucesso!";
      toast.success(msg);
    },
    onError: (error) => {
      const message =
        error instanceof FinanceApiError
          ? error.message
          : "Não foi possível criar a transação.";
      toast.error(message);
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTransactionInput }) =>
      updateTransaction(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["finance-analytics"] });
      toast.success("Transação atualizada.");
    },
    onError: (error) => {
      const message =
        error instanceof FinanceApiError
          ? error.message
          : "Não foi possível atualizar a transação.";
      toast.error(message);
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["finance-analytics"] });
      toast.success("Transação removida.");
    },
    onError: (error) => {
      const message =
        error instanceof FinanceApiError
          ? error.message
          : "Não foi possível remover a transação.";
      toast.error(message);
    },
  });
}
