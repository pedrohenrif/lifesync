import { randomUUID } from "node:crypto";
import { err, ok, type Result } from "../result.js";
import type { CreateHabitDto } from "../dtos/CreateHabitDto.js";
import { Habit } from "../../domain/entities/Habit.js";
import type { HabitValidationError } from "../../domain/entities/Habit.js";
import type { IHabitRepository } from "../../domain/repositories/IHabitRepository.js";

export type CreateHabitSuccess = {
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

export type CreateHabitError = HabitValidationError;

export class CreateHabitUseCase {
  constructor(private readonly habits: IHabitRepository) {}

  async execute(
    userId: string,
    dto: CreateHabitDto,
  ): Promise<Result<CreateHabitSuccess, CreateHabitError>> {
    const frequencyType = dto.frequencyType ?? "DAILY";

    const result = Habit.create({
      id: randomUUID(),
      userId,
      name: dto.name,
      description: dto.description?.trim() ?? null,
      frequencyType,
      targetDaysPerWeek:
        frequencyType === "WEEKLY_TARGET"
          ? (dto.targetDaysPerWeek ?? null)
          : null,
      completedDates: [],
      xp: 0,
      level: 1,
      createdAt: new Date(),
    });

    if (!result.ok) {
      return err(result.error);
    }

    const habit = result.habit;
    await this.habits.save(habit);

    return ok({
      id: habit.id,
      userId: habit.userId,
      name: habit.name,
      description: habit.description,
      frequencyType: habit.frequencyType,
      targetDaysPerWeek: habit.targetDaysPerWeek,
      completedDates: [...habit.completedDates],
      xp: habit.xp,
      level: habit.level,
      currentStreak: habit.currentStreak,
      createdAt: habit.createdAt.toISOString(),
    });
  }
}
