import { err, ok, type Result } from "../result.js";
import type { IResetCodeDigest } from "../ports/IResetCodeDigest.js";
import type { IPasswordResetRepository } from "../../domain/repositories/IPasswordResetRepository.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import type { IPasswordHasher } from "../../domain/services/IPasswordHasher.js";

const MIN_PASSWORD_LENGTH = 8;
const MAX_ATTEMPTS = 5;

export type ResetPasswordSuccess = {
  readonly reset: true;
};

export type ResetPasswordError =
  | { readonly code: "PASSWORD_TOO_SHORT" }
  | { readonly code: "INVALID_CODE" };

function normalizeCode(raw: string): string | null {
  const digits = raw.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(digits)) {
    return null;
  }
  return digits;
}

export class ResetPasswordUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly resets: IPasswordResetRepository,
    private readonly digest: IResetCodeDigest,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: {
    readonly email: string;
    readonly code: string;
    readonly password: string;
  }): Promise<Result<ResetPasswordSuccess, ResetPasswordError>> {
    if (input.password.length < MIN_PASSWORD_LENGTH) {
      return err({ code: "PASSWORD_TOO_SHORT" });
    }

    const email = input.email.trim().toLowerCase();
    const code = normalizeCode(input.code);
    if (code === null) {
      return err({ code: "INVALID_CODE" });
    }

    const record = await this.resets.findByEmail(email);
    if (record === null || record.expiresAt.getTime() <= Date.now()) {
      if (record !== null) {
        await this.resets.deleteByEmail(email);
      }
      return err({ code: "INVALID_CODE" });
    }

    if (!this.digest.matches(code, record.codeHash)) {
      const attempts = await this.resets.incrementAttempts(email);
      if (attempts >= MAX_ATTEMPTS) {
        await this.resets.deleteByEmail(email);
      }
      return err({ code: "INVALID_CODE" });
    }

    const user = await this.users.findByEmail(email);
    if (user === null || user.status !== "ACTIVE") {
      await this.resets.deleteByEmail(email);
      return err({ code: "INVALID_CODE" });
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    await this.users.updateUser(user.withPasswordHash(passwordHash));
    await this.resets.deleteByEmail(email);

    return ok({ reset: true });
  }
}
