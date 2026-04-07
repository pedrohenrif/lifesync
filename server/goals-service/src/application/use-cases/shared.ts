import type { GoalTask } from "../../domain/entities/Goal.js";

export type SerializedGoalTask = {
  readonly id: string;
  readonly title: string;
  readonly isCompleted: boolean;
  readonly createdAt: string;
};

export function serializeGoalTasks(tasks: readonly GoalTask[]): readonly SerializedGoalTask[] {
  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    isCompleted: t.isCompleted,
    createdAt: t.createdAt.toISOString(),
  }));
}
