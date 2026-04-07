import { ok, type Result } from "../result.js";
import type { IGoalRepository, GoalFilter } from "../../domain/repositories/IGoalRepository.js";
import { serializeGoalTasks, type SerializedGoalTask } from "./shared.js";

export type GoalSummary = {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly description: string | null;
  readonly status: string;
  readonly category: string;
  readonly tasks: readonly SerializedGoalTask[];
  readonly targetDate: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type ListUserGoalsSuccess = readonly GoalSummary[];

export class ListUserGoalsUseCase {
  constructor(private readonly goals: IGoalRepository) {}

  async execute(userId: string, filter?: GoalFilter): Promise<Result<ListUserGoalsSuccess, never>> {
    const goals = await this.goals.findAllByUserId(userId, filter);

    return ok(
      goals.map((goal) => ({
        id: goal.id,
        userId: goal.userId,
        title: goal.title,
        description: goal.description,
        status: goal.status,
        category: goal.category,
        tasks: serializeGoalTasks(goal.tasks),
        targetDate: goal.targetDate?.toISOString() ?? null,
        createdAt: goal.createdAt.toISOString(),
        updatedAt: goal.updatedAt.toISOString(),
      })),
    );
  }
}
