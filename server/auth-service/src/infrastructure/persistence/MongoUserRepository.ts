import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import { User, type UserStatus } from "../../domain/entities/User.js";
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
    typeof o.name === "string" &&
    typeof o.email === "string" &&
    typeof o.passwordHash === "string" &&
    typeof o.role === "string" &&
    typeof o.status === "string" &&
    o.createdAt instanceof Date &&
    o.updatedAt instanceof Date
  );
}

export class MongoUserRepository implements IUserRepository {
  async save(user: User): Promise<void> {
    await UserModel.create({
      _id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    const doc = await UserModel.findOne({ email: normalized }).lean().exec();
    if (doc === null) return null;
    if (!isPersistedUser(doc)) throw new Error("Unexpected user document shape from persistence");
    return this.toDomain(doc);
  }

  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).lean().exec();
    if (doc === null) return null;
    if (!isPersistedUser(doc)) throw new Error("Unexpected user document shape from persistence");
    return this.toDomain(doc);
  }

  async findByStatus(status: UserStatus): Promise<User[]> {
    const docs = await UserModel.find({ status }).sort({ createdAt: -1 }).lean().exec();
    return docs.filter(isPersistedUser).map((doc) => this.toDomain(doc));
  }

  async updateStatus(id: string, status: UserStatus): Promise<void> {
    await UserModel.updateOne({ _id: id }, { $set: { status, updatedAt: new Date() } }).exec();
  }

  private toDomain(doc: PersistedUser): User {
    const result = User.create({
      id: doc._id,
      name: doc.name,
      email: doc.email,
      passwordHash: doc.passwordHash,
      role: doc.role,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
    if (!result.ok) {
      throw new Error(`Invalid user persisted: ${result.error.code}`);
    }
    return result.user;
  }
}
