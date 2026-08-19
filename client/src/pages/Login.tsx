import type { FormEvent, ReactElement } from "react";
import { useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoginApiError } from "../api/auth";
import { useLogin } from "../hooks/useLogin";
import { useAuthStore } from "../stores/authStore";

export function Login(): ReactElement {
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const { mutate, isPending, isError, error, reset } = useLogin();
  const setSession = useAuthStore((s) => s.setSession);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    reset();
    mutate(
      { email, password },
      {
        onSuccess: (response) => {
          setSession({ token: response.token, user: response.user });
          navigate(
            response.user.hasCompletedOnboarding ? "/dashboard" : "/onboarding",
            { replace: true },
          );
        },
      },
    );
  };

  const isPendingAccount =
    isError && error instanceof LoginApiError && error.code === "ACCOUNT_PENDING";

  const isRejectedAccount =
    isError && error instanceof LoginApiError && error.code === "ACCOUNT_REJECTED";

  const errorMessage =
    isPendingAccount || isRejectedAccount
      ? null
      : isError && error instanceof LoginApiError
        ? error.message
        : isError
          ? "Algo deu errado. Tente novamente."
          : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-navy-900 px-8 py-10 shadow-xl shadow-black/40">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-zinc-100">
          Entrar
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-500">LifeSync - login</p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor={emailId}
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500"
            >
              E-mail
            </label>
            <input
              id={emailId}
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ls-input"
              placeholder="voce@email.com"
              required
            />
          </div>

          <div>
            <label
              htmlFor={passwordId}
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500"
            >
              Senha
            </label>
            <input
              id={passwordId}
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="ls-input"
              placeholder="Sua senha"
              required
            />
          </div>

          {isPendingAccount ? (
            <div className="rounded-lg border border-yellow-700/50 bg-yellow-950/30 px-4 py-3 text-sm text-yellow-400">
              Sua conta ainda está em análise. Aguarde a aprovação do administrador.
            </div>
          ) : null}

          {isRejectedAccount ? (
            <div className="rounded-lg border border-red-700/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
              Sua conta foi rejeitada pelo administrador.
            </div>
          ) : null}

          {errorMessage !== null ? (
            <p className="text-xs text-red-400/90" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="ls-btn-block"
          >
            {isPending ? "Entrando..." : "Entrar"}
          </button>

          <Link
            to="/register"
            className="block w-full text-center text-sm text-zinc-400 transition hover:text-zinc-200"
          >
            Ainda nao tem conta? Registre-se
          </Link>
        </form>
      </div>
    </div>
  );
}
