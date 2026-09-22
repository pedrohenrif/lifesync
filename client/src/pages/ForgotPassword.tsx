import type { FormEvent, ReactElement } from "react";
import { useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PasswordResetApiError } from "../api/auth";
import {
  useRequestPasswordReset,
  useResetPassword,
} from "../hooks/usePasswordReset";

export function ForgotPassword(): ReactElement {
  const emailId = useId();
  const codeId = useId();
  const passwordId = useId();
  const confirmId = useId();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const navigate = useNavigate();

  const requestReset = useRequestPasswordReset();
  const confirmReset = useResetPassword();

  const handleRequest = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setLocalError(null);
    requestReset.reset();
    requestReset.mutate(email, {
      onSuccess: () => {
        setStep("code");
      },
    });
  };

  const handleConfirm = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setLocalError(null);
    confirmReset.reset();
    if (password !== confirmPassword) {
      setLocalError("As senhas não coincidem.");
      return;
    }
    confirmReset.mutate(
      { email, code, password },
      {
        onSuccess: () => {
          navigate("/login", { replace: true });
        },
      },
    );
  };

  const requestError =
    requestReset.isError && requestReset.error instanceof PasswordResetApiError
      ? requestReset.error.message
      : requestReset.isError
        ? "Algo deu errado. Tente novamente."
        : null;

  const confirmError =
    confirmReset.isError && confirmReset.error instanceof PasswordResetApiError
      ? confirmReset.error.message
      : confirmReset.isError
        ? "Algo deu errado. Tente novamente."
        : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-navy-900 px-8 py-10 shadow-xl shadow-black/40">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-zinc-100">
          Esqueci a senha
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-500">
          {step === "email"
            ? "Enviamos um código de 6 dígitos se a conta existir e estiver ativa."
            : `Código enviado para ${email}. Ele vale por 10 minutos.`}
        </p>

        {step === "email" ? (
          <form className="mt-8 space-y-5" onSubmit={handleRequest} noValidate>
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

            {requestError !== null ? (
              <p className="text-xs text-red-400/90" role="alert">
                {requestError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={requestReset.isPending}
              className="ls-btn-block"
            >
              {requestReset.isPending ? "Enviando..." : "Enviar código"}
            </button>
          </form>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleConfirm} noValidate>
            <div>
              <label
                htmlFor={codeId}
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500"
              >
                Código
              </label>
              <input
                id={codeId}
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="ls-input tracking-[0.4em]"
                placeholder="000000"
                required
              />
            </div>

            <div>
              <label
                htmlFor={passwordId}
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500"
              >
                Nova senha
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
                required
                minLength={8}
              />
            </div>

            <div>
              <label
                htmlFor={confirmId}
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500"
              >
                Confirmar senha
              </label>
              <input
                id={confirmId}
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="ls-input"
                placeholder="Repita a nova senha"
                required
                minLength={8}
              />
            </div>

            {localError !== null || confirmError !== null ? (
              <p className="text-xs text-red-400/90" role="alert">
                {localError ?? confirmError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={confirmReset.isPending}
              className="ls-btn-block"
            >
              {confirmReset.isPending ? "Salvando..." : "Redefinir senha"}
            </button>

            <button
              type="button"
              className="block w-full text-center text-sm text-zinc-400 transition hover:text-zinc-200"
              onClick={() => {
                setStep("email");
                setCode("");
                setPassword("");
                setConfirmPassword("");
                setLocalError(null);
                confirmReset.reset();
              }}
            >
              Usar outro e-mail
            </button>
          </form>
        )}

        <Link
          to="/login"
          className="mt-6 block w-full text-center text-sm text-zinc-400 transition hover:text-zinc-200"
        >
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
