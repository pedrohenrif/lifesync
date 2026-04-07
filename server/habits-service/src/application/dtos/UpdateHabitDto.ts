export type UpdateHabitDto = {
  readonly name?: string;
  readonly description?: string | null;
  readonly frequencyType?: "DAILY" | "WEEKLY_TARGET";
  readonly targetDaysPerWeek?: number | null;
};
