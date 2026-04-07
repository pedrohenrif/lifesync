import { ok, type Result } from "../result.js";
import type { IHabitRepository } from "../../domain/repositories/IHabitRepository.js";

export type HabitSummary = {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly description: string | null;
  readonly frequencyType: string;
  readonly targetDaysPerWeek: number | null;
  readonly completedDates: readonly string[];
  readonly xp: number;
  readonly level: number;
  readonly currentStreak: number;
  readonly createdAt: string;
};

export type ListHabitsSuccess = readonly HabitSummary[];

export class ListHabitsUseCase {
  constructor(private readonly habits: IHabitRepository) {}

  async execute(userId: string): Promise<Result<ListHabitsSuccess, never>> {
    const habits = await this.habits.findAllByUserId(userId);

    return ok(
      habits.map((h) => ({
        id: h.id,
        userId: h.userId,
        name: h.name,
        description: h.description,
        frequencyType: h.frequencyType,
        targetDaysPerWeek: h.targetDaysPerWeek,
        completedDates: [...h.completedDates],
        xp: h.xp,
        level: h.level,
        currentStreak: h.currentStreak,
        createdAt: h.createdAt.toISOString(),
      })),
    );
  }
}
