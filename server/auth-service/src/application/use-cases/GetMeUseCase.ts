import { err, ok, type Result } from "../result.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";

export type GetMeSuccess = {
  readonly id: string;
  readonly email: string;
};

export type GetMeError = { readonly code: "USER_NOT_FOUND" };

export class GetMeUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(userId: string): Promise<Result<GetMeSuccess, GetMeError>> {
    const user = await this.users.findById(userId);
    if (user === null) {
      return err({ code: "USER_NOT_FOUND" });
    }

    return ok({
      id: user.id,
      email: user.email,
    });
  }
}
