import type { VaultNote } from "../../domain/entities/VaultNote.js";

export type NoteSummary = {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly content: string;
  readonly summary: string | null;
  readonly type: string;
  readonly category: string;
  readonly stage: string;
  readonly tags: readonly string[];
  readonly sourceUrl: string | null;
  readonly isFavorite: boolean;
  readonly isArchived: boolean;
  readonly goalId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export function toNoteSummary(note: VaultNote): NoteSummary {
  return {
    id: note.id,
    userId: note.userId,
    title: note.title,
    content: note.content,
    summary: note.summary,
    type: note.type,
    category: note.category,
    stage: note.stage,
    tags: [...note.tags],
    sourceUrl: note.sourceUrl,
    isFavorite: note.isFavorite,
    isArchived: note.isArchived,
    goalId: note.goalId,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}
