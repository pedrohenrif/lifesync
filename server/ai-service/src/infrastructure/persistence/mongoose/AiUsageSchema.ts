import mongoose from "mongoose";

const aiUsageSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true },
    feature: { type: String, required: true, enum: ["FINANCE_PARSE", "VAULT_SUGGEST"] },
    model: { type: String, required: true },
    inputTokens: { type: Number, required: true },
    outputTokens: { type: Number, required: true },
    estimatedCostUsd: { type: Number, required: true },
    createdAt: { type: Date, required: true },
  },
  { collection: "ai_usage" },
);

// Suporta a agregação do teto mensal por usuário.
aiUsageSchema.index({ userId: 1, createdAt: -1 });

export const AiUsageModel = mongoose.model("AiUsage", aiUsageSchema);
