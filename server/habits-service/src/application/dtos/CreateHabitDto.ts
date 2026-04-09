import type { HabitCategory } from "../../domain/entities/Habit.js";

export type CreateHabitDto = {
  readonly name: string;
  readonly description?: string;
  readonly icon?: string;
  readonly category?: HabitCategory;
  readonly frequencyType?: "DAILY" | "WEEKLY_TARGET";
  readonly targetDaysPerWeek?: number;
};
