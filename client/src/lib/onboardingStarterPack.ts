import type { PrimaryFocus } from "../api/auth";
import type { GoalCategory } from "../api/goals";
import type { HabitCategory } from "./habitMeta";

export type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type StarterHabitDef = {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly category: HabitCategory;
};

export type StarterGoalDef = {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly category: GoalCategory;
  readonly targetDate: string;
  readonly subtasks?: readonly string[];
};

export type StarterPack = {
  readonly habits: readonly StarterHabitDef[];
  readonly goals: readonly StarterGoalDef[];
};

export function dateISOPlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Conteúdo sugerido do “pacote inicial” por foco principal. */
export function buildStarterPack(focus: PrimaryFocus): StarterPack {
  switch (focus) {
    case "HABITS":
      return {
        habits: [
          { id: "pk-h-hydrate", name: "Beber água (2L)", icon: "Droplets", category: "SAUDE" },
          { id: "pk-h-meditate", name: "Meditar 10 minutos", icon: "Brain", category: "SAUDE" },
          { id: "pk-h-read", name: "Leitura diária", icon: "BookOpen", category: "FOCO" },
        ],
        goals: [
          {
            id: "pk-g-prod5",
            title: "Alcançar o Nível 5 de Produtividade no LifeSync",
            description:
              "Combine hábitos e check-ins diários até evoluir seus níveis no app — um passo de cada vez.",
            category: "PERSONAL",
            targetDate: dateISOPlusDays(30),
          },
        ],
      };
    case "GOALS":
      return {
        habits: [
          {
            id: "pk-h-study",
            name: "Estudar 30 minutos",
            icon: "Target",
            category: "FOCO",
          },
        ],
        goals: [
          {
            id: "pk-g-skill",
            title: "Aprender uma nova habilidade",
            description: "Estruture o começo da sua jornada com passos claros.",
            category: "STUDY",
            targetDate: dateISOPlusDays(60),
            subtasks: [
              "Escolher o curso ou recurso",
              "Assistir à primeira aula ou módulo",
              "Reservar 30 min diários na agenda",
            ],
          },
        ],
      };
    case "FINANCE":
      return {
        habits: [
          {
            id: "pk-h-log",
            name: "Anotar gastos do dia",
            icon: "PenLine",
            category: "FINANCAS",
          },
          {
            id: "pk-h-nocc",
            name: "Não usar cartão de crédito hoje",
            icon: "💳",
            category: "FINANCAS",
          },
        ],
        goals: [
          {
            id: "pk-g-emergency",
            title: "Reserva de emergência: juntar R$ 1.000",
            description: "Meta inicial para criar folga financeira com consistência.",
            category: "PERSONAL",
            targetDate: dateISOPlusDays(90),
          },
        ],
      };
  }
}

export function allPackItemIds(pack: StarterPack): string[] {
  return [...pack.habits.map((h) => h.id), ...pack.goals.map((g) => g.id)];
}
