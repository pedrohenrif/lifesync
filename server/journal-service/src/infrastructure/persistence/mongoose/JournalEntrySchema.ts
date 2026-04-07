import mongoose from "mongoose";

const journalEntrySchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    mood: {
      type: String,
      required: true,
      enum: ["TERRIBLE", "BAD", "NEUTRAL", "GOOD", "EXCELLENT"],
    },
    note: { type: String, default: null },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: "journal_entries" },
);

journalEntrySchema.index({ userId: 1, date: 1 }, { unique: true });

export type PersistedJournalEntry = {
  readonly _id: string;
  readonly userId: string;
  readonly date: string;
  readonly mood: string;
  readonly note: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export const JournalEntryModel = mongoose.model("JournalEntry", journalEntrySchema);
