import type { ReactElement, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Flame,
  GraduationCap,
  Layers,
  Sparkles,
  Target,
  Wallet,
  Zap,
} from "lucide-react";
import { completeOnboarding, OnboardingApiError, type PrimaryFocus } from "../api/auth";
import { createHabit, HabitsApiError } from "../api/habits";
import { addGoalTask, createGoal, GoalsApiError } from "../api/goals";
import { useAuthStore } from "../stores/authStore";
import {
  allPackItemIds,
  buildStarterPack,
  type ExperienceLevel,
  type StarterPack,
} from "../lib/onboardingStarterPack";
import { CATEGORY_LABELS } from "../lib/habitMeta";
import { HabitGlyph } from "../components/habits/HabitGlyph";

const TOTAL_STEPS = 4;

const INPUT_CLASS =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-600/60 focus:ring-1 focus:ring-emerald-600/30";

const FOCUS_OPTIONS: readonly {
  readonly id: PrimaryFocus;
  readonly label: string;
  readonly subtitle: string;
  readonly icon: typeof Wallet;
}[] = [
  {
    id: "FINANCE",
    label: "Organizar finanças",
    subtitle: "Quero clareza no meu dinheiro e sair do improviso.",
    icon: Wallet,
  },
  {
    id: "HABITS",
    label: "Fortalecer hábitos",
    subtitle: "Quero parar de procrastinar e ter constância.",
    icon: Flame,
  },
  {
    id: "GOALS",
    label: "Atingir metas",
    subtitle: "Quero transformar sonhos em passos mensuráveis.",
    icon: Target,
  },
];

const EXPERIENCE_OPTIONS: readonly {
  readonly id: ExperienceLevel;
  readonly label: string;
  readonly hint: string;
  readonly icon: typeof GraduationCap;
}[] = [
  {
    id: "BEGINNER",
    label: "Iniciante",
    hint: "Preciso de um norte",
    icon: GraduationCap,
  },
  {
    id: "INTERMEDIATE",
    label: "Intermediário",
    hint: "Uso cadernos ou planilhas",
    icon: Layers,
  },
  {
    id: "ADVANCED",
    label: "Avançado",
    hint: "Quero alta performance",
    icon: Zap,
  },
];

function StepPanel({
  stepKey,
  children,
}: {
  readonly stepKey: number;
  readonly children: ReactNode;
}): ReactElement {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(false);
    const id = window.setTimeout(() => setOn(true), 40);
    return () => window.clearTimeout(id);
  }, [stepKey]);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        on ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

export function Onboarding(): ReactElement {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null);
  const [focus, setFocus] = useState<PrimaryFocus | null>(null);
  const [selectedPackIds, setSelectedPackIds] = useState<Set<string>>(() => new Set());
  const [submitting, setSubmitting] = useState(false);

  const pack: StarterPack | null = useMemo(
    () => (focus !== null ? buildStarterPack(focus) : null),
    [focus],
  );

  const progressPercent = (step / TOTAL_STEPS) * 100;

  const initPackSelection = (): void => {
    if (focus === null || pack === null) return;
    setSelectedPackIds(new Set(allPackItemIds(pack)));
  };

  const togglePackId = (id: string): void => {
    setSelectedPackIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const goToStep = (next: number): void => {
    setStep(next);
  };

  const handleFinish = async (): Promise<void> => {
    if (focus === null || pack === null) {
      toast.error("Escolha um foco principal.");
      return;
    }
    const name = displayName.trim();
    if (name.length === 0) {
      toast.error("Informe como prefere ser chamado.");
      return;
    }

    const habitItems = pack.habits.filter((h) => selectedPackIds.has(h.id));
    const goalItems = pack.goals.filter((g) => selectedPackIds.has(g.id));

    setSubmitting(true);
    try {
      const [mePayload] = await Promise.all([
        completeOnboarding({ name, primaryFocus: focus }),
        ...habitItems.map((h) =>
          createHabit({
            name: h.name,
            frequencyType: "DAILY",
            icon: h.icon,
            category: h.category,
          }),
        ),
      ]);

      const createdGoals =
        goalItems.length > 0
          ? await Promise.all(
              goalItems.map((g) =>
                createGoal({
                  title: g.title,
                  description: g.description,
                  category: g.category,
                  targetDate: g.targetDate,
                }),
              ),
            )
          : [];

      const taskJobs = createdGoals.flatMap((res, index) => {
        const sub = goalItems[index]?.subtasks ?? [];
        return sub.map((title) => addGoalTask(res.goal.id, title));
      });
      if (taskJobs.length > 0) {
        await Promise.all(taskJobs);
      }

      setUser(mePayload.user);
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      await queryClient.invalidateQueries({ queryKey: ["habits"] });
      await queryClient.invalidateQueries({ queryKey: ["goals"] });
      sessionStorage.setItem("lifesync:onboarded", "1");
      toast.success("Seu cockpit está pronto. Bem-vindo ao LifeSync!");
      navigate("/dashboard", { replace: true });
    } catch (e) {
      const message =
        e instanceof OnboardingApiError || e instanceof GoalsApiError || e instanceof HabitsApiError
          ? e.message
          : "Não foi possível concluir. Tente novamente.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-zinc-950 px-4 py-8 text-zinc-100 md:py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% -15%, rgba(16, 185, 129, 0.18), transparent), radial-gradient(ellipse 50% 35% at 100% 40%, rgba(139, 92, 246, 0.1), transparent)",
        }}
      />

      <div className="relative mx-auto w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-emerald-400" />
          <span className="text-sm font-semibold tracking-tight text-zinc-200">
            LifeSync Concierge
          </span>
        </div>

        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-xs text-zinc-500">
            <span>Seu plano personalizado</span>
            <span className="tabular-nums text-zinc-400">{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl shadow-black/30 md:p-8">
          {step === 1 ? (
            <StepPanel stepKey={step}>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-emerald-500/90">
                    Passo 1 de {TOTAL_STEPS}
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
                    Como prefere ser chamado?
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                    Vamos usar esse nome no seu cockpit e nas mensagens de boas-vindas.
                  </p>
                </div>
                <label className="block">
                  <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Nome ou apelido
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
                  onClick={() => goToStep(2)}
                  className="min-h-11 w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continuar
                </button>
              </div>
            </StepPanel>
          ) : null}

          {step === 2 ? (
            <StepPanel stepKey={step}>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-emerald-500/90">
                    Passo 2 de {TOTAL_STEPS}
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
                    Como você avalia sua organização hoje?
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                    Isso nos ajuda a calibrar sugestões — fica só com você neste momento.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                  {EXPERIENCE_OPTIONS.map(({ id, label, hint, icon: Icon }) => {
                    const active = experienceLevel === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setExperienceLevel(id)}
                        className={`flex min-h-[5.5rem] flex-1 flex-col items-start rounded-xl border p-4 text-left transition-all duration-300 ${
                          active
                            ? "border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/35"
                            : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
                        }`}
                      >
                        <div
                          className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${
                            active ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-semibold text-zinc-100">{label}</span>
                        <span className="mt-1 text-xs leading-snug text-zinc-500">{hint}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="min-h-11 flex-1 rounded-xl border border-zinc-800 py-3 text-sm font-medium text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    disabled={experienceLevel === null}
                    onClick={() => goToStep(3)}
                    className="min-h-11 flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            </StepPanel>
          ) : null}

          {step === 3 ? (
            <StepPanel stepKey={step}>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-emerald-500/90">
                    Passo 3 de {TOTAL_STEPS}
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
                    Onde quer nosso foco inicial?
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                    Você terá acesso a todos os módulos; aqui definimos o primeiro plano sob medida.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {FOCUS_OPTIONS.map(({ id, label, subtitle, icon: Icon }) => {
                    const active = focus === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setFocus(id)}
                        className={`flex min-h-[9rem] flex-col items-start rounded-xl border p-4 text-left transition-all duration-300 ${
                          active
                            ? "border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/35"
                            : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
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
                        <span className="mt-2 text-xs leading-relaxed text-zinc-500">{subtitle}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="min-h-11 flex-1 rounded-xl border border-zinc-800 py-3 text-sm font-medium text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    disabled={focus === null}
                    onClick={() => {
                      initPackSelection();
                      goToStep(4);
                    }}
                    className="min-h-11 flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Ver meu pacote inicial
                  </button>
                </div>
              </div>
            </StepPanel>
          ) : null}

          {step === 4 && focus !== null && pack !== null ? (
            <StepPanel stepKey={step}>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-emerald-500/90">
                    Passo 4 de {TOTAL_STEPS}
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
                    Seu pacote inicial
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                    O LifeSync pode criar estes hábitos e metas agora. Desmarque o que não quiser — você
                    edita tudo depois.
                  </p>
                  {experienceLevel === "BEGINNER" ? (
                    <p className="text-xs text-zinc-600">
                      Começamos com um plano enxuto — você pode acrescentar quando quiser.
                    </p>
                  ) : null}
                  {experienceLevel === "INTERMEDIATE" ? (
                    <p className="text-xs text-zinc-600">
                      Conectamos hábitos e metas para dar ritmo ao que você já faz hoje.
                    </p>
                  ) : null}
                  {experienceLevel === "ADVANCED" ? (
                    <p className="text-xs text-zinc-600">
                      Pacote focado em execução: menos fricção, mais tração no cockpit.
                    </p>
                  ) : null}
                </div>

                {pack.habits.length > 0 ? (
                  <div>
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Hábitos
                    </h2>
                    <ul className="space-y-2">
                      {pack.habits.map((h) => (
                        <li key={h.id}>
                          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 transition hover:border-zinc-700">
                            <input
                              type="checkbox"
                              checked={selectedPackIds.has(h.id)}
                              onChange={() => togglePackId(h.id)}
                              className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-600 bg-zinc-900 accent-emerald-500"
                            />
                            <div className="flex min-w-0 flex-1 items-start gap-2">
                              <HabitGlyph icon={h.icon} />
                              <div className="min-w-0 flex-1">
                                <span className="text-sm font-medium text-zinc-200">{h.name}</span>
                                <span className="mt-1 block text-[10px] uppercase tracking-wide text-zinc-600">
                                  {CATEGORY_LABELS[h.category]}
                                </span>
                              </div>
                            </div>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {pack.goals.length > 0 ? (
                  <div>
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Metas
                    </h2>
                    <ul className="space-y-2">
                      {pack.goals.map((g) => (
                        <li key={g.id}>
                          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 transition hover:border-zinc-700">
                            <input
                              type="checkbox"
                              checked={selectedPackIds.has(g.id)}
                              onChange={() => togglePackId(g.id)}
                              className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-600 bg-zinc-900 accent-emerald-500"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-zinc-100">{g.title}</p>
                              {g.description !== undefined && g.description.length > 0 ? (
                                <p className="mt-1 text-xs text-zinc-500">{g.description}</p>
                              ) : null}
                              <p className="mt-1 text-[10px] text-zinc-600">
                                Prazo sugerido:{" "}
                                {new Date(g.targetDate + "T12:00:00").toLocaleDateString("pt-BR")}
                              </p>
                              {g.subtasks !== undefined && g.subtasks.length > 0 ? (
                                <ul className="mt-2 space-y-1 border-l border-zinc-800 pl-3 text-xs text-zinc-500">
                                  {g.subtasks.map((t) => (
                                    <li key={t}>· {t}</li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => goToStep(3)}
                    className="min-h-11 flex-1 rounded-xl border border-zinc-800 py-3 text-sm font-medium text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleFinish()}
                    className="min-h-11 flex-[2] rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/15 transition hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Montando seu cockpit..." : "Montar meu Cockpit"}
                  </button>
                </div>
              </div>
            </StepPanel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
