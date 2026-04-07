import { err, ok, type Result } from "../result.js";
import type { IHabitRepository } from "../../domain/repositories/IHabitRepository.js";

const XP_PER_CHECKIN = 10;

export type ToggleHabitSuccess = {
  readonly id: string;
  readonly completedDates: readonly string[];
  readonly currentStreak: number;
  readonly xp: number;
  readonly level: number;
  readonly levelUp: boolean;
};

export type ToggleHabitError =
  | { readonly code: "HABIT_NOT_FOUND" }
  | { readonly code: "FORBIDDEN" }
  | { readonly code: "INVALID_DATE" };

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class ToggleHabitUseCase {
  constructor(private readonly habits: IHabitRepository) {}

  async execute(
    habitId: string,
    userId: string,
    date: string,
  ): Promise<Result<ToggleHabitSuccess, ToggleHabitError>> {
    if (!DATE_REGEX.test(date) || Number.isNaN(new Date(date).getTime())) {
      return err({ code: "INVALID_DATE" });
    }

    const habit = await this.habits.findById(habitId);
    if (habit === null) {
      return err({ code: "HABIT_NOT_FOUND" });
    }

    if (habit.userId !== userId) {
      return err({ code: "FORBIDDEN" });
    }

    const isCheckin = !habit.hasDate(date);
    let updated = habit.withToggledDate(date);

    let levelUp = false;
    if (isCheckin) {
      const gain = updated.withXpGain(XP_PER_CHECKIN);
      updated = gain.habit;
      levelUp = gain.leveledUp;
    }

    await this.habits.update(updated);

    return ok({
      id: updated.id,
      completedDates: [...updated.completedDates],
      currentStreak: updated.currentStreak,
      xp: updated.xp,
      level: updated.level,
      levelUp,
    });
  }
}
