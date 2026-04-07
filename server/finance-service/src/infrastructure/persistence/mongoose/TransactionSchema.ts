import mongoose from "mongoose";

const installmentSchema = new mongoose.Schema(
  {
    current: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false },
);

const transactionSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    type: { type: String, required: true, enum: ["INCOME", "EXPENSE"] },
    category: { type: String, required: true, trim: true },
    paymentMethod: { type: String, required: true, enum: ["DEBIT", "CREDIT"], default: "DEBIT" },
    isFixed: { type: Boolean, required: true, default: false },
    installment: { type: installmentSchema, default: null },
    date: { type: Date, required: true },
    createdAt: { type: Date, required: true },
  },
  { collection: "transactions" },
);

export type PersistedInstallment = {
  readonly current: number;
  readonly total: number;
};

export type PersistedTransaction = {
  readonly _id: string;
  readonly userId: string;
  readonly title: string;
  readonly amount: number;
  readonly type: string;
  readonly category: string;
  readonly paymentMethod: string;
  readonly isFixed: boolean;
  readonly installment: PersistedInstallment | null;
  readonly date: Date;
  readonly createdAt: Date;
};

export const TransactionModel = mongoose.model("Transaction", transactionSchema);
