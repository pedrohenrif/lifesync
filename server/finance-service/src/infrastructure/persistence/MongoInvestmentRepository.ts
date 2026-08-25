import type {
  IInvestmentRepository,
  InvestmentTotals,
} from "../../domain/repositories/IInvestmentRepository.js";
import { Investment } from "../../domain/entities/Investment.js";
import {
  buildPaginated,
  toSkip,
  type Paginated,
  type PaginationParams,
} from "../../domain/pagination.js";
import {
  InvestmentModel,
  type PersistedInvestment,
} from "./mongoose/InvestmentSchema.js";

function isPersisted(value: unknown): value is PersistedInvestment {
  if (value === null || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o._id === "string" &&
    typeof o.userId === "string" &&
    typeof o.name === "string" &&
    typeof o.investedAmount === "number" &&
    typeof o.currentBalance === "number" &&
    o.createdAt instanceof Date &&
    o.updatedAt instanceof Date
  );
}

export class MongoInvestmentRepository implements IInvestmentRepository {
  async save(inv: Investment): Promise<void> {
    await InvestmentModel.create({
      _id: inv.id,
      userId: inv.userId,
      name: inv.name,
      investedAmount: inv.investedAmount,
      currentBalance: inv.currentBalance,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
    });
  }

  async findById(id: string): Promise<Investment | null> {
    const doc = await InvestmentModel.findById(id).lean().exec();
    if (doc === null) return null;
    if (!isPersisted(doc)) throw new Error("Unexpected investment document shape");
    return this.toDomain(doc);
  }

  async findPageByUserId(
    userId: string,
    pagination: PaginationParams,
  ): Promise<Paginated<Investment>> {
    const [docs, total] = await Promise.all([
      InvestmentModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(toSkip(pagination))
        .limit(pagination.pageSize)
        .lean()
        .exec(),
      InvestmentModel.countDocuments({ userId }).exec(),
    ]);

    const result: Investment[] = [];
    for (const doc of docs) {
      if (!isPersisted(doc)) throw new Error("Unexpected investment document shape");
      result.push(this.toDomain(doc));
    }
    return buildPaginated(result, total, pagination);
  }

  async sumTotalsByUserId(userId: string): Promise<InvestmentTotals> {
    const rows = await InvestmentModel.aggregate<{
      totalInvested: unknown;
      totalBalance: unknown;
    }>([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalInvested: { $sum: "$investedAmount" },
          totalBalance: { $sum: "$currentBalance" },
        },
      },
    ]).exec();

    const row = rows[0];
    return {
      totalInvested: typeof row?.totalInvested === "number" ? row.totalInvested : 0,
      totalBalance: typeof row?.totalBalance === "number" ? row.totalBalance : 0,
    };
  }

  async update(inv: Investment): Promise<void> {
    await InvestmentModel.updateOne(
      { _id: inv.id },
      {
        $set: {
          name: inv.name,
          investedAmount: inv.investedAmount,
          currentBalance: inv.currentBalance,
          updatedAt: inv.updatedAt,
        },
      },
    ).exec();
  }

  async delete(id: string): Promise<void> {
    await InvestmentModel.deleteOne({ _id: id }).exec();
  }

  private toDomain(doc: PersistedInvestment): Investment {
    const result = Investment.create({
      id: doc._id,
      userId: doc.userId,
      name: doc.name,
      investedAmount: doc.investedAmount,
      currentBalance: doc.currentBalance,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
    if (!result.ok) throw new Error(`Invalid investment persisted: ${result.error.code}`);
    return result.investment;
  }
}
