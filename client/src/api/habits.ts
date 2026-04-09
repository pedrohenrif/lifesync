import { apiRequest } from "./client";
import { isHabitCategory, type HabitCategory } from "../lib/habitMeta";

export type HabitFrequencyType = "DAILY" | "WEEKLY_TARGET";

export type { HabitCategory };

export type Habit = {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly description: string | null;
  readonly icon: string;
  readonly category: HabitCategory;
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
  readonly icon?: string;
  readonly category?: HabitCategory;
  readonly frequencyType?: HabitFrequencyType;
  readonly targetDaysPerWeek?: number;
};

export type UpdateHabitInput = {
  readonly name?: string;
  readonly description?: string | null;
  readonly icon?: string;
  readonly category?: HabitCategory;
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

function normalizeHabit(o: Record<string, unknown>): Habit {
  const id = o.id;
  const userId = o.userId;
  const name = o.name;
  const frequencyType = o.frequencyType;
  const targetDaysPerWeek = o.targetDaysPerWeek;
  const completedDates = o.completedDates;
  const xp = o.xp;
  const level = o.level;
  const createdAt = o.createdAt;
  if (
    typeof id !== "string" ||
    typeof userId !== "string" ||
    typeof name !== "string" ||
    typeof frequencyType !== "string" ||
    typeof xp !== "number" ||
    typeof level !== "number" ||
    typeof createdAt !== "string"
  ) {
    throw new Error("Invalid habit payload");
  }
  const desc = o.description;
  const dates = Array.isArray(completedDates)
    ? completedDates.filter((d): d is string => typeof d === "string")
    : [];
  const iconRaw = o.icon;
  const icon =
    typeof iconRaw === "string" && iconRaw.trim().length > 0 ? iconRaw.trim() : "Activity";
  const catRaw = o.category;
  const category: HabitCategory = isHabitCategory(catRaw) ? catRaw : "PESSOAL";
  const streak =
    typeof o.currentStreak === "number" && Number.isFinite(o.currentStreak)
      ? o.currentStreak
      : 0;

  return {
    id,
    userId,
    name,
    description: desc === null || desc === undefined ? null : String(desc),
    icon,
    category,
    frequencyType: frequencyType as HabitFrequencyType,
    targetDaysPerWeek:
      targetDaysPerWeek === null || targetDaysPerWeek === undefined
        ? null
        : typeof targetDaysPerWeek === "number"
          ? targetDaysPerWeek
          : null,
    completedDates: dates,
    xp,
    level,
    currentStreak: streak,
    createdAt,
  };
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
  const data: unknown = await habitsRequest<unknown>("/habits");
  if (!isRecord(data) || !Array.isArray(data.habits)) {
    throw new HabitsApiError(500, "INVALID_RESPONSE", "Lista de hábitos inválida.");
  }
  const habits = data.habits
    .filter(isRecord)
    .map((h) => normalizeHabit(h));
  return { habits };
}

export async function createHabit(input: CreateHabitInput): Promise<HabitResponse> {
  const data: unknown = await habitsRequest<unknown>("/habits", {
    method: "POST",
    body: input,
  });
  if (!isRecord(data) || !isRecord(data.habit)) {
    throw new HabitsApiError(500, "INVALID_RESPONSE", "Hábito inválido.");
  }
  return { habit: normalizeHabit(data.habit) };
}

export async function updateHabit(id: string, input: UpdateHabitInput): Promise<HabitResponse> {
  const data: unknown = await habitsRequest<unknown>(`/habits/${id}`, {
    method: "PATCH",
    body: input,
  });
  if (!isRecord(data) || !isRecord(data.habit)) {
    throw new HabitsApiError(500, "INVALID_RESPONSE", "Hábito inválido.");
  }
  return { habit: normalizeHabit(data.habit) };
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
