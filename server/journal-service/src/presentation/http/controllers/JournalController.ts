import type { Request, Response } from "express";
import { z } from "zod";
import type { SaveJournalEntryUseCase } from "../../../application/use-cases/SaveJournalEntryUseCase.js";
import type { GetMonthlyJournalUseCase } from "../../../application/use-cases/GetMonthlyJournalUseCase.js";
import type { GetTodayEntryUseCase } from "../../../application/use-cases/GetTodayEntryUseCase.js";

const VALID_MOODS = ["TERRIBLE", "BAD", "NEUTRAL", "GOOD", "EXCELLENT"] as const;

const saveBodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mood: z.enum(VALID_MOODS),
  note: z.string().optional(),
});

function extractUserId(req: Request, res: Response): string | undefined {
  const userId = req.user?.id;
  if (userId === undefined) {
    res.status(401).json({ error: { code: "UNAUTHORIZED" } });
  }
  return userId;
}

export class JournalController {
  constructor(
    private readonly saveUseCase: SaveJournalEntryUseCase,
    private readonly getMonthlyUseCase: GetMonthlyJournalUseCase,
    private readonly getTodayUseCase: GetTodayEntryUseCase,
  ) {}

  async save(req: Request, res: Response): Promise<void> {
    const userId = extractUserId(req, res);
    if (userId === undefined) return;

    const parsed = saveBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: "INVALID_BODY", issues: parsed.error.flatten() } });
      return;
    }

    const result = await this.saveUseCase.execute(userId, parsed.data);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }

    const status = result.value.isNew ? 201 : 200;
    res.status(status).json({ entry: result.value });
  }

  async getMonthly(req: Request, res: Response): Promise<void> {
    const userId = extractUserId(req, res);
    if (userId === undefined) return;

    const yearParam = req.params.year;
    const monthParam = req.params.month;

    if (typeof yearParam !== "string" || typeof monthParam !== "string") {
      res.status(400).json({ error: { code: "INVALID_PARAMS" } });
      return;
    }

    const year = Number.parseInt(yearParam, 10);
    const month = Number.parseInt(monthParam, 10);

    if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
      res.status(400).json({ error: { code: "INVALID_PARAMS" } });
      return;
    }

    const result = await this.getMonthlyUseCase.execute(userId, year, month);
    if (!result.ok) {
      res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR" } });
      return;
    }

    res.status(200).json({ entries: result.value });
  }

  async getToday(req: Request, res: Response): Promise<void> {
    const userId = extractUserId(req, res);
    if (userId === undefined) return;

    const dateParam = req.query.date;
    if (typeof dateParam !== "string" || dateParam.length === 0) {
      res.status(400).json({ error: { code: "MISSING_DATE" } });
      return;
    }

    const result = await this.getTodayUseCase.execute(userId, dateParam);
    if (!result.ok) {
      res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR" } });
      return;
    }

    res.status(200).json({ entry: result.value });
  }
}
