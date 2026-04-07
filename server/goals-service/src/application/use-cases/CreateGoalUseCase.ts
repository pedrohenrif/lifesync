import { randomUUID } from "node:crypto";
import { err, ok, type Result } from "../result.js";
import type { CreateGoalDto } from "../dtos/CreateGoalDto.js";
import { Goal } from "../../domain/entities/Goal.js";
import type { GoalValidationError, GoalCategory } from "../../domain/entities/Goal.js";
import type { IGoalRepository } from "../../domain/repositories/IGoalRepository.js";

export type CreateGoalSuccess = {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly description: string | null;
  readonly status: string;
  readonly category: string;
  readonly tasks: readonly { id: string; title: string; isCompleted: boolean; createdAt: string }[];
  readonly targetDate: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CreateGoalError = GoalValidationError | { readonly code: "INVALID_TARGET_DATE" };

export class CreateGoalUseCase {
  constructor(private readonly goals: IGoalRepository) {}

  async execute(
    userId: string,
    dto: CreateGoalDto,
  ): Promise<Result<CreateGoalSuccess, CreateGoalError>> {
    const now = new Date();

    let targetDate: Date | null = null;
    if (dto.targetDate !== undefined && dto.targetDate.length > 0) {
      const parsed = new Date(dto.targetDate);
      if (Number.isNaN(parsed.getTime())) {
        return err({ code: "INVALID_TARGET_DATE" });
      }
      targetDate = parsed;
    }

    const result = Goal.create({
      id: randomUUID(),
      userId,
      title: dto.title,
      description: dto.description?.trim() ?? null,
      status: "PENDING",
      category: dto.category as GoalCategory,
      tasks: [],
      targetDate,
      createdAt: now,
      updatedAt: now,
    });

    if (!result.ok) return err(result.error);

    const goal = result.goal;
    await this.goals.save(goal);

    return ok({
      id: goal.id,
      userId: goal.userId,
      title: goal.title,
      description: goal.description,
      status: goal.status,
      category: goal.category,
      tasks: [],
      targetDate: goal.targetDate?.toISOString() ?? null,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
    });
  }
}
