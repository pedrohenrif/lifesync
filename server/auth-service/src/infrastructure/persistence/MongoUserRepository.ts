import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import {
  User,
  type PrimaryFocus,
  type UserStatus,
} from "../../domain/entities/User.js";
import {
  UserModel,
  type PersistedUser,
} from "./mongoose/UserSchema.js";

function isPrimaryFocus(value: unknown): value is PrimaryFocus {
  return value === "FINANCE" || value === "HABITS" || value === "GOALS";
}

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

function normalizeHasCompletedOnboarding(doc: PersistedUser): boolean {
  if (doc.hasCompletedOnboarding === true) return true;
  if (doc.hasCompletedOnboarding === false) return false;
  return true;
}

function normalizePrimaryFocus(doc: PersistedUser): PrimaryFocus | null {
  const v = doc.primaryFocus;
  if (v === null || v === undefined) return null;
  return isPrimaryFocus(v) ? v : null;
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
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      primaryFocus: user.primaryFocus,
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

  async completeOnboarding(
    id: string,
    input: { readonly name: string; readonly primaryFocus?: PrimaryFocus },
  ): Promise<User | null> {
    const setDoc: Record<string, unknown> = {
      name: input.name.trim(),
      hasCompletedOnboarding: true,
      updatedAt: new Date(),
    };
    if (input.primaryFocus !== undefined) {
      setDoc.primaryFocus = input.primaryFocus;
    }
    await UserModel.updateOne({ _id: id }, { $set: setDoc }).exec();
    return this.findById(id);
  }

  private toDomain(doc: PersistedUser): User {
    const result = User.create({
      id: doc._id,
      name: doc.name,
      email: doc.email,
      passwordHash: doc.passwordHash,
      role: doc.role,
      status: doc.status,
      hasCompletedOnboarding: normalizeHasCompletedOnboarding(doc),
      primaryFocus: normalizePrimaryFocus(doc),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
    if (!result.ok) {
      throw new Error(`Invalid user persisted: ${result.error.code}`);
    }
    return result.user;
  }
}
