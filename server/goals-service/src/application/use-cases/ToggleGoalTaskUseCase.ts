import { err, ok, type Result } from "../result.js";
import type { GoalCategory } from "../../domain/entities/Goal.js";
import type { GoalTaskError } from "../../domain/entities/Goal.js";
import type { IGoalRepository } from "../../domain/repositories/IGoalRepository.js";
import { serializeGoalTasks, type SerializedGoalTask } from "./shared.js";

export type GoalGamificationNotifier = {
  notifyGoalTaskComplete(userId: string, goalCategory: GoalCategory): Promise<void>;
};

export type ToggleTaskError =
  | GoalTaskError
  | { readonly code: "GOAL_NOT_FOUND" }
  | { readonly code: "FORBIDDEN" };

export type ToggleTaskSuccess = {
  readonly tasks: readonly SerializedGoalTask[];
};

export class ToggleGoalTaskUseCase {
  constructor(
    private readonly goals: IGoalRepository,
    private readonly gamification: GoalGamificationNotifier | null,
  ) {}

  async execute(
    goalId: string,
    userId: string,
    taskId: string,
  ): Promise<Result<ToggleTaskSuccess, ToggleTaskError>> {
    const goal = await this.goals.findById(goalId);
    if (goal === null) return err({ code: "GOAL_NOT_FOUND" });
    if (goal.userId !== userId) return err({ code: "FORBIDDEN" });

    const taskBefore = goal.tasks.find((t) => t.id === taskId);
    const wasIncomplete = taskBefore !== undefined && !taskBefore.isCompleted;

    const result = goal.toggleTask(taskId);
    if (!result.ok) return err(result.error);

    await this.goals.update(result.goal);

    if (wasIncomplete && this.gamification !== null) {
      const after = result.goal.tasks.find((t) => t.id === taskId);
      if (after?.isCompleted === true) {
        void this.gamification.notifyGoalTaskComplete(goal.userId, goal.category).catch(() => undefined);
      }
    }

    return ok({ tasks: serializeGoalTasks(result.goal.tasks) });
  }
}
