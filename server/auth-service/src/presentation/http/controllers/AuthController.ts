import type { Request, Response } from "express";
import { z } from "zod";
import type { CompleteOnboardingUseCase } from "../../../application/use-cases/CompleteOnboardingUseCase.js";
import type { GetMeUseCase } from "../../../application/use-cases/GetMeUseCase.js";
import type { LoginUseCase } from "../../../application/use-cases/LoginUseCase.js";
import type { RegisterUserUseCase } from "../../../application/use-cases/RegisterUserUseCase.js";
import type { CreatePersonalRewardUseCase } from "../../../application/use-cases/CreatePersonalRewardUseCase.js";
import type { RedeemPersonalRewardUseCase } from "../../../application/use-cases/RedeemPersonalRewardUseCase.js";

const registerBodySchema = z.object({
  name: z.string().optional().default(""),
  email: z.string(),
  password: z.string(),
});

const loginBodySchema = z.object({
  email: z.string(),
  password: z.string(),
});

const onboardingBodySchema = z.object({
  name: z.string().min(1),
  primaryFocus: z.enum(["FINANCE", "HABITS", "GOALS"]).optional(),
});

const personalRewardBodySchema = z.object({
  title: z.string().min(1),
  costCoins: z.number().int().positive(),
});

export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly completeOnboardingUseCase: CompleteOnboardingUseCase,
    private readonly createPersonalRewardUseCase: CreatePersonalRewardUseCase,
    private readonly redeemPersonalRewardUseCase: RedeemPersonalRewardUseCase,
  ) {}

  async register(req: Request, res: Response): Promise<void> {
    const parsed = registerBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "INVALID_BODY",
          issues: parsed.error.flatten(),
        },
      });
      return;
    }

    const result = await this.registerUserUseCase.execute(parsed.data);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json({ user: result.value });
  }

  async login(req: Request, res: Response): Promise<void> {
    const parsed = loginBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "INVALID_BODY",
          issues: parsed.error.flatten(),
        },
      });
      return;
    }

    const result = await this.loginUseCase.execute(parsed.data);
    if (!result.ok) {
      const statusCode = result.error.code === "ACCOUNT_PENDING" || result.error.code === "ACCOUNT_REJECTED" ? 403 : 400;
      res.status(statusCode).json({ error: result.error });
      return;
    }

    res.status(200).json(result.value);
  }

  async me(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (userId === undefined) {
      res.status(401).json({ error: { code: "UNAUTHORIZED" } });
      return;
    }

    const result = await this.getMeUseCase.execute(userId);
    if (!result.ok) {
      res.status(404).json({ error: result.error });
      return;
    }

    res.status(200).json({ user: result.value });
  }

  async completeOnboarding(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (userId === undefined) {
      res.status(401).json({ error: { code: "UNAUTHORIZED" } });
      return;
    }

    const parsed = onboardingBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "INVALID_BODY",
          issues: parsed.error.flatten(),
        },
      });
      return;
    }

    const result = await this.completeOnboardingUseCase.execute(userId, parsed.data);
    if (!result.ok) {
      const status = result.error.code === "USER_NOT_FOUND" ? 404 : 400;
      res.status(status).json({ error: result.error });
      return;
    }

    res.status(200).json({ user: result.value.user });
  }

  async createPersonalReward(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (userId === undefined) {
      res.status(401).json({ error: { code: "UNAUTHORIZED" } });
      return;
    }

    const parsed = personalRewardBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: { code: "INVALID_BODY", issues: parsed.error.flatten() },
      });
      return;
    }

    const result = await this.createPersonalRewardUseCase.execute(userId, parsed.data);
    if (!result.ok) {
      const status = result.error.code === "USER_NOT_FOUND" ? 404 : 400;
      res.status(status).json({ error: result.error });
      return;
    }

    res.status(201).json({ reward: result.value });
  }

  async redeemPersonalReward(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (userId === undefined) {
      res.status(401).json({ error: { code: "UNAUTHORIZED" } });
      return;
    }

    const rewardId = req.params.id;
    if (typeof rewardId !== "string" || rewardId.length === 0) {
      res.status(400).json({ error: { code: "INVALID_REWARD_ID" } });
      return;
    }

    const result = await this.redeemPersonalRewardUseCase.execute(userId, rewardId);
    if (!result.ok) {
      if (result.error.code === "USER_NOT_FOUND") {
        res.status(404).json({ error: result.error });
        return;
      }
      if (result.error.code === "REWARD_NOT_FOUND") {
        res.status(404).json({ error: result.error });
        return;
      }
      if (result.error.code === "INSUFFICIENT_COINS") {
        res.status(402).json({ error: result.error });
        return;
      }
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(200).json({ coins: result.value.coins });
  }
}
