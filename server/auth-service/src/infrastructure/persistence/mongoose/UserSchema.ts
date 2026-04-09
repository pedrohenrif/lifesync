import mongoose from "mongoose";

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
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export const UserModel = mongoose.model("User", userSchema);
