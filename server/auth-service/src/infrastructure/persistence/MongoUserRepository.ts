import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import { User } from "../../domain/entities/User.js";
import {
  UserModel,
  type PersistedUser,
} from "./mongoose/UserSchema.js";

function isPersistedUser(value: unknown): value is PersistedUser {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const o = value as Record<string, unknown>;
  return (
    typeof o._id === "string" &&
    typeof o.email === "string" &&
    typeof o.passwordHash === "string" &&
    o.createdAt instanceof Date &&
    o.updatedAt instanceof Date
  );
}

export class MongoUserRepository implements IUserRepository {
  async save(user: User): Promise<void> {
    await UserModel.create({
      _id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    const doc = await UserModel.findOne({ email: normalized }).lean().exec();
    if (doc === null) {
      return null;
    }
    if (!isPersistedUser(doc)) {
      throw new Error("Unexpected user document shape from persistence");
    }
    return this.toDomain(doc);
  }

  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).lean().exec();
    if (doc === null) {
      return null;
    }
    if (!isPersistedUser(doc)) {
      throw new Error("Unexpected user document shape from persistence");
    }
    return this.toDomain(doc);
  }

  private toDomain(doc: PersistedUser): User {
    const result = User.create({
      id: doc._id,
      email: doc.email,
      passwordHash: doc.passwordHash,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
    if (!result.ok) {
      throw new Error(`Invalid user persisted: ${result.error.code}`);
    }
    return result.user;
  }
}
