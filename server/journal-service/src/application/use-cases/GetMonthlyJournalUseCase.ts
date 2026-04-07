import { ok, type Result } from "../result.js";
import type { IJournalRepository } from "../../domain/repositories/IJournalRepository.js";

export type JournalEntrySummary = {
  readonly id: string;
  readonly date: string;
  readonly mood: string;
  readonly note: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type GetMonthlyJournalSuccess = readonly JournalEntrySummary[];

export class GetMonthlyJournalUseCase {
  constructor(private readonly journal: IJournalRepository) {}

  async execute(
    userId: string,
    year: number,
    month: number,
  ): Promise<Result<GetMonthlyJournalSuccess, never>> {
    const entries = await this.journal.findByUserAndMonth(userId, year, month);

    return ok(
      entries.map((e) => ({
        id: e.id,
        date: e.date,
        mood: e.mood,
        note: e.note,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
    );
  }
}
