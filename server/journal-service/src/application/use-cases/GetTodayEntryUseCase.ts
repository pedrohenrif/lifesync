import { ok, type Result } from "../result.js";
import type { IJournalRepository } from "../../domain/repositories/IJournalRepository.js";

export type TodayEntrySuccess = {
  readonly id: string;
  readonly date: string;
  readonly mood: string;
  readonly note: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
} | null;

export class GetTodayEntryUseCase {
  constructor(private readonly journal: IJournalRepository) {}

  async execute(
    userId: string,
    date: string,
  ): Promise<Result<TodayEntrySuccess, never>> {
    const entry = await this.journal.findByUserAndDate(userId, date);

    if (entry === null) return ok(null);

    return ok({
      id: entry.id,
      date: entry.date,
      mood: entry.mood,
      note: entry.note,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    });
  }
}
