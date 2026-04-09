import { err, ok, type Result } from "../result.js";
import type { UpdateGoalDto } from "../dtos/UpdateGoalDto.js";
import { Goal, GOAL_STATUSES, GOAL_CATEGORIES } from "../../domain/entities/Goal.js";
import type { GoalStatus, GoalCategory, GoalValidationError } from "../../domain/entities/Goal.js";
import type { IGoalRepository } from "../../domain/repositories/IGoalRepository.js";
import { serializeGoalTasks, type SerializedGoalTask } from "./shared.js";

export type GoalCompleteGamificationNotifier = {
  notifyGoalCompleted(userId: string, goalCategory: GoalCategory): Promise<void>;
};

export type UpdateGoalSuccess = {
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

export type UpdateGoalError =
  | GoalValidationError
  | { readonly code: "GOAL_NOT_FOUND" }
  | { readonly code: "FORBIDDEN" }
  | { readonly code: "INVALID_STATUS" }
  | { readonly code: "INVALID_CATEGORY" }
  | { readonly code: "INVALID_TARGET_DATE" };

export class UpdateGoalUseCase {
  constructor(
    private readonly goals: IGoalRepository,
    private readonly gamification: GoalCompleteGamificationNotifier | null,
  ) {}

  async execute(
    goalId: string,
    userId: string,
    dto: UpdateGoalDto,
  ): Promise<Result<UpdateGoalSuccess, UpdateGoalError>> {
    const existing = await this.goals.findById(goalId);
    if (existing === null) return err({ code: "GOAL_NOT_FOUND" });
    if (existing.userId !== userId) return err({ code: "FORBIDDEN" });

    let newStatus: GoalStatus = existing.status;
    if (dto.status !== undefined) {
      if (!(GOAL_STATUSES as readonly string[]).includes(dto.status)) {
        return err({ code: "INVALID_STATUS" });
      }
      newStatus = dto.status as GoalStatus;
    }

    let newCategory: GoalCategory = existing.category;
    if (dto.category !== undefined) {
      if (!(GOAL_CATEGORIES as readonly string[]).includes(dto.category)) {
        return err({ code: "INVALID_CATEGORY" });
      }
      newCategory = dto.category as GoalCategory;
    }

    let newTargetDate: Date | null = existing.targetDate;
    if (dto.targetDate !== undefined) {
      if (dto.targetDate === null) {
        newTargetDate = null;
      } else {
        const parsed = new Date(dto.targetDate);
        if (Number.isNaN(parsed.getTime())) {
          return err({ code: "INVALID_TARGET_DATE" });
        }
        newTargetDate = parsed;
      }
    }

    const result = Goal.create({
      id: existing.id,
      userId: existing.userId,
      title: dto.title ?? existing.title,
      description: dto.description !== undefined ? dto.description : existing.description,
      status: newStatus,
      category: newCategory,
      tasks: [...existing.tasks],
      targetDate: newTargetDate,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });

    if (!result.ok) return err(result.error);

    const updated = result.goal;
    await this.goals.update(updated);

    if (
      this.gamification !== null &&
      newStatus === "COMPLETED" &&
      existing.status !== "COMPLETED"
    ) {
      void this.gamification.notifyGoalCompleted(existing.userId, existing.category).catch(() => undefined);
    }

    return ok({
      id: updated.id,
      userId: updated.userId,
      title: updated.title,
      description: updated.description,
      status: updated.status,
      category: updated.category,
      tasks: serializeGoalTasks(updated.tasks),
      targetDate: updated.targetDate?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  }
}
