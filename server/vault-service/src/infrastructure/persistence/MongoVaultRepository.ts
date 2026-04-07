import type { IVaultRepository } from "../../domain/repositories/IVaultRepository.js";
import { VaultNote } from "../../domain/entities/VaultNote.js";
import type { NoteType } from "../../domain/entities/VaultNote.js";
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

export class MongoVaultRepository implements IVaultRepository {
  async save(note: VaultNote): Promise<void> {
    await VaultNoteModel.create({
      _id: note.id,
      userId: note.userId,
      title: note.title,
      content: note.content,
      type: note.type,
      goalId: note.goalId,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    });
  }

  async findById(id: string): Promise<VaultNote | null> {
    const doc = await VaultNoteModel.findById(id).lean().exec();
    if (doc === null) return null;
    if (!isPersisted(doc)) throw new Error("Unexpected vault note document shape");
    return this.toDomain(doc);
  }

  async findByUserId(userId: string): Promise<VaultNote[]> {
    const docs = await VaultNoteModel.find({ userId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const notes: VaultNote[] = [];
    for (const doc of docs) {
      if (!isPersisted(doc)) throw new Error("Unexpected vault note document shape");
      notes.push(this.toDomain(doc));
    }
    return notes;
  }

  async findByGoalId(userId: string, goalId: string): Promise<VaultNote[]> {
    const docs = await VaultNoteModel.find({ userId, goalId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const notes: VaultNote[] = [];
    for (const doc of docs) {
      if (!isPersisted(doc)) throw new Error("Unexpected vault note document shape");
      notes.push(this.toDomain(doc));
    }
    return notes;
  }

  async delete(id: string): Promise<void> {
    await VaultNoteModel.deleteOne({ _id: id }).exec();
  }

  private toDomain(doc: PersistedVaultNote): VaultNote {
    const result = VaultNote.create({
      id: doc._id,
      userId: doc.userId,
      title: doc.title,
      content: doc.content,
      type: doc.type as NoteType,
      goalId: doc.goalId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
    if (!result.ok) throw new Error(`Invalid vault note persisted: ${result.error.code}`);
    return result.note;
  }
}
