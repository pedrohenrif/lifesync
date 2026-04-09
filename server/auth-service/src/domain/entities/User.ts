export type UserId = string;
export type UserRole = "USER" | "ADMIN";
export type UserStatus = "PENDING" | "ACTIVE" | "REJECTED";
export type PrimaryFocus = "FINANCE" | "HABITS" | "GOALS";

export type UserAttributes = {
  readonly health: number;
  readonly finance: number;
  readonly focus: number;
  readonly knowledge: number;
  readonly social: number;
};

export type PersonalReward = {
  readonly id: string;
  readonly title: string;
  readonly costCoins: number;
  readonly createdAt: Date;
};

export const DEFAULT_USER_ATTRIBUTES: UserAttributes = {
  health: 0,
  finance: 0,
  focus: 0,
  knowledge: 0,
  social: 0,
};

export interface UserProps {
  readonly id: UserId;
  /** Display / preferred name; may be empty until onboarding. */
  readonly name: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly role: UserRole;
  readonly status: UserStatus;
  readonly hasCompletedOnboarding: boolean;
  readonly primaryFocus: PrimaryFocus | null;
  readonly totalXp: number;
  readonly coins: number;
  readonly attributes: UserAttributes;
  readonly personalRewards: readonly PersonalReward[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type UserValidationError =
  | { readonly code: "EMAIL_REQUIRED" }
  | { readonly code: "EMAIL_INVALID" }
  | { readonly code: "PASSWORD_HASH_REQUIRED" }
  | { readonly code: "INVALID_GAMIFICATION" };

export type CreateUserResult =
  | { readonly ok: true; readonly user: User }
  | { readonly ok: false; readonly error: UserValidationError };

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isNonNegativeInt(n: number): boolean {
  return Number.isInteger(n) && n >= 0;
}

function normalizeAttributes(raw: UserAttributes): UserAttributes {
  return {
    health: Math.max(0, Math.floor(raw.health)),
    finance: Math.max(0, Math.floor(raw.finance)),
    focus: Math.max(0, Math.floor(raw.focus)),
    knowledge: Math.max(0, Math.floor(raw.knowledge)),
    social: Math.max(0, Math.floor(raw.social)),
  };
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): CreateUserResult {
    const name = props.name.trim();
    const email = normalizeEmail(props.email);
    if (email.length === 0) {
      return { ok: false, error: { code: "EMAIL_REQUIRED" } };
    }
    if (!isValidEmailFormat(email)) {
      return { ok: false, error: { code: "EMAIL_INVALID" } };
    }
    if (props.passwordHash.length === 0) {
      return { ok: false, error: { code: "PASSWORD_HASH_REQUIRED" } };
    }

    const totalXp = Math.max(0, Math.floor(props.totalXp ?? 0));
    const coins = Math.max(0, Math.floor(props.coins ?? 0));
    const attributes = normalizeAttributes(props.attributes ?? DEFAULT_USER_ATTRIBUTES);
    const personalRewards = props.personalRewards ?? [];

    if (
      !isNonNegativeInt(totalXp) ||
      !isNonNegativeInt(coins) ||
      personalRewards.some(
        (r) =>
          r.title.trim().length === 0 ||
          !Number.isInteger(r.costCoins) ||
          r.costCoins < 1,
      )
    ) {
      return { ok: false, error: { code: "INVALID_GAMIFICATION" } };
    }

    return {
      ok: true,
      user: new User({
        ...props,
        name,
        email,
        hasCompletedOnboarding: props.hasCompletedOnboarding,
        primaryFocus: props.primaryFocus,
        totalXp,
        coins,
        attributes,
        personalRewards,
      }),
    };
  }

  get id(): UserId {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get email(): string {
    return this.props.email;
  }
  get passwordHash(): string {
    return this.props.passwordHash;
  }
  get role(): UserRole {
    return this.props.role;
  }
  get status(): UserStatus {
    return this.props.status;
  }
  get hasCompletedOnboarding(): boolean {
    return this.props.hasCompletedOnboarding;
  }
  get primaryFocus(): PrimaryFocus | null {
    return this.props.primaryFocus;
  }
  get totalXp(): number {
    return this.props.totalXp;
  }
  get coins(): number {
    return this.props.coins;
  }
  get attributes(): UserAttributes {
    return this.props.attributes;
  }
  get personalRewards(): readonly PersonalReward[] {
    return this.props.personalRewards;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  withStatus(status: UserStatus): User {
    const result = User.create({
      ...this.props,
      status,
      updatedAt: new Date(),
    });
    if (!result.ok) {
      throw new Error(`Unexpected validation error: ${result.error.code}`);
    }
    return result.user;
  }

  withGamificationDelta(delta: {
    readonly totalXp: number;
    readonly coins: number;
    readonly attributes?: Partial<UserAttributes>;
  }): User {
    const nextAttrs = { ...this.props.attributes };
    if (delta.attributes !== undefined) {
      for (const key of Object.keys(delta.attributes) as (keyof UserAttributes)[]) {
        const add = delta.attributes[key];
        if (add !== undefined) {
          nextAttrs[key] = Math.max(0, nextAttrs[key] + Math.floor(add));
        }
      }
    }
    const result = User.create({
      ...this.props,
      totalXp: Math.max(0, this.props.totalXp + Math.floor(delta.totalXp)),
      coins: Math.max(0, this.props.coins + Math.floor(delta.coins)),
      attributes: nextAttrs,
      updatedAt: new Date(),
    });
    if (!result.ok) {
      throw new Error(`Unexpected validation error: ${result.error.code}`);
    }
    return result.user;
  }

  withPersonalRewards(rewards: readonly PersonalReward[]): User {
    const result = User.create({
      ...this.props,
      personalRewards: rewards,
      updatedAt: new Date(),
    });
    if (!result.ok) {
      throw new Error(`Unexpected validation error: ${result.error.code}`);
    }
    return result.user;
  }
}
