import type { PrimaryFocus } from "../../api/auth";
import type { HabitCategory } from "../../lib/habitMeta";
import { CATEGORY_LABELS, HABIT_CATEGORIES } from "../../lib/habitMeta";

export type { HabitCategory };
export { CATEGORY_LABELS, HABIT_CATEGORIES };

/** Nomes exportados do lucide-react para o picker (PascalCase). */
export const LUCIDE_HABIT_ICON_NAMES = [
  "Activity",
  "Flame",
  "BookOpen",
  "Brain",
  "Coffee",
  "Droplets",
  "Moon",
  "Sun",
  "Dumbbell",
  "Heart",
  "Wallet",
  "PiggyBank",
  "Target",
  "Zap",
  "PenLine",
  "Music",
  "Smartphone",
  "Apple",
  "Footprints",
  "Lightbulb",
] as const;

export type LucideHabitIconName = (typeof LUCIDE_HABIT_ICON_NAMES)[number];

/** Emojis rápidos além dos ícones Lucide. */
export const QUICK_EMOJI_ICONS = ["📚", "🧘", "🛏️", "💧", "☀️", "🌙", "💪", "🍎", "✍️", "🎯"] as const;

export type HabitTemplate = {
  readonly name: string;
  readonly icon: string;
  readonly category: HabitCategory;
};

/** Sugestões inteligentes por foco do perfil (onboarding / auth). */
export const SMART_SUGGESTIONS: Record<PrimaryFocus, readonly HabitTemplate[]> = {
  HABITS: [
    { name: "Leitura", icon: "BookOpen", category: "FOCO" },
    { name: "Meditação", icon: "Brain", category: "SAUDE" },
    { name: "Arrumar a cama", icon: "Sun", category: "PESSOAL" },
  ],
  FINANCE: [
    { name: "Revisar gastos do dia", icon: "Wallet", category: "FINANCAS" },
    { name: "Aportar em investimento", icon: "PiggyBank", category: "FINANCAS" },
    { name: "Planejar orçamento semanal", icon: "Target", category: "FINANCAS" },
  ],
  GOALS: [
    { name: "Planejar prioridade do dia", icon: "Target", category: "FOCO" },
    { name: "Bloco de foco 25 min", icon: "Zap", category: "FOCO" },
    { name: "Revisar metas da semana", icon: "PenLine", category: "FOCO" },
  ],
};

export function suggestionsForUserFocus(
  primaryFocus: PrimaryFocus | null | undefined,
): readonly HabitTemplate[] {
  if (primaryFocus === "HABITS") return SMART_SUGGESTIONS.HABITS;
  if (primaryFocus === "FINANCE") return SMART_SUGGESTIONS.FINANCE;
  if (primaryFocus === "GOALS") return SMART_SUGGESTIONS.GOALS;
  return SMART_SUGGESTIONS.HABITS;
}
