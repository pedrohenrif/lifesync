import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { registerUser, RegisterApiError } from "../api/auth";

export type RegisterVariables = {
  readonly email: string;
  readonly password: string;
};

export function useRegister() {
  return useMutation({
    mutationFn: ({ email, password }: RegisterVariables) =>
      registerUser(email, password),
    onSuccess: () => {
      toast.success("Conta criada com sucesso! Faça login.");
    },
    onError: (error) => {
      const message =
        error instanceof RegisterApiError
          ? error.message
          : "Algo deu errado. Tente novamente.";
      toast.error(message);
    },
  });
}
