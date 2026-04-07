import { err, ok, type Result } from "../result.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import type { UserStatus } from "../../domain/entities/User.js";

export type ReviewUserSuccess = {
  readonly id: string;
  readonly status: UserStatus;
};

export type ReviewUserError =
  | { readonly code: "USER_NOT_FOUND" }
  | { readonly code: "INVALID_DECISION" }
  | { readonly code: "USER_ALREADY_REVIEWED" };

export class ReviewUserUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(
    userId: string,
    decision: string,
  ): Promise<Result<ReviewUserSuccess, ReviewUserError>> {
    if (decision !== "ACTIVE" && decision !== "REJECTED") {
      return err({ code: "INVALID_DECISION" });
    }

    const user = await this.users.findById(userId);
    if (user === null) {
      return err({ code: "USER_NOT_FOUND" });
    }

    if (user.status !== "PENDING") {
      return err({ code: "USER_ALREADY_REVIEWED" });
    }

    await this.users.updateStatus(userId, decision);

    return ok({ id: userId, status: decision });
  }
}
