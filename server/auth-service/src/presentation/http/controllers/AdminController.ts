import type { Request, Response } from "express";
import { z } from "zod";
import type { ListPendingUsersUseCase } from "../../../application/use-cases/ListPendingUsersUseCase.js";
import type { ReviewUserUseCase } from "../../../application/use-cases/ReviewUserUseCase.js";

const reviewBodySchema = z.object({
  status: z.enum(["ACTIVE", "REJECTED"]),
});

export class AdminController {
  constructor(
    private readonly listPendingUsersUseCase: ListPendingUsersUseCase,
    private readonly reviewUserUseCase: ReviewUserUseCase,
  ) {}

  async listPending(_req: Request, res: Response): Promise<void> {
    const result = await this.listPendingUsersUseCase.execute();
    if (!result.ok) {
      res.status(500).json({ error: { code: "INTERNAL_ERROR" } });
      return;
    }
    res.status(200).json(result.value);
  }

  async reviewUser(req: Request, res: Response): Promise<void> {
    const userId = req.params.id;
    if (typeof userId !== "string" || userId.length === 0) {
      res.status(400).json({ error: { code: "INVALID_USER_ID" } });
      return;
    }

    const parsed = reviewBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: "INVALID_BODY", issues: parsed.error.flatten() } });
      return;
    }

    const result = await this.reviewUserUseCase.execute(userId, parsed.data.status);
    if (!result.ok) {
      const statusCode = result.error.code === "USER_NOT_FOUND" ? 404 : 400;
      res.status(statusCode).json({ error: result.error });
      return;
    }

    res.status(200).json(result.value);
  }
}
