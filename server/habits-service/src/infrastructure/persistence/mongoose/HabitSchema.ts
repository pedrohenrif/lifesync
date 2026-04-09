import mongoose from "mongoose";

const habitSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    icon: { type: String, default: "Activity" },
    category: {
      type: String,
      enum: ["SAUDE", "FOCO", "FINANCAS", "PESSOAL"],
      default: "PESSOAL",
    },
    frequencyType: {
      type: String,
      required: true,
      enum: ["DAILY", "WEEKLY_TARGET"],
    },
    targetDaysPerWeek: { type: Number, default: null },
    completedDates: { type: [String], default: [] },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    createdAt: { type: Date, required: true },
  },
  {
    collection: "habits",
  },
);

export type PersistedHabit = {
  readonly _id: string;
  readonly userId: string;
  readonly name: string;
  readonly description: string | null;
  readonly icon?: string;
  readonly category?: string;
  readonly frequencyType: string;
  readonly targetDaysPerWeek: number | null;
  readonly completedDates: string[];
  readonly xp: number;
  readonly level: number;
  readonly createdAt: Date;
};

export const HabitModel = mongoose.model("Habit", habitSchema);
