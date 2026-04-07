import type { JournalEntry } from "../entities/JournalEntry.js";

export interface IJournalRepository {
  save(entry: JournalEntry): Promise<void>;
  update(entry: JournalEntry): Promise<void>;
  findByUserAndDate(userId: string, date: string): Promise<JournalEntry | null>;
  findByUserAndMonth(userId: string, year: number, month: number): Promise<JournalEntry[]>;
}
