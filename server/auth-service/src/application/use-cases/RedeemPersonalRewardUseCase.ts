import { err, ok, type Result } from "../result.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";

export type RedeemPersonalRewardSuccess = {
  readonly coins: number;
};

export type RedeemPersonalRewardError =
  | { readonly code: "USER_NOT_FOUND" }
  | { readonly code: "REWARD_NOT_FOUND" }
  | { readonly code: "INSUFFICIENT_COINS" };

export class RedeemPersonalRewardUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(
    userId: string,
    rewardId: string,
  ): Promise<Result<RedeemPersonalRewardSuccess, RedeemPersonalRewardError>> {
    const user = await this.users.findById(userId);
    if (user === null) {
      return err({ code: "USER_NOT_FOUND" });
    }

    const reward = user.personalRewards.find((r) => r.id === rewardId);
    if (reward === undefined) {
      return err({ code: "REWARD_NOT_FOUND" });
    }

    if (user.coins < reward.costCoins) {
      return err({ code: "INSUFFICIENT_COINS" });
    }

    const updated = user.withGamificationDelta({
      totalXp: 0,
      coins: -reward.costCoins,
    });
    await this.users.updateUser(updated);

    return ok({ coins: updated.coins });
  }
}
