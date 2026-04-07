import { randomUUID } from "node:crypto";
import { err, ok, type Result } from "../result.js";
import { VaultNote } from "../../domain/entities/VaultNote.js";
import type { VaultNoteValidationError, NoteType } from "../../domain/entities/VaultNote.js";
import type { IVaultRepository } from "../../domain/repositories/IVaultRepository.js";

export type CreateNoteDto = {
  readonly title: string;
  readonly content: string;
  readonly type: string;
  readonly goalId?: string;
};

export type CreateNoteSuccess = {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly content: string;
  readonly type: string;
  readonly goalId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

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
      type: dto.type as NoteType,
      goalId: dto.goalId?.trim() ?? null,
      createdAt: now,
      updatedAt: now,
    });

    if (!result.ok) return err(result.error);

    const note = result.note;
    await this.vault.save(note);

    return ok({
      id: note.id,
      userId: note.userId,
      title: note.title,
      content: note.content,
      type: note.type,
      goalId: note.goalId,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    });
  }
}
