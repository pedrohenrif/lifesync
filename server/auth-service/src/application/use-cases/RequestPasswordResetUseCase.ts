import { randomInt } from "node:crypto";
import { err, ok, type Result } from "../result.js";
import type { IEmailSender } from "../ports/IEmailSender.js";
import type { IResetCodeDigest } from "../ports/IResetCodeDigest.js";
import type { IPasswordResetRepository } from "../../domain/repositories/IPasswordResetRepository.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";

const CODE_TTL_MS = 10 * 60 * 1000;
const COOLDOWN_MS = 60 * 1000;

export type RequestPasswordResetSuccess = {
  readonly accepted: true;
};

export type RequestPasswordResetError =
  | { readonly code: "EMAIL_NOT_CONFIGURED" }
  | { readonly code: "EMAIL_SEND_FAILED" };

function generateNumericCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export class RequestPasswordResetUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly resets: IPasswordResetRepository,
    private readonly digest: IResetCodeDigest,
    private readonly email: IEmailSender,
  ) {}

  async execute(
    rawEmail: string,
  ): Promise<Result<RequestPasswordResetSuccess, RequestPasswordResetError>> {
    if (!this.email.isConfigured) {
      return err({ code: "EMAIL_NOT_CONFIGURED" });
    }

    const email = rawEmail.trim().toLowerCase();
    const user = await this.users.findByEmail(email);

    // Resposta genérica: não revela se o e-mail existe ou se a conta está ativa.
    if (user === null || user.status !== "ACTIVE") {
      return ok({ accepted: true });
    }

    const existing = await this.resets.findByEmail(email);
    const now = Date.now();
    if (
      existing !== null &&
      now - existing.createdAt.getTime() < COOLDOWN_MS &&
      existing.expiresAt.getTime() > now
    ) {
      return ok({ accepted: true });
    }

    const code = generateNumericCode();
    const createdAt = new Date();
    await this.resets.replaceForEmail({
      email,
      codeHash: this.digest.hash(code),
      expiresAt: new Date(createdAt.getTime() + CODE_TTL_MS),
      createdAt,
    });

    try {
      await this.email.sendPasswordResetCode({ to: email, code });
    } catch (cause) {
      await this.resets.deleteByEmail(email);
      console.error("Failed to send password reset email", cause);
      return err({ code: "EMAIL_SEND_FAILED" });
    }

    return ok({ accepted: true });
  }
}
