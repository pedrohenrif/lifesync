import { apiRequest } from "./client";

export type Mood = "TERRIBLE" | "BAD" | "NEUTRAL" | "GOOD" | "EXCELLENT";

export type JournalEntry = {
  readonly id: string;
  readonly date: string;
  readonly mood: Mood;
  readonly note: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly isNew?: boolean;
};

export type SaveJournalInput = {
  readonly date: string;
  readonly mood: Mood;
  readonly note?: string;
};

type EntryResponse = { readonly entry: JournalEntry | null };
type EntriesResponse = { readonly entries: JournalEntry[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export class JournalApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "JournalApiError";
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

async function journalRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await apiRequest(path, { ...options, service: "journal" });
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const code = extractErrorCode(data);
    throw new JournalApiError(response.status, code, `Erro: ${code}`);
  }

  return data as T;
}

export async function saveJournalEntry(input: SaveJournalInput): Promise<EntryResponse> {
  return journalRequest<EntryResponse>("/journal", { method: "POST", body: input });
}

export async function getTodayEntry(date: string): Promise<EntryResponse> {
  return journalRequest<EntryResponse>(`/journal/today?date=${date}`);
}

export async function getMonthlyJournal(year: number, month: number): Promise<EntriesResponse> {
  return journalRequest<EntriesResponse>(`/journal/month/${year}/${month}`);
}
