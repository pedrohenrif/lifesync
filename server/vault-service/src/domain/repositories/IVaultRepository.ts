import type { VaultNote } from "../entities/VaultNote.js";

export interface IVaultRepository {
  save(note: VaultNote): Promise<void>;
  findById(id: string): Promise<VaultNote | null>;
  findByUserId(userId: string): Promise<VaultNote[]>;
  findByGoalId(userId: string, goalId: string): Promise<VaultNote[]>;
  delete(id: string): Promise<void>;
}
