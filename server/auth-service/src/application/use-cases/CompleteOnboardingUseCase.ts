import { err, ok, type Result } from "../result.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import type { PrimaryFocus } from "../../domain/entities/User.js";

export type CompleteOnboardingInput = {
  readonly name: string;
  readonly primaryFocus?: PrimaryFocus;
};

export type PublicAuthUser = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly hasCompletedOnboarding: boolean;
  readonly primaryFocus: PrimaryFocus | null;
};

export type CompleteOnboardingError =
  | { readonly code: "USER_NOT_FOUND" }
  | { readonly code: "NAME_REQUIRED" };

export class CompleteOnboardingUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(
    userId: string,
    input: CompleteOnboardingInput,
  ): Promise<Result<{ readonly user: PublicAuthUser }, CompleteOnboardingError>> {
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
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        hasCompletedOnboarding: updated.hasCompletedOnboarding,
        primaryFocus: updated.primaryFocus,
      },
    });
  }
}
