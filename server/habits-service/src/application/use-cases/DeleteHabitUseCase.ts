import { err, ok, type Result } from "../result.js";
import type { IHabitRepository } from "../../domain/repositories/IHabitRepository.js";

export type DeleteHabitError =
  | { readonly code: "HABIT_NOT_FOUND" }
  | { readonly code: "FORBIDDEN" };

export class DeleteHabitUseCase {
  constructor(private readonly habits: IHabitRepository) {}

  async execute(
    habitId: string,
    userId: string,
  ): Promise<Result<null, DeleteHabitError>> {
    const existing = await this.habits.findById(habitId);
    if (existing === null) return err({ code: "HABIT_NOT_FOUND" });
    if (existing.userId !== userId) return err({ code: "FORBIDDEN" });

    await this.habits.delete(habitId);

    return ok(null);
  }
}
