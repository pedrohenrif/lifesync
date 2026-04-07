import { err, ok, type Result } from "../result.js";
import type { IVaultRepository } from "../../domain/repositories/IVaultRepository.js";

export type DeleteNoteError =
  | { readonly code: "NOTE_NOT_FOUND" }
  | { readonly code: "FORBIDDEN" };

export class DeleteNoteUseCase {
  constructor(private readonly vault: IVaultRepository) {}

  async execute(
    noteId: string,
    userId: string,
  ): Promise<Result<null, DeleteNoteError>> {
    const existing = await this.vault.findById(noteId);
    if (existing === null) return err({ code: "NOTE_NOT_FOUND" });
    if (existing.userId !== userId) return err({ code: "FORBIDDEN" });

    await this.vault.delete(noteId);
    return ok(null);
  }
}
