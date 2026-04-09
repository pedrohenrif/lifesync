export type HabitCategory = "SAUDE" | "FOCO" | "FINANCAS" | "PESSOAL";

export const CATEGORY_LABELS: Record<HabitCategory, string> = {
  SAUDE: "Saúde",
  FOCO: "Foco",
  FINANCAS: "Finanças",
  PESSOAL: "Pessoal",
};

export const HABIT_CATEGORIES: readonly HabitCategory[] = [
  "SAUDE",
  "FOCO",
  "FINANCAS",
  "PESSOAL",
];

export function isHabitCategory(value: unknown): value is HabitCategory {
  return (
    value === "SAUDE" ||
    value === "FOCO" ||
    value === "FINANCAS" ||
    value === "PESSOAL"
  );
}
