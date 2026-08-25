/** Formato do conteúdo da nota. */
export const NOTE_TYPES = ["NOTE", "LINK", "SNIPPET", "CHECKLIST"] as const;
export type NoteType = (typeof NOTE_TYPES)[number];

/** Assunto da nota — separa o cofre em áreas de conhecimento. */
export const NOTE_CATEGORIES = [
  "IDEA",
  "REFERENCE",
  "LEARNING",
  "PROJECT",
  "INSPIRATION",
  "OTHER",
] as const;
export type NoteCategory = (typeof NOTE_CATEGORIES)[number];

/** Maturidade da ideia: permite acompanhar a evolução em vez de só arquivar texto. */
export const NOTE_STAGES = ["SEED", "EXPLORING", "VALIDATED", "DONE", "DISCARDED"] as const;
export type NoteStage = (typeof NOTE_STAGES)[number];

export const MAX_TAGS_PER_NOTE = 10;
export const MAX_TAG_LENGTH = 24;

export interface VaultNoteProps {
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
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type VaultNoteValidationError =
  | { readonly code: "USER_ID_REQUIRED" }
  | { readonly code: "TITLE_REQUIRED" }
  | { readonly code: "CONTENT_REQUIRED" }
  | { readonly code: "INVALID_TYPE" }
  | { readonly code: "INVALID_CATEGORY" }
  | { readonly code: "INVALID_STAGE" }
  | { readonly code: "TOO_MANY_TAGS" };

export type CreateVaultNoteResult =
  | { readonly ok: true; readonly note: VaultNote }
  | { readonly ok: false; readonly error: VaultNoteValidationError };

/** Campos que o usuário pode alterar depois de criada a nota. */
export type VaultNoteChanges = {
  readonly title?: string;
  readonly content?: string;
  readonly summary?: string | null;
  readonly type?: NoteType;
  readonly category?: NoteCategory;
  readonly stage?: NoteStage;
  readonly tags?: readonly string[];
  readonly sourceUrl?: string | null;
  readonly isFavorite?: boolean;
  readonly isArchived?: boolean;
  readonly goalId?: string | null;
};

function isValidType(value: string): value is NoteType {
  return (NOTE_TYPES as readonly string[]).includes(value);
}

function isValidCategory(value: string): value is NoteCategory {
  return (NOTE_CATEGORIES as readonly string[]).includes(value);
}

function isValidStage(value: string): value is NoteStage {
  return (NOTE_STAGES as readonly string[]).includes(value);
}

/** Normaliza tags para minúsculas sem duplicatas, mantendo a busca previsível. */
export function normalizeTags(tags: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  for (const raw of tags) {
    const tag = raw.trim().toLowerCase().slice(0, MAX_TAG_LENGTH);
    if (tag.length > 0) {
      seen.add(tag);
    }
  }
  return [...seen];
}

function normalizeOptionalText(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export class VaultNote {
  private constructor(private readonly props: VaultNoteProps) {}

  static create(props: VaultNoteProps): CreateVaultNoteResult {
    if (props.userId.trim().length === 0) {
      return { ok: false, error: { code: "USER_ID_REQUIRED" } };
    }
    if (props.title.trim().length === 0) {
      return { ok: false, error: { code: "TITLE_REQUIRED" } };
    }
    if (props.content.trim().length === 0) {
      return { ok: false, error: { code: "CONTENT_REQUIRED" } };
    }
    if (!isValidType(props.type)) {
      return { ok: false, error: { code: "INVALID_TYPE" } };
    }
    if (!isValidCategory(props.category)) {
      return { ok: false, error: { code: "INVALID_CATEGORY" } };
    }
    if (!isValidStage(props.stage)) {
      return { ok: false, error: { code: "INVALID_STAGE" } };
    }

    const tags = normalizeTags(props.tags);
    if (tags.length > MAX_TAGS_PER_NOTE) {
      return { ok: false, error: { code: "TOO_MANY_TAGS" } };
    }

    return {
      ok: true,
      note: new VaultNote({
        ...props,
        title: props.title.trim(),
        content: props.content.trim(),
        summary: normalizeOptionalText(props.summary),
        sourceUrl: normalizeOptionalText(props.sourceUrl),
        tags,
      }),
    };
  }

  /** Reaplica as validações sobre os campos alterados, preservando o restante. */
  withChanges(changes: VaultNoteChanges, updatedAt: Date): CreateVaultNoteResult {
    return VaultNote.create({
      ...this.props,
      ...changes,
      updatedAt,
    });
  }

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get title(): string { return this.props.title; }
  get content(): string { return this.props.content; }
  get summary(): string | null { return this.props.summary; }
  get type(): NoteType { return this.props.type; }
  get category(): NoteCategory { return this.props.category; }
  get stage(): NoteStage { return this.props.stage; }
  get tags(): readonly string[] { return this.props.tags; }
  get sourceUrl(): string | null { return this.props.sourceUrl; }
  get isFavorite(): boolean { return this.props.isFavorite; }
  get isArchived(): boolean { return this.props.isArchived; }
  get goalId(): string | null { return this.props.goalId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
}
