import { randomUUID } from "node:crypto";
import { err, ok, type Result } from "../result.js";
import { JournalEntry } from "../../domain/entities/JournalEntry.js";
import type { JournalEntryValidationError, Mood } from "../../domain/entities/JournalEntry.js";
import type { IJournalRepository } from "../../domain/repositories/IJournalRepository.js";

export type SaveJournalDto = {
  readonly date: string;
  readonly mood: string;
  readonly note?: string;
};

export type SaveJournalSuccess = {
  readonly id: string;
  readonly userId: string;
  readonly date: string;
  readonly mood: string;
  readonly note: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly isNew: boolean;
};

export type SaveJournalError = JournalEntryValidationError;

export class SaveJournalEntryUseCase {
  constructor(private readonly journal: IJournalRepository) {}

  /**
   * Upsert: se já existe uma entrada para (userId, date), atualiza; caso contrário, cria.
   */
  async execute(
    userId: string,
    dto: SaveJournalDto,
  ): Promise<Result<SaveJournalSuccess, SaveJournalError>> {
    const now = new Date();
    const existing = await this.journal.findByUserAndDate(userId, dto.date);

    if (existing !== null) {
      const result = JournalEntry.create({
        id: existing.id,
        userId: existing.userId,
        date: existing.date,
        mood: dto.mood as Mood,
        note: dto.note?.trim() ?? null,
        createdAt: existing.createdAt,
        updatedAt: now,
      });

      if (!result.ok) return err(result.error);

      await this.journal.update(result.entry);

      return ok({
        id: result.entry.id,
        userId: result.entry.userId,
        date: result.entry.date,
        mood: result.entry.mood,
        note: result.entry.note,
        createdAt: result.entry.createdAt.toISOString(),
        updatedAt: result.entry.updatedAt.toISOString(),
        isNew: false,
      });
    }

    const result = JournalEntry.create({
      id: randomUUID(),
      userId,
      date: dto.date,
      mood: dto.mood as Mood,
      note: dto.note?.trim() ?? null,
      createdAt: now,
      updatedAt: now,
    });

    if (!result.ok) return err(result.error);

    await this.journal.save(result.entry);

    return ok({
      id: result.entry.id,
      userId: result.entry.userId,
      date: result.entry.date,
      mood: result.entry.mood,
      note: result.entry.note,
      createdAt: result.entry.createdAt.toISOString(),
      updatedAt: result.entry.updatedAt.toISOString(),
      isNew: true,
    });
  }
}
