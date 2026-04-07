import { apiRequest } from "./client";

export type HabitFrequencyType = "DAILY" | "WEEKLY_TARGET";

export type Habit = {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly description: string | null;
  readonly frequencyType: HabitFrequencyType;
  readonly targetDaysPerWeek: number | null;
  readonly completedDates: readonly string[];
  readonly xp: number;
  readonly level: number;
  readonly currentStreak: number;
  readonly createdAt: string;
};

export type CreateHabitInput = {
  readonly name: string;
  readonly description?: string;
  readonly frequencyType?: HabitFrequencyType;
  readonly targetDaysPerWeek?: number;
};

export type UpdateHabitInput = {
  readonly name?: string;
  readonly description?: string | null;
  readonly frequencyType?: HabitFrequencyType;
  readonly targetDaysPerWeek?: number | null;
};

type HabitsListResponse = { readonly habits: Habit[] };
type HabitResponse = { readonly habit: Habit };

export type HabitToggleResponse = {
  readonly habit: {
    readonly id: string;
    readonly completedDates: readonly string[];
    readonly currentStreak: number;
    readonly xp: number;
    readonly level: number;
    readonly levelUp: boolean;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export class HabitsApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "HabitsApiError";
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

async function habitsRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await apiRequest(path, options);
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const code = extractErrorCode(data);
    throw new HabitsApiError(response.status, code, `Erro: ${code}`);
  }

  return data as T;
}

export async function getHabits(): Promise<HabitsListResponse> {
  return habitsRequest<HabitsListResponse>("/habits");
}

export async function createHabit(input: CreateHabitInput): Promise<HabitResponse> {
  return habitsRequest<HabitResponse>("/habits", {
    method: "POST",
    body: input,
  });
}

export async function updateHabit(id: string, input: UpdateHabitInput): Promise<HabitResponse> {
  return habitsRequest<HabitResponse>(`/habits/${id}`, {
    method: "PATCH",
    body: input,
  });
}

export async function toggleHabit(id: string, date: string): Promise<HabitToggleResponse> {
  return habitsRequest<HabitToggleResponse>(`/habits/${id}/toggle`, {
    method: "PATCH",
    body: { date },
  });
}

export async function deleteHabit(id: string): Promise<void> {
  const response = await apiRequest(`/habits/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null);
    const code = extractErrorCode(data);
    throw new HabitsApiError(response.status, code, `Erro: ${code}`);
  }
}
