import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getPendingUsers,
  reviewUser,
  type ReviewDecision,
  type PendingUser,
  type PendingUsersPage,
  AdminApiError,
} from "../api/admin";
import { useInfiniteList } from "./useInfiniteList";

export function usePendingUsers(pageSize?: number) {
  return useInfiniteList<PendingUser, PendingUsersPage>({
    queryKey: ["admin", "pending-users"],
    fetchPage: getPendingUsers,
    pageSize,
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
