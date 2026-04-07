export const MOODS = ["TERRIBLE", "BAD", "NEUTRAL", "GOOD", "EXCELLENT"] as const;
export type Mood = (typeof MOODS)[number];

export interface JournalEntryProps {
  readonly id: string;
  readonly userId: string;
  readonly date: string;
  readonly mood: Mood;
  readonly note: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type JournalEntryValidationError =
  | { readonly code: "USER_ID_REQUIRED" }
  | { readonly code: "INVALID_DATE" }
  | { readonly code: "INVALID_MOOD" };

export type CreateJournalEntryResult =
  | { readonly ok: true; readonly entry: JournalEntry }
  | { readonly ok: false; readonly error: JournalEntryValidationError };

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidMood(value: string): value is Mood {
  return (MOODS as readonly string[]).includes(value);
}

export class JournalEntry {
  private constructor(private readonly props: JournalEntryProps) {}

  static create(props: JournalEntryProps): CreateJournalEntryResult {
    if (props.userId.trim().length === 0) {
      return { ok: false, error: { code: "USER_ID_REQUIRED" } };
    }
    if (!DATE_REGEX.test(props.date) || Number.isNaN(new Date(props.date).getTime())) {
      return { ok: false, error: { code: "INVALID_DATE" } };
    }
    if (!isValidMood(props.mood)) {
      return { ok: false, error: { code: "INVALID_MOOD" } };
    }

    return {
      ok: true,
      entry: new JournalEntry({
        ...props,
        note: props.note?.trim() ?? null,
      }),
    };
  }

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get date(): string { return this.props.date; }
  get mood(): Mood { return this.props.mood; }
  get note(): string | null { return this.props.note; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
}
