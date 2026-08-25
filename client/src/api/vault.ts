import { apiRequest } from "./client";
import {
  buildPageQuery,
  readPaginationMeta,
  type Page,
  type PageRequest,
} from "./pagination";

export const NOTE_TYPES = ["NOTE", "LINK", "SNIPPET", "CHECKLIST"] as const;
export type NoteType = (typeof NOTE_TYPES)[number];

export const NOTE_CATEGORIES = [
  "IDEA",
  "REFERENCE",
  "LEARNING",
  "PROJECT",
  "INSPIRATION",
  "OTHER",
] as const;
export type NoteCategory = (typeof NOTE_CATEGORIES)[number];

export const NOTE_STAGES = ["SEED", "EXPLORING", "VALIDATED", "DONE", "DISCARDED"] as const;
export type NoteStage = (typeof NOTE_STAGES)[number];

export const MAX_TAGS_PER_NOTE = 10;

export type VaultNote = {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly content: string;
  readonly summary: string | null;
  readonly type: NoteType;
  readonly category: NoteCategory;
  readonly stage: NoteStage;
  readonly tags: readonly string[];
  readonly sourceUrl: string | null;
  readonly isFavorite: boolean;
  readonly isArchived: boolean;
  readonly goalId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CreateNoteInput = {
  readonly title: string;
  readonly content: string;
  readonly type: NoteType;
  readonly category?: NoteCategory;
  readonly stage?: NoteStage;
  readonly summary?: string;
  readonly tags?: readonly string[];
  readonly sourceUrl?: string;
  readonly isFavorite?: boolean;
  readonly goalId?: string;
};

export type UpdateNoteInput = {
  readonly title?: string;
  readonly content?: string;
  readonly type?: NoteType;
  readonly category?: NoteCategory;
  readonly stage?: NoteStage;
  readonly summary?: string | null;
  readonly tags?: readonly string[];
  readonly sourceUrl?: string | null;
  readonly isFavorite?: boolean;
  readonly isArchived?: boolean;
  readonly goalId?: string | null;
};

export type VaultFilter = {
  readonly search?: string;
  readonly type?: NoteType;
  readonly category?: NoteCategory;
  readonly stage?: NoteStage;
  readonly tags?: readonly string[];
  readonly goalId?: string;
  readonly onlyFavorites?: boolean;
  readonly includeArchived?: boolean;
};

export type TagCount = {
  readonly tag: string;
  readonly count: number;
};

type NotesListResponse = { readonly notes: VaultNote[] };
type NoteResponse = { readonly note: VaultNote };
type TagsResponse = { readonly tags: TagCount[] };

export type NotesPage = Page<VaultNote>;

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

function booleanParam(value: boolean | undefined): string | undefined {
  return value === true ? "true" : undefined;
}

export async function getNotes(
  request: PageRequest = {},
  filter: VaultFilter = {},
): Promise<NotesPage> {
  const query = buildPageQuery(request, {
    search: filter.search !== undefined && filter.search.length > 0 ? filter.search : undefined,
    type: filter.type,
    category: filter.category,
    stage: filter.stage,
    goalId: filter.goalId,
    tags:
      filter.tags !== undefined && filter.tags.length > 0 ? filter.tags.join(",") : undefined,
    onlyFavorites: booleanParam(filter.onlyFavorites),
    includeArchived: booleanParam(filter.includeArchived),
  });

  const data = await vaultRequest<NotesListResponse>(`/vault${query}`);
  const items = data.notes ?? [];
  return { items, pagination: readPaginationMeta(data, items.length) };
}

export async function getVaultTags(): Promise<TagsResponse> {
  return vaultRequest<TagsResponse>("/vault/tags");
}

export async function createNote(input: CreateNoteInput): Promise<NoteResponse> {
  return vaultRequest<NoteResponse>("/vault", { method: "POST", body: input });
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<NoteResponse> {
  return vaultRequest<NoteResponse>(`/vault/${id}`, { method: "PATCH", body: input });
}

export async function deleteNote(id: string): Promise<void> {
  const response = await apiRequest(`/vault/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null);
    const code = extractErrorCode(data);
    throw new VaultApiError(response.status, code, `Erro: ${code}`);
  }
}
