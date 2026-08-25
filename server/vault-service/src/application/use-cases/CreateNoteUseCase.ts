import { randomUUID } from "node:crypto";
import { err, ok, type Result } from "../result.js";
import { VaultNote } from "../../domain/entities/VaultNote.js";
import type {
  NoteCategory,
  NoteStage,
  NoteType,
  VaultNoteValidationError,
} from "../../domain/entities/VaultNote.js";
import type { IVaultRepository } from "../../domain/repositories/IVaultRepository.js";
import { toNoteSummary, type NoteSummary } from "./shared.js";

export type CreateNoteDto = {
  readonly title: string;
  readonly content: string;
  readonly type: string;
  readonly category?: string;
  readonly stage?: string;
  readonly summary?: string;
  readonly tags?: readonly string[];
  readonly sourceUrl?: string;
  readonly isFavorite?: boolean;
  readonly goalId?: string;
};

export type CreateNoteSuccess = NoteSummary;

export type CreateNoteError = VaultNoteValidationError;

export class CreateNoteUseCase {
  constructor(private readonly vault: IVaultRepository) {}

  async execute(
    userId: string,
    dto: CreateNoteDto,
  ): Promise<Result<CreateNoteSuccess, CreateNoteError>> {
    const now = new Date();

    const result = VaultNote.create({
      id: randomUUID(),
      userId,
      title: dto.title,
      content: dto.content,
      summary: dto.summary ?? null,
      type: dto.type as NoteType,
      category: (dto.category ?? "IDEA") as NoteCategory,
      stage: (dto.stage ?? "SEED") as NoteStage,
      tags: dto.tags ?? [],
      sourceUrl: dto.sourceUrl ?? null,
      isFavorite: dto.isFavorite ?? false,
      isArchived: false,
      goalId: dto.goalId?.trim() ?? null,
      createdAt: now,
      updatedAt: now,
    });

    if (!result.ok) return err(result.error);

    await this.vault.save(result.note);
    return ok(toNoteSummary(result.note));
  }
}
