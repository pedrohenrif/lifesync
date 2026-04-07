export const NOTE_TYPES = ["NOTE", "LINK"] as const;
export type NoteType = (typeof NOTE_TYPES)[number];

export interface VaultNoteProps {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly content: string;
  readonly type: NoteType;
  readonly goalId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type VaultNoteValidationError =
  | { readonly code: "USER_ID_REQUIRED" }
  | { readonly code: "TITLE_REQUIRED" }
  | { readonly code: "CONTENT_REQUIRED" }
  | { readonly code: "INVALID_TYPE" };

export type CreateVaultNoteResult =
  | { readonly ok: true; readonly note: VaultNote }
  | { readonly ok: false; readonly error: VaultNoteValidationError };

function isValidType(value: string): value is NoteType {
  return (NOTE_TYPES as readonly string[]).includes(value);
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

    return {
      ok: true,
      note: new VaultNote({
        ...props,
        title: props.title.trim(),
        content: props.content.trim(),
      }),
    };
  }

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get title(): string { return this.props.title; }
  get content(): string { return this.props.content; }
  get type(): NoteType { return this.props.type; }
  get goalId(): string | null { return this.props.goalId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
}
