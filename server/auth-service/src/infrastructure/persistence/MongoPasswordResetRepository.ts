import type {
  IPasswordResetRepository,
  PasswordResetRecord,
} from "../../domain/repositories/IPasswordResetRepository.js";
import {
  PasswordResetModel,
  type PersistedPasswordReset,
} from "./mongoose/PasswordResetSchema.js";

function isPersisted(value: unknown): value is PersistedPasswordReset {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const o = value as Record<string, unknown>;
  return (
    typeof o.email === "string" &&
    typeof o.codeHash === "string" &&
    o.expiresAt instanceof Date &&
    typeof o.attemptCount === "number" &&
    o.createdAt instanceof Date
  );
}

function toRecord(doc: PersistedPasswordReset): PasswordResetRecord {
  return {
    email: doc.email,
    codeHash: doc.codeHash,
    expiresAt: doc.expiresAt,
    attemptCount: doc.attemptCount,
    createdAt: doc.createdAt,
  };
}

export class MongoPasswordResetRepository implements IPasswordResetRepository {
  async replaceForEmail(
    record: Omit<PasswordResetRecord, "attemptCount">,
  ): Promise<void> {
    await PasswordResetModel.findOneAndUpdate(
      { email: record.email },
      {
        email: record.email,
        codeHash: record.codeHash,
        expiresAt: record.expiresAt,
        attemptCount: 0,
        createdAt: record.createdAt,
      },
      { upsert: true, new: true },
    ).exec();
  }

  async findByEmail(email: string): Promise<PasswordResetRecord | null> {
    const doc = await PasswordResetModel.findOne({
      email: email.trim().toLowerCase(),
    })
      .lean()
      .exec();
    if (doc === null || !isPersisted(doc)) {
      return null;
    }
    return toRecord(doc);
  }

  async incrementAttempts(email: string): Promise<number> {
    const updated = await PasswordResetModel.findOneAndUpdate(
      { email: email.trim().toLowerCase() },
      { $inc: { attemptCount: 1 } },
      { new: true },
    )
      .lean()
      .exec();
    if (updated === null || !isPersisted(updated)) {
      return 0;
    }
    return updated.attemptCount;
  }

  async deleteByEmail(email: string): Promise<void> {
    await PasswordResetModel.deleteOne({ email: email.trim().toLowerCase() }).exec();
  }
}
