export type UserId = string;

export interface UserProps {
  readonly id: UserId;
  readonly email: string;
  readonly passwordHash: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type UserValidationError =
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
      user: new User({
        ...props,
        email,
      }),
    };
  }

  get id(): UserId {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
