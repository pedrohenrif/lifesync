import mongoose from "mongoose";

const goalTaskSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    isCompleted: { type: Boolean, required: true, default: false },
    createdAt: { type: Date, required: true },
  },
  { _id: false },
);

const goalSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    status: {
      type: String,
      required: true,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED"],
    },
    category: {
      type: String,
      required: true,
      enum: ["STUDY", "PERSONAL", "BUSINESS", "FAMILY", "DREAMS", "OTHER"],
    },
    tasks: { type: [goalTaskSchema], default: [] },
    targetDate: { type: Date, default: null },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: "goals" },
);

export type PersistedGoalTask = {
  readonly id: string;
  readonly title: string;
  readonly isCompleted: boolean;
  readonly createdAt: Date;
};

export type PersistedGoal = {
  readonly _id: string;
  readonly userId: string;
  readonly title: string;
  readonly description: string | null;
  readonly status: string;
  readonly category: string;
  readonly tasks: readonly PersistedGoalTask[];
  readonly targetDate: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export const GoalModel = mongoose.model("Goal", goalSchema);
