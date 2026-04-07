import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { loginUser, LoginApiError } from "../api/auth";

export type LoginVariables = {
  readonly email: string;
  readonly password: string;
};

export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: LoginVariables) =>
      loginUser(email, password),
    onSuccess: () => {
      toast.success("Login realizado com sucesso!");
    },
    onError: (error) => {
      const message =
        error instanceof LoginApiError
          ? error.message
          : "Algo deu errado. Tente novamente.";
      toast.error(message);
    },
  });
}
