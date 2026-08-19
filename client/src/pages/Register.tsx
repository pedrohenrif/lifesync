import type { FormEvent, ReactElement } from "react";
import { useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RegisterApiError } from "../api/auth";
import { useRegister } from "../hooks/useRegister";

export function Register(): ReactElement {
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const { mutate, isPending, isError, error, reset } = useRegister();

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    reset();
    setSuccessMessage(null);
    mutate(
      { name, email, password },
      {
        onSuccess: () => {
          setSuccessMessage("Cadastro realizado! Aguarde a aprovação do administrador para entrar.");
          setTimeout(() => navigate("/login", { replace: true }), 3000);
        },
      },
    );
  };

  const errorMessage =
    isError && error instanceof RegisterApiError
      ? error.message
      : isError
        ? "Algo deu errado. Tente novamente."
        : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-navy-900 px-8 py-10 shadow-xl shadow-black/40">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-zinc-100">
          Criar conta
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-500">
          LifeSync — registro de usuário
        </p>

        {successMessage !== null ? (
          <div className="mt-6 rounded-lg border border-blue-800/50 bg-blue-950/30 px-4 py-3 text-sm text-blue-400">
            {successMessage}
          </div>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                htmlFor={nameId}
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500"
              >
                Nome (opcional)
              </label>
              <input
                id={nameId}
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="ls-input"
                placeholder="Você define como ser chamado no onboarding"
              />
            </div>

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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="ls-input"
                placeholder="Mínimo 8 caracteres"
                minLength={8}
                required
              />
            </div>

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
              {isPending ? "Criando conta..." : "Cadastrar"}
            </button>

            <Link
              to="/login"
              className="block w-full text-center text-sm text-zinc-400 transition hover:text-zinc-200"
            >
              Ja tem conta? Fazer login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
