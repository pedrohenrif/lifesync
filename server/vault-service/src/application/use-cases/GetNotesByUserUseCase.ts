import { ok, type Result } from "../result.js";
import type { IVaultRepository } from "../../domain/repositories/IVaultRepository.js";

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

export type GetNotesSuccess = readonly NoteSummary[];

export class GetNotesByUserUseCase {
  constructor(private readonly vault: IVaultRepository) {}

  async execute(userId: string): Promise<Result<GetNotesSuccess, never>> {
    const notes = await this.vault.findByUserId(userId);

    return ok(
      notes.map((n) => ({
        id: n.id,
        userId: n.userId,
        title: n.title,
        content: n.content,
        type: n.type,
        goalId: n.goalId,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      })),
    );
  }
}
