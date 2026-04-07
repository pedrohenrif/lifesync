import { apiRequest } from "./client";

export type NoteType = "NOTE" | "LINK";

export type VaultNote = {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly content: string;
  readonly type: NoteType;
  readonly goalId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CreateNoteInput = {
  readonly title: string;
  readonly content: string;
  readonly type: NoteType;
  readonly goalId?: string;
};

type NotesListResponse = { readonly notes: VaultNote[] };
type NoteResponse = { readonly note: VaultNote };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export class VaultApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "VaultApiError";
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

async function vaultRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await apiRequest(path, options);
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const code = extractErrorCode(data);
    throw new VaultApiError(response.status, code, `Erro: ${code}`);
  }

  return data as T;
}

export async function getNotes(): Promise<NotesListResponse> {
  return vaultRequest<NotesListResponse>("/vault");
}

export async function createNote(input: CreateNoteInput): Promise<NoteResponse> {
  return vaultRequest<NoteResponse>("/vault", { method: "POST", body: input });
}

export async function deleteNote(id: string): Promise<void> {
  const response = await apiRequest(`/vault/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null);
    const code = extractErrorCode(data);
    throw new VaultApiError(response.status, code, `Erro: ${code}`);
  }
}
