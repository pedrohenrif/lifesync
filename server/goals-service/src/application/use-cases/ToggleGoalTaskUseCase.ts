import { err, ok, type Result } from "../result.js";
import type { GoalTaskError } from "../../domain/entities/Goal.js";
import type { IGoalRepository } from "../../domain/repositories/IGoalRepository.js";
import { serializeGoalTasks, type SerializedGoalTask } from "./shared.js";

export type ToggleTaskError =
  | GoalTaskError
  | { readonly code: "GOAL_NOT_FOUND" }
  | { readonly code: "FORBIDDEN" };

export type ToggleTaskSuccess = {
  readonly tasks: readonly SerializedGoalTask[];
};

export class ToggleGoalTaskUseCase {
  constructor(private readonly goals: IGoalRepository) {}

  async execute(
    goalId: string,
    userId: string,
    taskId: string,
  ): Promise<Result<ToggleTaskSuccess, ToggleTaskError>> {
    const goal = await this.goals.findById(goalId);
    if (goal === null) return err({ code: "GOAL_NOT_FOUND" });
    if (goal.userId !== userId) return err({ code: "FORBIDDEN" });

    const result = goal.toggleTask(taskId);
    if (!result.ok) return err(result.error);

    await this.goals.update(result.goal);

    return ok({ tasks: serializeGoalTasks(result.goal.tasks) });
  }
}
