import type { User } from "../../domain/entities/User.js";
import { computeLevelProgress } from "../../domain/services/gamificationMath.js";

export type PublicAuthUserDto = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly hasCompletedOnboarding: boolean;
  readonly primaryFocus: string | null;
  readonly level: number;
  readonly currentXp: number;
  readonly xpToNextLevel: number;
  readonly totalXp: number;
  readonly coins: number;
  readonly attributes: {
    readonly health: number;
    readonly finance: number;
    readonly focus: number;
    readonly knowledge: number;
    readonly social: number;
  };
  readonly personalRewards: readonly {
    readonly id: string;
    readonly title: string;
    readonly costCoins: number;
    readonly createdAt: string;
  }[];
};

export function toPublicAuthUserDto(user: User): PublicAuthUserDto {
  const prog = computeLevelProgress(user.totalXp);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    hasCompletedOnboarding: user.hasCompletedOnboarding,
    primaryFocus: user.primaryFocus,
    level: prog.level,
    currentXp: prog.currentXp,
    xpToNextLevel: prog.xpToNextLevel,
    totalXp: prog.totalXp,
    coins: user.coins,
    attributes: { ...user.attributes },
    personalRewards: user.personalRewards.map((r) => ({
      id: r.id,
      title: r.title,
      costCoins: r.costCoins,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}
