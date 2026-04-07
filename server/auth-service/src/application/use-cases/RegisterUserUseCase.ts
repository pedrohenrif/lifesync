import { randomUUID } from "node:crypto";
import { err, ok, type Result } from "../result.js";
import type { RegisterUserDto } from "../dtos/RegisterUserDto.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import type { IPasswordHasher } from "../../domain/services/IPasswordHasher.js";
import { User, type UserValidationError } from "../../domain/entities/User.js";

const MIN_PASSWORD_LENGTH = 8;

export type RegisterUserSuccess = {
  readonly id: string;
  readonly email: string;
  readonly createdAt: string;
};

export type RegisterUserError =
  | { readonly code: "EMAIL_ALREADY_EXISTS" }
  | { readonly code: "PASSWORD_TOO_SHORT" }
  | UserValidationError;

export class RegisterUserUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(
    dto: RegisterUserDto,
  ): Promise<Result<RegisterUserSuccess, RegisterUserError>> {
    if (dto.password.length < MIN_PASSWORD_LENGTH) {
      return err({ code: "PASSWORD_TOO_SHORT" });
    }

    const email = dto.email.trim().toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing !== null) {
      return err({ code: "EMAIL_ALREADY_EXISTS" });
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const now = new Date();
    const created = User.create({
      id: randomUUID(),
      email,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    if (!created.ok) {
      return err(created.error);
    }

    await this.users.save(created.user);

    return ok({
      id: created.user.id,
      email: created.user.email,
      createdAt: created.user.createdAt.toISOString(),
    });
  }
}
