import { err, ok, type Result } from "../result.js";
import type {
  VaultNoteChanges,
  VaultNoteValidationError,
} from "../../domain/entities/VaultNote.js";
import type { IVaultRepository } from "../../domain/repositories/IVaultRepository.js";
import { toNoteSummary, type NoteSummary } from "./shared.js";

export type UpdateNoteDto = VaultNoteChanges;

export type UpdateNoteSuccess = NoteSummary;

export type UpdateNoteError =
  | { readonly code: "NOTE_NOT_FOUND" }
  | { readonly code: "FORBIDDEN" }
  | VaultNoteValidationError;

export class UpdateNoteUseCase {
  constructor(private readonly vault: IVaultRepository) {}

  async execute(
    noteId: string,
    userId: string,
    dto: UpdateNoteDto,
  ): Promise<Result<UpdateNoteSuccess, UpdateNoteError>> {
    const existing = await this.vault.findById(noteId);
    if (existing === null) return err({ code: "NOTE_NOT_FOUND" });
    if (existing.userId !== userId) return err({ code: "FORBIDDEN" });

    const result = existing.withChanges(dto, new Date());
    if (!result.ok) return err(result.error);

    await this.vault.update(result.note);
    return ok(toNoteSummary(result.note));
  }
}
