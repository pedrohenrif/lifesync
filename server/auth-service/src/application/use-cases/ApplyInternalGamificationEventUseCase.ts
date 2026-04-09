import { err, ok, type Result } from "../result.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import { computeLevelProgress } from "../../domain/services/gamificationMath.js";
import {
  deltasForGoalComplete,
  deltasForGoalTask,
  deltasForHabitCheckin,
  type GoalCategoryPayload,
  type HabitCategoryPayload,
} from "../services/gamificationEventDeltas.js";

export type GamificationEventInput =
  | { readonly type: "habit_checkin"; readonly userId: string; readonly habitCategory: HabitCategoryPayload }
  | { readonly type: "goal_task_complete"; readonly userId: string; readonly goalCategory: GoalCategoryPayload }
  | { readonly type: "goal_completed"; readonly userId: string; readonly goalCategory: GoalCategoryPayload };

export type ApplyGamificationSuccess = {
  readonly leveledUp: boolean;
  readonly newLevel: number;
};

export type ApplyGamificationError = { readonly code: "USER_NOT_FOUND" };

export class ApplyInternalGamificationEventUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: GamificationEventInput): Promise<Result<ApplyGamificationSuccess, ApplyGamificationError>> {
    const user = await this.users.findById(input.userId);
    if (user === null) {
      return err({ code: "USER_NOT_FOUND" });
    }

    const prevLevel = computeLevelProgress(user.totalXp).level;
    let delta;
    switch (input.type) {
      case "habit_checkin":
        delta = deltasForHabitCheckin(input.habitCategory);
        break;
      case "goal_task_complete":
        delta = deltasForGoalTask(input.goalCategory);
        break;
      case "goal_completed":
        delta = deltasForGoalComplete(input.goalCategory);
        break;
    }

    const updated = user.withGamificationDelta(delta);
    await this.users.updateUser(updated);

    const newLevel = computeLevelProgress(updated.totalXp).level;
    return ok({
      leveledUp: newLevel > prevLevel,
      newLevel,
    });
  }
}
