import mongoose from "mongoose";

const vaultNoteSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    summary: { type: String, default: null },
    type: {
      type: String,
      required: true,
      enum: ["NOTE", "LINK", "SNIPPET", "CHECKLIST"],
    },
    category: {
      type: String,
      required: true,
      enum: ["IDEA", "REFERENCE", "LEARNING", "PROJECT", "INSPIRATION", "OTHER"],
      default: "IDEA",
    },
    stage: {
      type: String,
      required: true,
      enum: ["SEED", "EXPLORING", "VALIDATED", "DONE", "DISCARDED"],
      default: "SEED",
    },
    tags: { type: [String], default: [] },
    sourceUrl: { type: String, default: null },
    isFavorite: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    goalId: { type: String, default: null, index: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: "vault_notes" },
);

// Suporta a listagem paginada padrão (notas do usuário, mais recentes primeiro).
vaultNoteSchema.index({ userId: 1, createdAt: -1 });
// Filtros combinados da UI do cofre.
vaultNoteSchema.index({ userId: 1, isArchived: 1, createdAt: -1 });
vaultNoteSchema.index({ userId: 1, category: 1, createdAt: -1 });
vaultNoteSchema.index({ userId: 1, tags: 1, createdAt: -1 });
// Busca textual em título, resumo e conteúdo; o título pesa mais no ranking.
vaultNoteSchema.index(
  { title: "text", summary: "text", content: "text" },
  { weights: { title: 10, summary: 4, content: 1 }, name: "vault_notes_text" },
);

export type PersistedVaultNote = {
  readonly _id: string;
  readonly userId: string;
  readonly title: string;
  readonly content: string;
  readonly summary?: string | null;
  readonly type: string;
  readonly category?: string | null;
  readonly stage?: string | null;
  readonly tags?: readonly string[] | null;
  readonly sourceUrl?: string | null;
  readonly isFavorite?: boolean | null;
  readonly isArchived?: boolean | null;
  readonly goalId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export const VaultNoteModel = mongoose.model("VaultNote", vaultNoteSchema);
