import type {
  ITransactionRepository,
  TransactionPeriod,
  TransactionTotals,
} from "../../domain/repositories/ITransactionRepository.js";
import { Transaction } from "../../domain/entities/Transaction.js";
import type { TransactionType, PaymentMethod } from "../../domain/entities/Transaction.js";
import {
  buildPaginated,
  toSkip,
  type Paginated,
  type PaginationParams,
} from "../../domain/pagination.js";
import {
  TransactionModel,
  type PersistedTransaction,
} from "./mongoose/TransactionSchema.js";

function buildFilter(userId: string, period?: TransactionPeriod): Record<string, unknown> {
  if (period === undefined) {
    return { userId };
  }
  const start = new Date(period.year, period.month - 1, 1);
  const end = new Date(period.year, period.month, 0, 23, 59, 59, 999);
  return { userId, date: { $gte: start, $lte: end } };
}

function isPersisted(value: unknown): value is PersistedTransaction {
  if (value === null || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o._id === "string" &&
    typeof o.userId === "string" &&
    typeof o.title === "string" &&
    typeof o.amount === "number" &&
    typeof o.type === "string" &&
    typeof o.category === "string" &&
    typeof o.paymentMethod === "string" &&
    typeof o.isFixed === "boolean" &&
    o.date instanceof Date &&
    o.createdAt instanceof Date
  );
}

function toDocument(tx: Transaction) {
  return {
    _id: tx.id,
    userId: tx.userId,
    title: tx.title,
    amount: tx.amount,
    type: tx.type,
    category: tx.category,
    paymentMethod: tx.paymentMethod,
    isFixed: tx.isFixed,
    installment: tx.installment,
    date: tx.date,
    createdAt: tx.createdAt,
  };
}

function toUpdateSet(tx: Transaction) {
  return {
    userId: tx.userId,
    title: tx.title,
    amount: tx.amount,
    type: tx.type,
    category: tx.category,
    paymentMethod: tx.paymentMethod,
    isFixed: tx.isFixed,
    installment: tx.installment,
    date: tx.date,
  };
}

export class MongoTransactionRepository implements ITransactionRepository {
  async save(tx: Transaction): Promise<void> {
    await TransactionModel.create(toDocument(tx));
  }

  async saveMany(transactions: readonly Transaction[]): Promise<void> {
    if (transactions.length === 0) return;
    const docs = transactions.map(toDocument);
    await TransactionModel.insertMany(docs);
  }

  async findById(id: string): Promise<Transaction | null> {
    const doc = await TransactionModel.findById(id).lean().exec();
    if (doc === null) return null;
    if (!isPersisted(doc)) throw new Error("Unexpected transaction document shape");
    return this.toDomain(doc);
  }

  async findPageByUserId(
    userId: string,
    pagination: PaginationParams,
    period?: TransactionPeriod,
  ): Promise<Paginated<Transaction>> {
    const filter = buildFilter(userId, period);
    const [docs, total] = await Promise.all([
      TransactionModel.find(filter)
        .sort({ date: -1 })
        .skip(toSkip(pagination))
        .limit(pagination.pageSize)
        .lean()
        .exec(),
      TransactionModel.countDocuments(filter).exec(),
    ]);

    const result: Transaction[] = [];
    for (const doc of docs) {
      if (!isPersisted(doc)) throw new Error("Unexpected transaction document shape");
      result.push(this.toDomain(doc));
    }
    return buildPaginated(result, total, pagination);
  }

  async sumTotalsByUserId(
    userId: string,
    period?: TransactionPeriod,
  ): Promise<TransactionTotals> {
    const rows = await TransactionModel.aggregate<{ _id: unknown; total: unknown }>([
      { $match: buildFilter(userId, period) },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]).exec();

    let totalIncome = 0;
    let totalExpense = 0;
    for (const row of rows) {
      const amount = typeof row.total === "number" ? row.total : 0;
      if (row._id === "INCOME") {
        totalIncome += amount;
      } else if (row._id === "EXPENSE") {
        totalExpense += amount;
      }
    }
    return { totalIncome, totalExpense };
  }

  async findByUserIdAndMonth(userId: string, year: number, month: number): Promise<Transaction[]> {
    const docs = await TransactionModel.find(buildFilter(userId, { year, month }))
      .sort({ date: -1 })
      .lean()
      .exec();
    const result: Transaction[] = [];
    for (const doc of docs) {
      if (!isPersisted(doc)) throw new Error("Unexpected transaction document shape");
      result.push(this.toDomain(doc));
    }
    return result;
  }

  async update(tx: Transaction): Promise<void> {
    await TransactionModel.updateOne({ _id: tx.id }, { $set: toUpdateSet(tx) }).exec();
  }

  async delete(id: string): Promise<void> {
    await TransactionModel.deleteOne({ _id: id }).exec();
  }

  private toDomain(doc: PersistedTransaction): Transaction {
    const result = Transaction.create({
      id: doc._id,
      userId: doc.userId,
      title: doc.title,
      amount: doc.amount,
      type: doc.type as TransactionType,
      category: doc.category,
      paymentMethod: (doc.paymentMethod ?? "DEBIT") as PaymentMethod,
      isFixed: doc.isFixed ?? false,
      installment: doc.installment ?? null,
      date: doc.date,
      createdAt: doc.createdAt,
    });
    if (!result.ok) throw new Error(`Invalid transaction persisted: ${result.error.code}`);
    return result.transaction;
  }
}
