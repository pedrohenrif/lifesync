import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  requestPasswordReset,
  resetPassword,
  PasswordResetApiError,
} from "../api/auth";

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
    onSuccess: () => {
      toast.success("Se a conta existir e estiver ativa, o código já foi enviado.");
    },
    onError: (error) => {
      const message =
        error instanceof PasswordResetApiError
          ? error.message
          : "Algo deu errado. Tente novamente.";
      toast.error(message);
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: {
      readonly email: string;
      readonly code: string;
      readonly password: string;
    }) => resetPassword(input),
    onSuccess: () => {
      toast.success("Senha redefinida. Entre com a nova senha.");
    },
    onError: (error) => {
      const message =
        error instanceof PasswordResetApiError
          ? error.message
          : "Algo deu errado. Tente novamente.";
      toast.error(message);
    },
  });
}
