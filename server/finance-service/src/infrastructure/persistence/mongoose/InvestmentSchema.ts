import mongoose from "mongoose";

const investmentSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    investedAmount: { type: Number, required: true },
    currentBalance: { type: Number, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: "investments" },
);

export type PersistedInvestment = {
  readonly _id: string;
  readonly userId: string;
  readonly name: string;
  readonly investedAmount: number;
  readonly currentBalance: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export const InvestmentModel = mongoose.model("Investment", investmentSchema);
