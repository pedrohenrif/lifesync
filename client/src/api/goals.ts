import { apiRequest } from "./client";

export type GoalStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";
export type GoalCategory = "STUDY" | "PERSONAL" | "BUSINESS" | "FAMILY" | "DREAMS" | "OTHER";

export type GoalTask = {
  readonly id: string;
  readonly title: string;
  readonly isCompleted: boolean;
  readonly createdAt: string;
};

export type Goal = {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly description: string | null;
  readonly status: GoalStatus;
  readonly category: GoalCategory;
  readonly tasks: readonly GoalTask[];
  readonly targetDate: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CreateGoalInput = {
  readonly title: string;
  readonly description?: string;
  readonly category: GoalCategory;
  readonly targetDate?: string;
};

export type UpdateGoalInput = {
  readonly title?: string;
  readonly description?: string | null;
  readonly status?: GoalStatus;
  readonly category?: GoalCategory;
  readonly targetDate?: string | null;
};

type GoalsListResponse = { readonly goals: Goal[] };
type GoalResponse = { readonly goal: Goal };
type TasksResponse = { readonly tasks: readonly GoalTask[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export class GoalsApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "GoalsApiError";
    this.status = status;
    this.code = code;
  }
}

function extractErrorCode(data: unknown): string {
  if (!isRecord(data)) return "UNKNOWN_ERROR";
  const err = data.error;
  if (!isRecord(err)) return "UNKNOWN_ERROR";
  return typeof err.code === "string" ? err.code : "UNKNOWN_ERROR";
}

async function goalsRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await apiRequest(path, options);
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const code = extractErrorCode(data);
    throw new GoalsApiError(response.status, code, `Erro: ${code}`);
  }

  return data as T;
}

export async function getGoals(category?: GoalCategory): Promise<GoalsListResponse> {
  const query = category !== undefined ? `?category=${category}` : "";
  return goalsRequest<GoalsListResponse>(`/goals${query}`);
}

export async function createGoal(input: CreateGoalInput): Promise<GoalResponse> {
  return goalsRequest<GoalResponse>("/goals", { method: "POST", body: input });
}

export async function updateGoal(id: string, input: UpdateGoalInput): Promise<GoalResponse> {
  return goalsRequest<GoalResponse>(`/goals/${id}`, { method: "PATCH", body: input });
}

export async function deleteGoal(id: string): Promise<void> {
  const response = await apiRequest(`/goals/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null);
    const code = extractErrorCode(data);
    throw new GoalsApiError(response.status, code, `Erro: ${code}`);
  }
}

export async function addGoalTask(goalId: string, title: string): Promise<TasksResponse> {
  return goalsRequest<TasksResponse>(`/goals/${goalId}/tasks`, { method: "POST", body: { title } });
}

export async function toggleGoalTask(goalId: string, taskId: string): Promise<TasksResponse> {
  return goalsRequest<TasksResponse>(`/goals/${goalId}/tasks/${taskId}/toggle`, { method: "PATCH" });
}

export async function removeGoalTask(goalId: string, taskId: string): Promise<TasksResponse> {
  return goalsRequest<TasksResponse>(`/goals/${goalId}/tasks/${taskId}`, { method: "DELETE" });
}
