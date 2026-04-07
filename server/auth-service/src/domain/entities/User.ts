export type UserId = string;
export type UserRole = "USER" | "ADMIN";
export type UserStatus = "PENDING" | "ACTIVE" | "REJECTED";

export interface UserProps {
  readonly id: UserId;
  readonly name: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly role: UserRole;
  readonly status: UserStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type UserValidationError =
  | { readonly code: "NAME_REQUIRED" }
  | { readonly code: "EMAIL_REQUIRED" }
  | { readonly code: "EMAIL_INVALID" }
  | { readonly code: "PASSWORD_HASH_REQUIRED" };

export type CreateUserResult =
  | { readonly ok: true; readonly user: User }
  | { readonly ok: false; readonly error: UserValidationError };

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): CreateUserResult {
    const name = props.name.trim();
    if (name.length === 0) {
      return { ok: false, error: { code: "NAME_REQUIRED" } };
    }
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
    return {
      ok: true,
      user: new User({ ...props, name, email }),
    };
  }

  get id(): UserId { return this.props.id; }
  get name(): string { return this.props.name; }
  get email(): string { return this.props.email; }
  get passwordHash(): string { return this.props.passwordHash; }
  get role(): UserRole { return this.props.role; }
  get status(): UserStatus { return this.props.status; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  withStatus(status: UserStatus): User {
    return new User({ ...this.props, status, updatedAt: new Date() });
  }
}
