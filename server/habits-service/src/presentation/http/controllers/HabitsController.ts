import type { Request, Response } from "express";
import { z } from "zod";
import type { CreateHabitUseCase } from "../../../application/use-cases/CreateHabitUseCase.js";
import type { ListHabitsUseCase } from "../../../application/use-cases/ListHabitsUseCase.js";
import type { ToggleHabitUseCase } from "../../../application/use-cases/ToggleHabitUseCase.js";
import type { UpdateHabitUseCase } from "../../../application/use-cases/UpdateHabitUseCase.js";
import type { DeleteHabitUseCase } from "../../../application/use-cases/DeleteHabitUseCase.js";

const habitCategorySchema = z.enum(["SAUDE", "FOCO", "FINANCAS", "PESSOAL"]);

const createHabitBodySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  icon: z.string().min(1).max(64).optional(),
  category: habitCategorySchema.optional(),
  frequencyType: z.enum(["DAILY", "WEEKLY_TARGET"]).optional(),
  targetDaysPerWeek: z.number().min(1).max(6).optional(),
});

const updateHabitBodySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  icon: z.string().min(1).max(64).optional(),
  category: habitCategorySchema.optional(),
  frequencyType: z.enum(["DAILY", "WEEKLY_TARGET"]).optional(),
  targetDaysPerWeek: z.number().min(1).max(6).nullable().optional(),
});

const toggleBodySchema = z.object({
  date: z.string(),
});

function extractUserId(req: Request, res: Response): string | undefined {
  const userId = req.user?.id;
  if (userId === undefined) {
    res.status(401).json({ error: { code: "UNAUTHORIZED" } });
  }
  return userId;
}

function extractParamId(req: Request, res: Response): string | undefined {
  const id = req.params.id;
  if (typeof id !== "string" || id.length === 0) {
    res.status(400).json({ error: { code: "MISSING_HABIT_ID" } });
    return undefined;
  }
  return id;
}

const ERROR_STATUS_MAP: Record<string, number> = {
  HABIT_NOT_FOUND: 404,
  FORBIDDEN: 403,
};

function httpStatusForError(code: string): number {
  return ERROR_STATUS_MAP[code] ?? 400;
}

export class HabitsController {
  constructor(
    private readonly createHabitUseCase: CreateHabitUseCase,
    private readonly listHabitsUseCase: ListHabitsUseCase,
    private readonly toggleHabitUseCase: ToggleHabitUseCase,
    private readonly updateHabitUseCase: UpdateHabitUseCase,
    private readonly deleteHabitUseCase: DeleteHabitUseCase,
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    const userId = extractUserId(req, res);
    if (userId === undefined) return;

    const parsed = createHabitBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: { code: "INVALID_BODY", issues: parsed.error.flatten() },
      });
      return;
    }

    const result = await this.createHabitUseCase.execute(userId, parsed.data);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json({ habit: result.value });
  }

  async list(req: Request, res: Response): Promise<void> {
    const userId = extractUserId(req, res);
    if (userId === undefined) return;

    const result = await this.listHabitsUseCase.execute(userId);
    if (!result.ok) {
      res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR" } });
      return;
    }
    res.status(200).json({ habits: result.value });
  }

  async toggle(req: Request, res: Response): Promise<void> {
    const userId = extractUserId(req, res);
    if (userId === undefined) return;

    const habitId = extractParamId(req, res);
    if (habitId === undefined) return;

    const parsed = toggleBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: { code: "INVALID_BODY", issues: parsed.error.flatten() },
      });
      return;
    }

    const result = await this.toggleHabitUseCase.execute(
      habitId,
      userId,
      parsed.data.date,
    );
    if (!result.ok) {
      res.status(httpStatusForError(result.error.code)).json({ error: result.error });
      return;
    }

    res.status(200).json({ habit: result.value });
  }

  async update(req: Request, res: Response): Promise<void> {
    const userId = extractUserId(req, res);
    if (userId === undefined) return;

    const habitId = extractParamId(req, res);
    if (habitId === undefined) return;

    const parsed = updateHabitBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: { code: "INVALID_BODY", issues: parsed.error.flatten() },
      });
      return;
    }

    const result = await this.updateHabitUseCase.execute(habitId, userId, parsed.data);
    if (!result.ok) {
      res.status(httpStatusForError(result.error.code)).json({ error: result.error });
      return;
    }

    res.status(200).json({ habit: result.value });
  }

  async remove(req: Request, res: Response): Promise<void> {
    const userId = extractUserId(req, res);
    if (userId === undefined) return;

    const habitId = extractParamId(req, res);
    if (habitId === undefined) return;

    const result = await this.deleteHabitUseCase.execute(habitId, userId);
    if (!result.ok) {
      res.status(httpStatusForError(result.error.code)).json({ error: result.error });
      return;
    }

    res.status(204).end();
  }
}
