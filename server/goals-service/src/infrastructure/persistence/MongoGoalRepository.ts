import type { IGoalRepository, GoalFilter } from "../../domain/repositories/IGoalRepository.js";
import { Goal } from "../../domain/entities/Goal.js";
import type { GoalStatus, GoalCategory, GoalTask } from "../../domain/entities/Goal.js";
import {
  GoalModel,
  type PersistedGoal,
} from "./mongoose/GoalSchema.js";

function isPersistedGoal(value: unknown): value is PersistedGoal {
  if (value === null || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o._id === "string" &&
    typeof o.userId === "string" &&
    typeof o.title === "string" &&
    typeof o.status === "string" &&
    typeof o.category === "string" &&
    Array.isArray(o.tasks) &&
    o.createdAt instanceof Date &&
    o.updatedAt instanceof Date
  );
}

function serializeTasks(tasks: readonly GoalTask[]) {
  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    isCompleted: t.isCompleted,
    createdAt: t.createdAt,
  }));
}

export class MongoGoalRepository implements IGoalRepository {
  async save(goal: Goal): Promise<void> {
    await GoalModel.create({
      _id: goal.id,
      userId: goal.userId,
      title: goal.title,
      description: goal.description,
      status: goal.status,
      category: goal.category,
      tasks: serializeTasks(goal.tasks),
      targetDate: goal.targetDate,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    });
  }

  async findById(id: string): Promise<Goal | null> {
    const doc = await GoalModel.findById(id).lean().exec();
    if (doc === null) return null;
    if (!isPersistedGoal(doc)) throw new Error("Unexpected goal document shape from persistence");
    return this.toDomain(doc);
  }

  async findAllByUserId(userId: string, filter?: GoalFilter): Promise<Goal[]> {
    const query: Record<string, unknown> = { userId };
    if (filter?.category !== undefined && filter.category.length > 0) {
      query.category = filter.category;
    }

    const docs = await GoalModel.find(query).lean().exec();
    const goals: Goal[] = [];
    for (const doc of docs) {
      if (!isPersistedGoal(doc)) throw new Error("Unexpected goal document shape from persistence");
      goals.push(this.toDomain(doc));
    }
    return goals;
  }

  async update(goal: Goal): Promise<void> {
    await GoalModel.updateOne(
      { _id: goal.id },
      {
        $set: {
          title: goal.title,
          description: goal.description,
          status: goal.status,
          category: goal.category,
          tasks: serializeTasks(goal.tasks),
          targetDate: goal.targetDate,
          updatedAt: goal.updatedAt,
        },
      },
    ).exec();
  }

  async delete(id: string): Promise<void> {
    await GoalModel.deleteOne({ _id: id }).exec();
  }

  private toDomain(doc: PersistedGoal): Goal {
    const tasks: GoalTask[] = (doc.tasks ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      isCompleted: t.isCompleted,
      createdAt: t.createdAt,
    }));

    const result = Goal.create({
      id: doc._id,
      userId: doc.userId,
      title: doc.title,
      description: doc.description,
      status: doc.status as GoalStatus,
      category: doc.category as GoalCategory,
      tasks,
      targetDate: doc.targetDate,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
    if (!result.ok) throw new Error(`Invalid goal persisted: ${result.error.code}`);
    return result.goal;
  }
}
