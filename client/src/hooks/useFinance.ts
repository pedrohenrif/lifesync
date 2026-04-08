import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getFinancialSummary,
  getFinanceAnalytics,
  createTransaction,
  deleteTransaction,
  FinanceApiError,
  type CreateTransactionInput,
} from "../api/finance";

export function financeKey(year?: number, month?: number) {
  return ["finance-summary", year, month] as const;
}

export function useFinancialSummary(year?: number, month?: number) {
  return useQuery({
    queryKey: financeKey(year, month),
    queryFn: () => getFinancialSummary(year, month),
  });
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
