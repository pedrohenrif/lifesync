import type { HabitCategory } from "../../domain/entities/Habit.js";

export type UpdateHabitDto = {
  readonly name?: string;
  readonly description?: string | null;
  readonly icon?: string;
  readonly category?: HabitCategory;
  readonly frequencyType?: "DAILY" | "WEEKLY_TARGET";
  readonly targetDaysPerWeek?: number | null;
};
