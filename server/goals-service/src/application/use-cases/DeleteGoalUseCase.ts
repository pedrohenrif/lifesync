import { err, ok, type Result } from "../result.js";
import type { IGoalRepository } from "../../domain/repositories/IGoalRepository.js";

export type DeleteGoalError =
  | { readonly code: "GOAL_NOT_FOUND" }
  | { readonly code: "FORBIDDEN" };

export class DeleteGoalUseCase {
  constructor(private readonly goals: IGoalRepository) {}

  async execute(
    goalId: string,
    userId: string,
  ): Promise<Result<null, DeleteGoalError>> {
    const existing = await this.goals.findById(goalId);
    if (existing === null) {
      return err({ code: "GOAL_NOT_FOUND" });
    }

    if (existing.userId !== userId) {
      return err({ code: "FORBIDDEN" });
    }

    await this.goals.delete(goalId);

    return ok(null);
  }
}
