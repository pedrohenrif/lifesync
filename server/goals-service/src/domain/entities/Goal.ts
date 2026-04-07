import { randomUUID } from "node:crypto";

export const GOAL_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED"] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const GOAL_CATEGORIES = ["STUDY", "PERSONAL", "BUSINESS", "FAMILY", "DREAMS", "OTHER"] as const;
export type GoalCategory = (typeof GOAL_CATEGORIES)[number];

export type GoalTask = {
  readonly id: string;
  readonly title: string;
  readonly isCompleted: boolean;
  readonly createdAt: Date;
};

export interface GoalProps {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly description: string | null;
  readonly status: GoalStatus;
  readonly category: GoalCategory;
  readonly tasks: readonly GoalTask[];
  readonly targetDate: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type GoalValidationError =
  | { readonly code: "TITLE_REQUIRED" }
  | { readonly code: "USER_ID_REQUIRED" }
  | { readonly code: "INVALID_STATUS" }
  | { readonly code: "INVALID_CATEGORY" };

export type CreateGoalResult =
  | { readonly ok: true; readonly goal: Goal }
  | { readonly ok: false; readonly error: GoalValidationError };

export type GoalTaskError =
  | { readonly code: "TASK_NOT_FOUND" }
  | { readonly code: "TASK_TITLE_REQUIRED" };

export type GoalTaskResult =
  | { readonly ok: true; readonly goal: Goal }
  | { readonly ok: false; readonly error: GoalTaskError };

function isValidStatus(value: string): value is GoalStatus {
  return (GOAL_STATUSES as readonly string[]).includes(value);
}

function isValidCategory(value: string): value is GoalCategory {
  return (GOAL_CATEGORIES as readonly string[]).includes(value);
}

export class Goal {
  private constructor(private readonly props: GoalProps) {}

  static create(props: GoalProps): CreateGoalResult {
    if (props.userId.trim().length === 0) {
      return { ok: false, error: { code: "USER_ID_REQUIRED" } };
    }
    if (props.title.trim().length === 0) {
      return { ok: false, error: { code: "TITLE_REQUIRED" } };
    }
    if (!isValidStatus(props.status)) {
      return { ok: false, error: { code: "INVALID_STATUS" } };
    }
    if (!isValidCategory(props.category)) {
      return { ok: false, error: { code: "INVALID_CATEGORY" } };
    }

    return {
      ok: true,
      goal: new Goal({
        ...props,
        title: props.title.trim(),
        description: props.description?.trim() ?? null,
      }),
    };
  }

  /* ─── Domain Methods: Tasks ─── */

  addTask(title: string): GoalTaskResult {
    if (title.trim().length === 0) {
      return { ok: false, error: { code: "TASK_TITLE_REQUIRED" } };
    }

    const task: GoalTask = {
      id: randomUUID(),
      title: title.trim(),
      isCompleted: false,
      createdAt: new Date(),
    };

    const result = Goal.create({
      ...this.props,
      tasks: [...this.props.tasks, task],
      updatedAt: new Date(),
    });

    if (!result.ok) throw new Error(`Unexpected validation error: ${result.error.code}`);
    return { ok: true, goal: result.goal };
  }

  toggleTask(taskId: string): GoalTaskResult {
    const idx = this.props.tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) return { ok: false, error: { code: "TASK_NOT_FOUND" } };

    const task = this.props.tasks[idx];
    const updatedTasks = this.props.tasks.map((t, i) =>
      i === idx ? { ...t, isCompleted: !task.isCompleted } : t,
    );

    const result = Goal.create({
      ...this.props,
      tasks: updatedTasks,
      updatedAt: new Date(),
    });

    if (!result.ok) throw new Error(`Unexpected validation error: ${result.error.code}`);
    return { ok: true, goal: result.goal };
  }

  removeTask(taskId: string): GoalTaskResult {
    const exists = this.props.tasks.some((t) => t.id === taskId);
    if (!exists) return { ok: false, error: { code: "TASK_NOT_FOUND" } };

    const result = Goal.create({
      ...this.props,
      tasks: this.props.tasks.filter((t) => t.id !== taskId),
      updatedAt: new Date(),
    });

    if (!result.ok) throw new Error(`Unexpected validation error: ${result.error.code}`);
    return { ok: true, goal: result.goal };
  }

  /* ─── Getters ─── */

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get title(): string { return this.props.title; }
  get description(): string | null { return this.props.description; }
  get status(): GoalStatus { return this.props.status; }
  get category(): GoalCategory { return this.props.category; }
  get tasks(): readonly GoalTask[] { return this.props.tasks; }
  get targetDate(): Date | null { return this.props.targetDate; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
}
