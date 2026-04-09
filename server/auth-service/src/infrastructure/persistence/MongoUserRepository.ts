import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import {
  User,
  type PersonalReward,
  type PrimaryFocus,
  type UserAttributes,
  type UserStatus,
  DEFAULT_USER_ATTRIBUTES,
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

function normalizeAttributes(doc: PersistedUser): UserAttributes {
  const a = doc.attributes;
  if (a === undefined || typeof a !== "object") {
    return { ...DEFAULT_USER_ATTRIBUTES };
  }
  const o = a as Record<string, unknown>;
  return {
    health: typeof o.health === "number" ? Math.max(0, Math.floor(o.health)) : 0,
    finance: typeof o.finance === "number" ? Math.max(0, Math.floor(o.finance)) : 0,
    focus: typeof o.focus === "number" ? Math.max(0, Math.floor(o.focus)) : 0,
    knowledge: typeof o.knowledge === "number" ? Math.max(0, Math.floor(o.knowledge)) : 0,
    social: typeof o.social === "number" ? Math.max(0, Math.floor(o.social)) : 0,
  };
}

function normalizePersonalRewards(doc: PersistedUser): PersonalReward[] {
  const raw = doc.personalRewards;
  if (!Array.isArray(raw)) return [];
  const out: PersonalReward[] = [];
  for (const item of raw) {
    if (
      typeof item === "object" &&
      item !== null &&
      typeof (item as { id?: string }).id === "string" &&
      typeof (item as { title?: string }).title === "string" &&
      typeof (item as { costCoins?: number }).costCoins === "number" &&
      (item as { createdAt?: Date }).createdAt instanceof Date
    ) {
      out.push({
        id: (item as { id: string }).id,
        title: (item as { title: string }).title,
        costCoins: Math.max(1, Math.floor((item as { costCoins: number }).costCoins)),
        createdAt: (item as { createdAt: Date }).createdAt,
      });
    }
  }
  return out;
}

function userToDoc(user: User): Record<string, unknown> {
  return {
    _id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    role: user.role,
    status: user.status,
    hasCompletedOnboarding: user.hasCompletedOnboarding,
    primaryFocus: user.primaryFocus,
    totalXp: user.totalXp,
    coins: user.coins,
    attributes: { ...user.attributes },
    personalRewards: user.personalRewards.map((r) => ({
      id: r.id,
      title: r.title,
      costCoins: r.costCoins,
      createdAt: r.createdAt,
    })),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class MongoUserRepository implements IUserRepository {
  async save(user: User): Promise<void> {
    await UserModel.create(userToDoc(user));
  }

  async updateUser(user: User): Promise<void> {
    await UserModel.replaceOne({ _id: user.id }, userToDoc(user)).exec();
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
    const totalXp =
      typeof doc.totalXp === "number" && Number.isFinite(doc.totalXp)
        ? Math.max(0, Math.floor(doc.totalXp))
        : 0;
    const coins =
      typeof doc.coins === "number" && Number.isFinite(doc.coins)
        ? Math.max(0, Math.floor(doc.coins))
        : 0;
    const result = User.create({
      id: doc._id,
      name: doc.name,
      email: doc.email,
      passwordHash: doc.passwordHash,
      role: doc.role,
      status: doc.status,
      hasCompletedOnboarding: normalizeHasCompletedOnboarding(doc),
      primaryFocus: normalizePrimaryFocus(doc),
      totalXp,
      coins,
      attributes: normalizeAttributes(doc),
      personalRewards: normalizePersonalRewards(doc),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
    if (!result.ok) {
      throw new Error(`Invalid user persisted: ${result.error.code}`);
    }
    return result.user;
  }
}
