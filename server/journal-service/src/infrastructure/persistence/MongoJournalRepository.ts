import type { IJournalRepository } from "../../domain/repositories/IJournalRepository.js";
import { JournalEntry } from "../../domain/entities/JournalEntry.js";
import type { Mood } from "../../domain/entities/JournalEntry.js";
import {
  JournalEntryModel,
  type PersistedJournalEntry,
} from "./mongoose/JournalEntrySchema.js";

function isPersisted(value: unknown): value is PersistedJournalEntry {
  if (value === null || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o._id === "string" &&
    typeof o.userId === "string" &&
    typeof o.date === "string" &&
    typeof o.mood === "string" &&
    o.createdAt instanceof Date &&
    o.updatedAt instanceof Date
  );
}

export class MongoJournalRepository implements IJournalRepository {
  async save(entry: JournalEntry): Promise<void> {
    await JournalEntryModel.create({
      _id: entry.id,
      userId: entry.userId,
      date: entry.date,
      mood: entry.mood,
      note: entry.note,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    });
  }

  async update(entry: JournalEntry): Promise<void> {
    await JournalEntryModel.updateOne(
      { _id: entry.id },
      {
        $set: {
          mood: entry.mood,
          note: entry.note,
          updatedAt: entry.updatedAt,
        },
      },
    ).exec();
  }

  async findByUserAndDate(userId: string, date: string): Promise<JournalEntry | null> {
    const doc = await JournalEntryModel.findOne({ userId, date }).lean().exec();
    if (doc === null) return null;
    if (!isPersisted(doc)) throw new Error("Unexpected journal document shape");
    return this.toDomain(doc);
  }

  async findByUserAndMonth(userId: string, year: number, month: number): Promise<JournalEntry[]> {
    const mm = String(month).padStart(2, "0");
    const prefix = `${year}-${mm}`;

    const docs = await JournalEntryModel.find({
      userId,
      date: { $regex: `^${prefix}` },
    })
      .sort({ date: 1 })
      .lean()
      .exec();

    const entries: JournalEntry[] = [];
    for (const doc of docs) {
      if (!isPersisted(doc)) throw new Error("Unexpected journal document shape");
      entries.push(this.toDomain(doc));
    }
    return entries;
  }

  private toDomain(doc: PersistedJournalEntry): JournalEntry {
    const result = JournalEntry.create({
      id: doc._id,
      userId: doc.userId,
      date: doc.date,
      mood: doc.mood as Mood,
      note: doc.note,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
    if (!result.ok) throw new Error(`Invalid journal entry persisted: ${result.error.code}`);
    return result.entry;
  }
}
