import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { registerUser, RegisterApiError } from "../api/auth";

export type RegisterVariables = {
  readonly name: string;
  readonly email: string;
  readonly password: string;
};

export function useRegister() {
  return useMutation({
    mutationFn: ({ name, email, password }: RegisterVariables) =>
      registerUser(name, email, password),
    onSuccess: () => {
      toast.success("Cadastro realizado! Aguarde a aprovação do administrador para entrar.");
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
