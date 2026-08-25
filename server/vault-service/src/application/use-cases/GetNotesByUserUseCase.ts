import { ok, type Result } from "../result.js";
import type {
  IVaultRepository,
  VaultNoteFilter,
} from "../../domain/repositories/IVaultRepository.js";
import {
  mapPaginated,
  type Paginated,
  type PaginationParams,
} from "../../domain/pagination.js";
import { toNoteSummary, type NoteSummary } from "./shared.js";

export type { NoteSummary };

export type GetNotesSuccess = Paginated<NoteSummary>;

export class GetNotesByUserUseCase {
  constructor(private readonly vault: IVaultRepository) {}

  async execute(
    userId: string,
    pagination: PaginationParams,
    filter?: VaultNoteFilter,
  ): Promise<Result<GetNotesSuccess, never>> {
    const page = await this.vault.findByUserId(userId, pagination, filter);
    return ok(mapPaginated(page, toNoteSummary));
  }
}
