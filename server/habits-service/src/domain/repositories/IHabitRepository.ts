import type { Habit } from "../entities/Habit.js";

/** Projeção leve para lembretes / cron (sem carregar entidades completas). */
export type HabitReminderRow = {
  readonly userId: string;
  readonly frequencyType: string;
  readonly completedDates: readonly string[];
  readonly targetDaysPerWeek: number | null;
};

/**
 * Contrato de persistência — implementação na Infrastructure (Mongoose).
 */
export interface IHabitRepository {
  save(habit: Habit): Promise<void>;
  findById(id: string): Promise<Habit | null>;
  findAllByUserId(userId: string): Promise<Habit[]>;
  update(habit: Habit): Promise<void>;
  delete(id: string): Promise<void>;
  findAllForReminderProjection(): Promise<readonly HabitReminderRow[]>;
}
