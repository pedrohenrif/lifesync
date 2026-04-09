import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Flame, Sparkles, Target, Wallet } from "lucide-react";
import { completeOnboarding, OnboardingApiError, type PrimaryFocus } from "../api/auth";
import { createHabit } from "../api/habits";
import { useAuthStore } from "../stores/authStore";

const SUGGESTIONS: Record<PrimaryFocus, readonly string[]> = {
  FINANCE: [
    "Revisar gastos do dia",
    "Registrar uma despesa ou receita",
    "Reservar 10 min para planejar o mês",
  ],
  HABITS: ["Beber 2L de água", "Ler 10 páginas", "Dormir 8 horas"],
  GOALS: [
    "Planejar um passo da meta principal",
    "Revisar metas da semana",
    "15 min focados na maior meta",
  ],
};

const FOCUS_OPTIONS: readonly {
  readonly id: PrimaryFocus;
  readonly label: string;
  readonly description: string;
  readonly icon: typeof Wallet;
}[] = [
  {
    id: "FINANCE",
    label: "Organizar Finanças",
    description: "Clareza sobre entradas, saídas e metas de dinheiro.",
    icon: Wallet,
  },
  {
    id: "HABITS",
    label: "Criar Hábitos",
    description: "Constância diária com hábitos que importam para você.",
    icon: Flame,
  },
  {
    id: "GOALS",
    label: "Atingir Metas",
    description: "Transformar objetivos em passos concretos.",
    icon: Target,
  },
];

const INPUT_CLASS =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-600/60 focus:ring-1 focus:ring-emerald-600/30";

export function Onboarding(): ReactElement {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [focus, setFocus] = useState<PrimaryFocus | null>(null);
  const [selectedHabits, setSelectedHabits] = useState<Set<string>>(() => new Set());
  const [submitting, setSubmitting] = useState(false);

  const suggestions = useMemo(() => {
    if (focus === null) return [];
    return [...SUGGESTIONS[focus]];
  }, [focus]);

  const toggleHabit = (name: string): void => {
    setSelectedHabits((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleFinish = async (): Promise<void> => {
    if (focus === null) {
      toast.error("Escolha um foco principal.");
      return;
    }
    const name = displayName.trim();
    if (name.length === 0) {
      toast.error("Informe como prefere ser chamado.");
      return;
    }

    const habitNames = [...selectedHabits];
    setSubmitting(true);
    try {
      const [mePayload] = await Promise.all([
        completeOnboarding({ name, primaryFocus: focus }),
        ...habitNames.map((habitName) =>
          createHabit({ name: habitName, frequencyType: "DAILY" }),
        ),
      ]);
      setUser(mePayload.user);
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      await queryClient.invalidateQueries({ queryKey: ["habits"] });
      sessionStorage.setItem("lifesync:onboarded", "1");
      toast.success("Tudo pronto! Bem-vindo ao LifeSync.");
      navigate("/dashboard", { replace: true });
    } catch (e) {
      const message =
        e instanceof OnboardingApiError
          ? e.message
          : "Não foi possível concluir. Tente novamente.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black px-4 py-10 text-zinc-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16, 185, 129, 0.25), transparent), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(139, 92, 246, 0.12), transparent)",
        }}
      />

      <div className="relative mx-auto flex max-w-lg flex-col">
        <div className="mb-8 flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-emerald-400" />
          <span className="text-sm font-semibold tracking-tight text-zinc-200">LifeSync</span>
        </div>

        <div className="mb-6 flex justify-center gap-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-1.5 flex-1 max-w-16 rounded-full transition ${
                step >= n ? "bg-emerald-500" : "bg-zinc-800"
              }`}
            />
          ))}
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
                Como prefere ser chamado?
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Usaremos esse nome no seu cockpit e nas mensagens de boas-vindas.
              </p>
            </div>
            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                Seu nome ou apelido
              </span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={INPUT_CLASS}
                placeholder="Ex: Pedro, Pri, Dr. Silva..."
                autoComplete="nickname"
                autoFocus
              />
            </label>
            <button
              type="button"
              disabled={displayName.trim().length === 0}
              onClick={() => setStep(2)}
              className="min-h-11 w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continuar
            </button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
                Qual é o seu maior objetivo no LifeSync agora?
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Escolha um foco — você poderá usar todos os módulos depois.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {FOCUS_OPTIONS.map(({ id, label, description, icon: Icon }) => {
                const active = focus === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setFocus(id);
                      setSelectedHabits(new Set());
                    }}
                    className={`flex min-h-[7.5rem] flex-col items-start rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/40"
                        : "border-zinc-800 bg-zinc-950/80 hover:border-zinc-700"
                    }`}
                  >
                    <div
                      className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${
                        active ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-semibold text-zinc-100">{label}</span>
                    <span className="mt-1 text-xs leading-relaxed text-zinc-500">{description}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="min-h-11 flex-1 rounded-xl border border-zinc-800 py-3 text-sm font-medium text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={focus === null}
                onClick={() => setStep(3)}
                className="min-h-11 flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuar
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 && focus !== null ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
                Mágica inicial
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Selecione sugestões rápidas para já aparecerem no módulo de hábitos. Você pode editar ou
                excluir depois.
              </p>
            </div>
            <ul className="space-y-3">
              {suggestions.map((habitName) => {
                const checked = selectedHabits.has(habitName);
                return (
                  <li key={habitName}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 transition hover:border-zinc-700">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleHabit(habitName)}
                        className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 accent-emerald-500"
                      />
                      <span className="text-sm text-zinc-200">{habitName}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="min-h-11 flex-1 rounded-xl border border-zinc-800 py-3 text-sm font-medium text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleFinish()}
                className="min-h-11 flex-[2] rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Configurando..." : "Configurar meu Cockpit"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
