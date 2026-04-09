import type { UserAttributes } from "../../domain/entities/User.js";

export type HabitCategoryPayload = "SAUDE" | "FOCO" | "FINANCAS" | "PESSOAL";
export type GoalCategoryPayload =
  | "STUDY"
  | "PERSONAL"
  | "BUSINESS"
  | "FAMILY"
  | "DREAMS"
  | "OTHER";

function habitAttributeKey(cat: HabitCategoryPayload): keyof UserAttributes {
  switch (cat) {
    case "SAUDE":
      return "health";
    case "FINANCAS":
      return "finance";
    case "FOCO":
      return "focus";
    case "PESSOAL":
      return "social";
  }
}

function goalAttributeKey(cat: GoalCategoryPayload): keyof UserAttributes {
  switch (cat) {
    case "STUDY":
      return "knowledge";
    case "PERSONAL":
      return "social";
    case "BUSINESS":
      return "focus";
    case "FAMILY":
      return "social";
    case "DREAMS":
      return "focus";
    case "OTHER":
      return "knowledge";
  }
}

/** Hábito concluído: +10 no pilar + 5 XP geral (total 15 XP / moedas). */
export function deltasForHabitCheckin(category: HabitCategoryPayload): {
  readonly totalXp: number;
  readonly coins: number;
  readonly attributes: Partial<UserAttributes>;
} {
  const k = habitAttributeKey(category);
  const attrXp = 10;
  const generalXp = 5;
  const total = attrXp + generalXp;
  return {
    totalXp: total,
    coins: total,
    attributes: { [k]: attrXp },
  };
}

/** Subtarefa de meta concluída: +20 XP. */
export function deltasForGoalTask(goalCategory: GoalCategoryPayload): {
  readonly totalXp: number;
  readonly coins: number;
  readonly attributes: Partial<UserAttributes>;
} {
  const k = goalAttributeKey(goalCategory);
  const xp = 20;
  return {
    totalXp: xp,
    coins: xp,
    attributes: { [k]: xp },
  };
}

/** Meta concluída (boss): +100 XP + bônus de 50 no pilar (150 XP / moedas totais). */
export function deltasForGoalComplete(goalCategory: GoalCategoryPayload): {
  readonly totalXp: number;
  readonly coins: number;
  readonly attributes: Partial<UserAttributes>;
} {
  const k = goalAttributeKey(goalCategory);
  const total = 150;
  const attrBonus = 50;
  return {
    totalXp: total,
    coins: total,
    attributes: { [k]: attrBonus },
  };
}
