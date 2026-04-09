import { randomUUID } from "node:crypto";
import { err, ok, type Result } from "../result.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";

export type CreatePersonalRewardSuccess = {
  readonly id: string;
  readonly title: string;
  readonly costCoins: number;
  readonly createdAt: string;
};

export type CreatePersonalRewardError =
  | { readonly code: "USER_NOT_FOUND" }
  | { readonly code: "TITLE_REQUIRED" }
  | { readonly code: "INVALID_COST" };

export class CreatePersonalRewardUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(
    userId: string,
    input: { readonly title: string; readonly costCoins: number },
  ): Promise<Result<CreatePersonalRewardSuccess, CreatePersonalRewardError>> {
    const title = input.title.trim();
    if (title.length === 0) {
      return err({ code: "TITLE_REQUIRED" });
    }
    const cost = Math.floor(input.costCoins);
    if (!Number.isFinite(cost) || cost < 1) {
      return err({ code: "INVALID_COST" });
    }

    const user = await this.users.findById(userId);
    if (user === null) {
      return err({ code: "USER_NOT_FOUND" });
    }

    const reward = {
      id: randomUUID(),
      title,
      costCoins: cost,
      createdAt: new Date(),
    };
    const updated = user.withPersonalRewards([...user.personalRewards, reward]);
    await this.users.updateUser(updated);

    return ok({
      id: reward.id,
      title: reward.title,
      costCoins: reward.costCoins,
      createdAt: reward.createdAt.toISOString(),
    });
  }
}
