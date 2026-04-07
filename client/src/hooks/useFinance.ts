import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getFinancialSummary,
  createTransaction,
  deleteTransaction,
  FinanceApiError,
  type CreateTransactionInput,
} from "../api/finance";

export const FINANCE_KEY = ["finance-summary"] as const;

export function useFinancialSummary() {
  return useQuery({
    queryKey: FINANCE_KEY,
    queryFn: getFinancialSummary,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTransactionInput) => createTransaction(input),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
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
      void queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
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
