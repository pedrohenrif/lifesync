import type { Request, Response } from "express";
import { z } from "zod";
import type { ListPendingUsersUseCase } from "../../../application/use-cases/ListPendingUsersUseCase.js";
import type { ReviewUserUseCase } from "../../../application/use-cases/ReviewUserUseCase.js";
import { paginationQuerySchema, toPaginationMeta } from "../pagination.js";

const reviewBodySchema = z.object({
  status: z.enum(["ACTIVE", "REJECTED"]),
});

export class AdminController {
  constructor(
    private readonly listPendingUsersUseCase: ListPendingUsersUseCase,
    private readonly reviewUserUseCase: ReviewUserUseCase,
  ) {}

  async listPending(req: Request, res: Response): Promise<void> {
    const parsedQuery = paginationQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      res
        .status(400)
        .json({ error: { code: "INVALID_QUERY", issues: parsedQuery.error.flatten() } });
      return;
    }

    const result = await this.listPendingUsersUseCase.execute(parsedQuery.data);
    if (!result.ok) {
      res.status(500).json({ error: { code: "INTERNAL_ERROR" } });
      return;
    }
    res
      .status(200)
      .json({ users: result.value.users.items, pagination: toPaginationMeta(result.value.users) });
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
