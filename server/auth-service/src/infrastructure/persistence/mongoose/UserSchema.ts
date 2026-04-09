import mongoose from "mongoose";

const attributesSchema = new mongoose.Schema(
  {
    health: { type: Number, default: 0 },
    finance: { type: Number, default: 0 },
    focus: { type: Number, default: 0 },
    knowledge: { type: Number, default: 0 },
    social: { type: Number, default: 0 },
  },
  { _id: false },
);

const personalRewardSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    costCoins: { type: Number, required: true },
    createdAt: { type: Date, required: true },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, default: "" },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER", required: true },
    status: { type: String, enum: ["PENDING", "ACTIVE", "REJECTED"], default: "PENDING", required: true },
    hasCompletedOnboarding: { type: Boolean, default: false },
    primaryFocus: {
      type: String,
      enum: ["FINANCE", "HABITS", "GOALS"],
      required: false,
    },
    totalXp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    attributes: { type: attributesSchema, default: () => ({}) },
    personalRewards: { type: [personalRewardSchema], default: [] },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  {
    collection: "users",
  },
);

export type PersistedUser = {
  readonly _id: string;
  readonly name: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly role: "USER" | "ADMIN";
  readonly status: "PENDING" | "ACTIVE" | "REJECTED";
  readonly hasCompletedOnboarding?: boolean;
  readonly primaryFocus?: "FINANCE" | "HABITS" | "GOALS" | null;
  readonly totalXp?: number;
  readonly coins?: number;
  readonly attributes?: {
    readonly health?: number;
    readonly finance?: number;
    readonly focus?: number;
    readonly knowledge?: number;
    readonly social?: number;
  };
  readonly personalRewards?: readonly {
    readonly id: string;
    readonly title: string;
    readonly costCoins: number;
    readonly createdAt: Date;
  }[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export const UserModel = mongoose.model("User", userSchema);
