import mongoose from "mongoose";

const vaultNoteSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["NOTE", "LINK"],
    },
    goalId: { type: String, default: null, index: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: "vault_notes" },
);

export type PersistedVaultNote = {
  readonly _id: string;
  readonly userId: string;
  readonly title: string;
  readonly content: string;
  readonly type: string;
  readonly goalId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export const VaultNoteModel = mongoose.model("VaultNote", vaultNoteSchema);
