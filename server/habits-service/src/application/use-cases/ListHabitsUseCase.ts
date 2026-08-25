import { ok, type Result } from "../result.js";
import type { IHabitRepository } from "../../domain/repositories/IHabitRepository.js";
import type { Habit } from "../../domain/entities/Habit.js";
import {
  mapPaginated,
  type Paginated,
  type PaginationParams,
} from "../../domain/pagination.js";

export type HabitSummary = {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly description: string | null;
  readonly icon: string;
  readonly category: string;
  readonly frequencyType: string;
  readonly targetDaysPerWeek: number | null;
  readonly completedDates: readonly string[];
  readonly xp: number;
  readonly level: number;
  readonly currentStreak: number;
  readonly createdAt: string;
};

export type ListHabitsSuccess = Paginated<HabitSummary>;

function toSummary(habit: Habit): HabitSummary {
  return {
    id: habit.id,
    userId: habit.userId,
    name: habit.name,
    description: habit.description,
    icon: habit.icon,
    category: habit.category,
    frequencyType: habit.frequencyType,
    targetDaysPerWeek: habit.targetDaysPerWeek,
    completedDates: [...habit.completedDates],
    xp: habit.xp,
    level: habit.level,
    currentStreak: habit.currentStreak,
    createdAt: habit.createdAt.toISOString(),
  };
}

export class ListHabitsUseCase {
  constructor(private readonly habits: IHabitRepository) {}

  async execute(
    userId: string,
    pagination: PaginationParams,
  ): Promise<Result<ListHabitsSuccess, never>> {
    const page = await this.habits.findAllByUserId(userId, pagination);
    return ok(mapPaginated(page, toSummary));
  }
}
