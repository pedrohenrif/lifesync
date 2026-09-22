import mongoose from "mongoose";

const passwordResetSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attemptCount: { type: Number, required: true, default: 0 },
    createdAt: { type: Date, required: true },
  },
  {
    collection: "password_reset_codes",
  },
);

passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type PersistedPasswordReset = {
  readonly email: string;
  readonly codeHash: string;
  readonly expiresAt: Date;
  readonly attemptCount: number;
  readonly createdAt: Date;
};

export const PasswordResetModel = mongoose.model(
  "PasswordResetCode",
  passwordResetSchema,
);
