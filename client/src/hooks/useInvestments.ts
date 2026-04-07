import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getInvestments,
  createInvestment,
  updateInvestmentBalance,
  deleteInvestment,
  FinanceApiError,
  type CreateInvestmentInput,
} from "../api/investments";

const INVESTMENTS_KEY = ["investments"] as const;

export function useInvestments() {
  return useQuery({
    queryKey: INVESTMENTS_KEY,
    queryFn: getInvestments,
  });
}

export function useCreateInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInvestmentInput) => createInvestment(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INVESTMENTS_KEY });
      toast.success("Investimento adicionado!");
    },
    onError: (error) => {
      const message =
        error instanceof FinanceApiError
          ? error.message
          : "Não foi possível criar o investimento.";
      toast.error(message);
    },
  });
}

export function useUpdateInvestmentBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, currentBalance }: { id: string; currentBalance: number }) =>
      updateInvestmentBalance(id, currentBalance),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INVESTMENTS_KEY });
      toast.success("Saldo atualizado!");
    },
    onError: (error) => {
      const message =
        error instanceof FinanceApiError
          ? error.message
          : "Não foi possível atualizar o saldo.";
      toast.error(message);
    },
  });
}

export function useDeleteInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteInvestment(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INVESTMENTS_KEY });
      toast.success("Investimento removido.");
    },
    onError: (error) => {
      const message =
        error instanceof FinanceApiError
          ? error.message
          : "Não foi possível remover o investimento.";
      toast.error(message);
    },
  });
}
