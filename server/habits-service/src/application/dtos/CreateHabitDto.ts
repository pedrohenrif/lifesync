export type CreateHabitDto = {
  readonly name: string;
  readonly description?: string;
  readonly frequencyType?: "DAILY" | "WEEKLY_TARGET";
  readonly targetDaysPerWeek?: number;
};
