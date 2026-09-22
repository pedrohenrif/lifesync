import mongoose, { Schema } from "mongoose";

export interface GoogleConnectionDocument {
  _id: string;
  userId: string;
  googleEmail: string | null;
  encryptedRefreshToken: string;
  scope: string;
  connectedAt: Date;
  updatedAt: Date;
}

const googleConnectionSchema = new Schema<GoogleConnectionDocument>(
  {
    _id: { type: String, required: true },
    // Uma conta Google por usuário: reconectar substitui a conexão anterior.
    userId: { type: String, required: true, unique: true, index: true },
    googleEmail: { type: String, default: null },
    encryptedRefreshToken: { type: String, required: true },
    scope: { type: String, required: true },
    connectedAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false, _id: false },
);

export const GoogleConnectionModel = mongoose.model<GoogleConnectionDocument>(
  "GoogleConnection",
  googleConnectionSchema,
);
