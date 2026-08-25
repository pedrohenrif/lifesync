import { ok, type Result } from "../result.js";
import type { IVaultRepository } from "../../domain/repositories/IVaultRepository.js";
import type { VaultNote } from "../../domain/entities/VaultNote.js";
import {
  mapPaginated,
  type Paginated,
  type PaginationParams,
} from "../../domain/pagination.js";

export type NoteSummary = {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly content: string;
  readonly type: string;
  readonly goalId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type GetNotesSuccess = Paginated<NoteSummary>;

function toSummary(note: VaultNote): NoteSummary {
  return {
    id: note.id,
    userId: note.userId,
    title: note.title,
    content: note.content,
    type: note.type,
    goalId: note.goalId,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

export class GetNotesByUserUseCase {
  constructor(private readonly vault: IVaultRepository) {}

  async execute(
    userId: string,
    pagination: PaginationParams,
  ): Promise<Result<GetNotesSuccess, never>> {
    const page = await this.vault.findByUserId(userId, pagination);
    return ok(mapPaginated(page, toSummary));
  }
}
