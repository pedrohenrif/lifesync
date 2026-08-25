import type {
  NoteCategory,
  NoteStage,
  NoteType,
  VaultNote,
} from "../entities/VaultNote.js";
import type { Paginated, PaginationParams } from "../pagination.js";

export type VaultNoteFilter = {
  /** Busca textual em título, resumo e conteúdo. */
  readonly search?: string;
  readonly type?: NoteType;
  readonly category?: NoteCategory;
  readonly stage?: NoteStage;
  /** A nota precisa conter todas as tags informadas. */
  readonly tags?: readonly string[];
  readonly goalId?: string;
  readonly onlyFavorites?: boolean;
  /** Por padrão as notas arquivadas ficam fora da listagem. */
  readonly includeArchived?: boolean;
};

export type TagCount = {
  readonly tag: string;
  readonly count: number;
};

export interface IVaultRepository {
  save(note: VaultNote): Promise<void>;
  update(note: VaultNote): Promise<void>;
  findById(id: string): Promise<VaultNote | null>;
  findByUserId(
    userId: string,
    pagination: PaginationParams,
    filter?: VaultNoteFilter,
  ): Promise<Paginated<VaultNote>>;
  findByGoalId(
    userId: string,
    goalId: string,
    pagination: PaginationParams,
  ): Promise<Paginated<VaultNote>>;
  /** Tags do usuário com a contagem de uso, para montar os filtros da UI. */
  countTagsByUserId(userId: string): Promise<readonly TagCount[]>;
  delete(id: string): Promise<void>;
}
