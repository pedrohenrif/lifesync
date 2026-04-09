import { err, ok, type Result } from "../result.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import type { PrimaryFocus } from "../../domain/entities/User.js";
import { toPublicAuthUserDto, type PublicAuthUserDto } from "../mappers/userPublicDto.js";

export type CompleteOnboardingInput = {
  readonly name: string;
  readonly primaryFocus?: PrimaryFocus;
};

export type CompleteOnboardingError =
  | { readonly code: "USER_NOT_FOUND" }
  | { readonly code: "NAME_REQUIRED" };

export class CompleteOnboardingUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(
    userId: string,
    input: CompleteOnboardingInput,
  ): Promise<Result<{ readonly user: PublicAuthUserDto }, CompleteOnboardingError>> {
    const name = input.name.trim();
    if (name.length === 0) {
      return err({ code: "NAME_REQUIRED" });
    }

    const existing = await this.users.findById(userId);
    if (existing === null) {
      return err({ code: "USER_NOT_FOUND" });
    }

    const updated = await this.users.completeOnboarding(userId, {
      name,
      ...(input.primaryFocus !== undefined ? { primaryFocus: input.primaryFocus } : {}),
    });
    if (updated === null) {
      return err({ code: "USER_NOT_FOUND" });
    }

    return ok({
      user: toPublicAuthUserDto(updated),
    });
  }
}
