import { err, ok, type Result } from "../result.js";
import type { LoginUserDto } from "../dtos/LoginUserDto.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import type { IPasswordHasher } from "../../domain/services/IPasswordHasher.js";
import type { ITokenGenerator } from "../../domain/services/ITokenGenerator.js";

export type LoginSuccess = {
  readonly token: string;
  readonly user: {
    readonly id: string;
    readonly email: string;
  };
};

export type LoginError = { readonly code: "INVALID_CREDENTIALS" };

export class LoginUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenGenerator: ITokenGenerator,
  ) {}

  async execute(dto: LoginUserDto): Promise<Result<LoginSuccess, LoginError>> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.users.findByEmail(email);
    if (user === null) {
      return err({ code: "INVALID_CREDENTIALS" });
    }

    const isValidPassword = await this.passwordHasher.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isValidPassword) {
      return err({ code: "INVALID_CREDENTIALS" });
    }

    const token = this.tokenGenerator.generate(user.id);
    return ok({
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  }
}
