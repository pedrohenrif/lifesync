import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getPendingUsers,
  reviewUser,
  type ReviewDecision,
  AdminApiError,
} from "../api/admin";

export function usePendingUsers() {
  return useQuery({
    queryKey: ["admin", "pending-users"],
    queryFn: getPendingUsers,
  });
}

export function useReviewUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: ReviewDecision }) =>
      reviewUser(userId, status),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "pending-users"] });
      const action = variables.status === "ACTIVE" ? "aprovado" : "rejeitado";
      toast.success(`Usuário ${action} com sucesso!`);
    },
    onError: (error) => {
      const message =
        error instanceof AdminApiError
          ? error.message
          : "Erro ao processar a decisão.";
      toast.error(message);
    },
  });
}
