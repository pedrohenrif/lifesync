import { err, ok, type Result } from "../result.js";
import type { UpdateHabitDto } from "../dtos/UpdateHabitDto.js";
import type { HabitValidationError } from "../../domain/entities/Habit.js";
import type { IHabitRepository } from "../../domain/repositories/IHabitRepository.js";

export type UpdateHabitSuccess = {
  readonly id: string;
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

export type UpdateHabitError =
  | HabitValidationError
  | { readonly code: "HABIT_NOT_FOUND" }
  | { readonly code: "FORBIDDEN" };

export class UpdateHabitUseCase {
  constructor(private readonly habits: IHabitRepository) {}

  async execute(
    habitId: string,
    userId: string,
    dto: UpdateHabitDto,
  ): Promise<Result<UpdateHabitSuccess, UpdateHabitError>> {
    const existing = await this.habits.findById(habitId);
    if (existing === null) return err({ code: "HABIT_NOT_FOUND" });
    if (existing.userId !== userId) return err({ code: "FORBIDDEN" });

    const result = existing.updateDetails({
      name: dto.name,
      description: dto.description,
      frequencyType: dto.frequencyType,
      targetDaysPerWeek: dto.targetDaysPerWeek,
    });

    if (!result.ok) return err(result.error);

    const updated = result.habit;
    await this.habits.update(updated);

    return ok({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      frequencyType: updated.frequencyType,
      targetDaysPerWeek: updated.targetDaysPerWeek,
      completedDates: [...updated.completedDates],
      xp: updated.xp,
      level: updated.level,
      currentStreak: updated.currentStreak,
      createdAt: updated.createdAt.toISOString(),
    });
  }
}
