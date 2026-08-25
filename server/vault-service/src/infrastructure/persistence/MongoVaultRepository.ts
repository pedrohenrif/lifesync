import type {
  IVaultRepository,
  TagCount,
  VaultNoteFilter,
} from "../../domain/repositories/IVaultRepository.js";
import { VaultNote } from "../../domain/entities/VaultNote.js";
import type {
  NoteCategory,
  NoteStage,
  NoteType,
} from "../../domain/entities/VaultNote.js";
import {
  buildPaginated,
  toSkip,
  type Paginated,
  type PaginationParams,
} from "../../domain/pagination.js";
import {
  VaultNoteModel,
  type PersistedVaultNote,
} from "./mongoose/VaultNoteSchema.js";

function isPersisted(value: unknown): value is PersistedVaultNote {
  if (value === null || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o._id === "string" &&
    typeof o.userId === "string" &&
    typeof o.title === "string" &&
    typeof o.content === "string" &&
    typeof o.type === "string" &&
    o.createdAt instanceof Date &&
    o.updatedAt instanceof Date
  );
}

function toDocument(note: VaultNote) {
  return {
    userId: note.userId,
    title: note.title,
    content: note.content,
    summary: note.summary,
    type: note.type,
    category: note.category,
    stage: note.stage,
    tags: [...note.tags],
    sourceUrl: note.sourceUrl,
    isFavorite: note.isFavorite,
    isArchived: note.isArchived,
    goalId: note.goalId,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

function buildQuery(userId: string, filter?: VaultNoteFilter): Record<string, unknown> {
  const query: Record<string, unknown> = { userId };

  if (filter === undefined) {
    query.isArchived = { $ne: true };
    return query;
  }

  if (filter.includeArchived !== true) {
    query.isArchived = { $ne: true };
  }
  if (filter.type !== undefined) {
    query.type = filter.type;
  }
  if (filter.category !== undefined) {
    query.category = filter.category;
  }
  if (filter.stage !== undefined) {
    query.stage = filter.stage;
  }
  if (filter.tags !== undefined && filter.tags.length > 0) {
    query.tags = { $all: [...filter.tags] };
  }
  if (filter.goalId !== undefined) {
    query.goalId = filter.goalId;
  }
  if (filter.onlyFavorites === true) {
    query.isFavorite = true;
  }
  if (filter.search !== undefined && filter.search.trim().length > 0) {
    query.$text = { $search: filter.search.trim() };
  }

  return query;
}

export class MongoVaultRepository implements IVaultRepository {
  async save(note: VaultNote): Promise<void> {
    await VaultNoteModel.create({ _id: note.id, ...toDocument(note) });
  }

  async update(note: VaultNote): Promise<void> {
    await VaultNoteModel.updateOne({ _id: note.id }, { $set: toDocument(note) }).exec();
  }

  async findById(id: string): Promise<VaultNote | null> {
    const doc = await VaultNoteModel.findById(id).lean().exec();
    if (doc === null) return null;
    if (!isPersisted(doc)) throw new Error("Unexpected vault note document shape");
    return this.toDomain(doc);
  }

  async findByUserId(
    userId: string,
    pagination: PaginationParams,
    filter?: VaultNoteFilter,
  ): Promise<Paginated<VaultNote>> {
    return this.findPage(buildQuery(userId, filter), pagination, filter?.search);
  }

  async findByGoalId(
    userId: string,
    goalId: string,
    pagination: PaginationParams,
  ): Promise<Paginated<VaultNote>> {
    return this.findPage({ userId, goalId }, pagination);
  }

  async countTagsByUserId(userId: string): Promise<readonly TagCount[]> {
    const rows = await VaultNoteModel.aggregate<{ _id: unknown; count: unknown }>([
      { $match: { userId, isArchived: { $ne: true } } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 50 },
    ]).exec();

    const tags: TagCount[] = [];
    for (const row of rows) {
      if (typeof row._id === "string" && typeof row.count === "number") {
        tags.push({ tag: row._id, count: row.count });
      }
    }
    return tags;
  }

  async delete(id: string): Promise<void> {
    await VaultNoteModel.deleteOne({ _id: id }).exec();
  }

  private async findPage(
    query: Record<string, unknown>,
    pagination: PaginationParams,
    search?: string,
  ): Promise<Paginated<VaultNote>> {
    // Com busca textual a ordenação por relevância é mais útil que a cronológica.
    const isTextSearch = search !== undefined && search.trim().length > 0;
    const sort: Record<string, 1 | -1 | { $meta: "textScore" }> = isTextSearch
      ? { score: { $meta: "textScore" } }
      : { createdAt: -1 };

    const baseQuery = VaultNoteModel.find(query);
    if (isTextSearch) {
      baseQuery.select({ score: { $meta: "textScore" } });
    }

    const [docs, total] = await Promise.all([
      baseQuery
        .sort(sort)
        .skip(toSkip(pagination))
        .limit(pagination.pageSize)
        .lean()
        .exec(),
      VaultNoteModel.countDocuments(query).exec(),
    ]);

    const notes: VaultNote[] = [];
    for (const doc of docs) {
      if (!isPersisted(doc)) throw new Error("Unexpected vault note document shape");
      notes.push(this.toDomain(doc));
    }
    return buildPaginated(notes, total, pagination);
  }

  /** Notas criadas antes da expansão do cofre não têm os campos novos; aplicamos os padrões aqui. */
  private toDomain(doc: PersistedVaultNote): VaultNote {
    const tags = Array.isArray(doc.tags)
      ? doc.tags.filter((t): t is string => typeof t === "string")
      : [];

    const result = VaultNote.create({
      id: doc._id,
      userId: doc.userId,
      title: doc.title,
      content: doc.content,
      summary: doc.summary ?? null,
      type: doc.type as NoteType,
      category: (doc.category ?? "IDEA") as NoteCategory,
      stage: (doc.stage ?? "SEED") as NoteStage,
      tags,
      sourceUrl: doc.sourceUrl ?? null,
      isFavorite: doc.isFavorite ?? false,
      isArchived: doc.isArchived ?? false,
      goalId: doc.goalId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
    if (!result.ok) throw new Error(`Invalid vault note persisted: ${result.error.code}`);
    return result.note;
  }
}
