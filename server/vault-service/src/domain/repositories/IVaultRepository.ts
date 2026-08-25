import type { VaultNote } from "../entities/VaultNote.js";
import type { Paginated, PaginationParams } from "../pagination.js";

export interface IVaultRepository {
  save(note: VaultNote): Promise<void>;
  findById(id: string): Promise<VaultNote | null>;
  findByUserId(
    userId: string,
    pagination: PaginationParams,
  ): Promise<Paginated<VaultNote>>;
  findByGoalId(
    userId: string,
    goalId: string,
    pagination: PaginationParams,
  ): Promise<Paginated<VaultNote>>;
  delete(id: string): Promise<void>;
}
