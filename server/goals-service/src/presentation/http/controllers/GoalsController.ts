import type { Request, Response } from "express";
import { z } from "zod";
import type { CreateGoalUseCase } from "../../../application/use-cases/CreateGoalUseCase.js";
import type { ListUserGoalsUseCase } from "../../../application/use-cases/ListUserGoalsUseCase.js";
import type { UpdateGoalUseCase } from "../../../application/use-cases/UpdateGoalUseCase.js";
import type { DeleteGoalUseCase } from "../../../application/use-cases/DeleteGoalUseCase.js";
import type { AddTaskToGoalUseCase } from "../../../application/use-cases/AddTaskToGoalUseCase.js";
import type { ToggleGoalTaskUseCase } from "../../../application/use-cases/ToggleGoalTaskUseCase.js";
import type { RemoveTaskFromGoalUseCase } from "../../../application/use-cases/RemoveTaskFromGoalUseCase.js";

const VALID_CATEGORIES = ["STUDY", "PERSONAL", "BUSINESS", "FAMILY", "DREAMS", "OTHER"] as const;

const createGoalBodySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(VALID_CATEGORIES),
  targetDate: z.string().optional(),
});

const updateGoalBodySchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  status: z.string().optional(),
  category: z.enum(VALID_CATEGORIES).optional(),
  targetDate: z.string().nullable().optional(),
});

const addTaskBodySchema = z.object({
  title: z.string().min(1),
});

function extractUserId(req: Request, res: Response): string | undefined {
  const userId = req.user?.id;
  if (userId === undefined) {
    res.status(401).json({ error: { code: "UNAUTHORIZED" } });
  }
  return userId;
}

function extractParamId(req: Request, res: Response, name: string): string | undefined {
  const id = req.params[name];
  if (typeof id !== "string" || id.length === 0) {
    res.status(400).json({ error: { code: `MISSING_${name.toUpperCase()}` } });
    return undefined;
  }
  return id;
}

const ERROR_STATUS_MAP: Record<string, number> = {
  GOAL_NOT_FOUND: 404,
  TASK_NOT_FOUND: 404,
  FORBIDDEN: 403,
  INVALID_CATEGORY: 400,
  TASK_TITLE_REQUIRED: 400,
};

function httpStatusForError(code: string): number {
  return ERROR_STATUS_MAP[code] ?? 400;
}

export class GoalsController {
  constructor(
    private readonly createGoalUseCase: CreateGoalUseCase,
    private readonly listUserGoalsUseCase: ListUserGoalsUseCase,
    private readonly updateGoalUseCase: UpdateGoalUseCase,
    private readonly deleteGoalUseCase: DeleteGoalUseCase,
    private readonly addTaskUseCase: AddTaskToGoalUseCase,
    private readonly toggleTaskUseCase: ToggleGoalTaskUseCase,
    private readonly removeTaskUseCase: RemoveTaskFromGoalUseCase,
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    const userId = extractUserId(req, res);
    if (userId === undefined) return;

    const parsed = createGoalBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: "INVALID_BODY", issues: parsed.error.flatten() } });
      return;
    }

    const result = await this.createGoalUseCase.execute(userId, parsed.data);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json({ goal: result.value });
  }

  async list(req: Request, res: Response): Promise<void> {
    const userId = extractUserId(req, res);
    if (userId === undefined) return;

    const rawCategory = req.query.category;
    const category =
      typeof rawCategory === "string" && rawCategory.length > 0
        ? rawCategory
        : undefined;

    const result = await this.listUserGoalsUseCase.execute(userId, { category });
    if (!result.ok) {
      res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR" } });
      return;
    }
    res.status(200).json({ goals: result.value });
  }

  async update(req: Request, res: Response): Promise<void> {
    const userId = extractUserId(req, res);
    if (userId === undefined) return;

    const goalId = extractParamId(req, res, "id");
    if (goalId === undefined) return;

    const parsed = updateGoalBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: "INVALID_BODY", issues: parsed.error.flatten() } });
      return;
    }

    const result = await this.updateGoalUseCase.execute(goalId, userId, parsed.data);
    if (!result.ok) {
      res.status(httpStatusForError(result.error.code)).json({ error: result.error });
      return;
    }

    res.status(200).json({ goal: result.value });
  }

  async remove(req: Request, res: Response): Promise<void> {
    const userId = extractUserId(req, res);
    if (userId === undefined) return;

    const goalId = extractParamId(req, res, "id");
    if (goalId === undefined) return;

    const result = await this.deleteGoalUseCase.execute(goalId, userId);
    if (!result.ok) {
      res.status(httpStatusForError(result.error.code)).json({ error: result.error });
      return;
    }

    res.status(204).end();
  }

  /* ─── Sub-tasks ─── */

  async addTask(req: Request, res: Response): Promise<void> {
    const userId = extractUserId(req, res);
    if (userId === undefined) return;

    const goalId = extractParamId(req, res, "id");
    if (goalId === undefined) return;

    const parsed = addTaskBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: "INVALID_BODY", issues: parsed.error.flatten() } });
      return;
    }

    const result = await this.addTaskUseCase.execute(goalId, userId, parsed.data.title);
    if (!result.ok) {
      res.status(httpStatusForError(result.error.code)).json({ error: result.error });
      return;
    }

    res.status(201).json(result.value);
  }

  async toggleTask(req: Request, res: Response): Promise<void> {
    const userId = extractUserId(req, res);
    if (userId === undefined) return;

    const goalId = extractParamId(req, res, "id");
    if (goalId === undefined) return;

    const taskId = extractParamId(req, res, "taskId");
    if (taskId === undefined) return;

    const result = await this.toggleTaskUseCase.execute(goalId, userId, taskId);
    if (!result.ok) {
      res.status(httpStatusForError(result.error.code)).json({ error: result.error });
      return;
    }

    res.status(200).json(result.value);
  }

  async removeTask(req: Request, res: Response): Promise<void> {
    const userId = extractUserId(req, res);
    if (userId === undefined) return;

    const goalId = extractParamId(req, res, "id");
    if (goalId === undefined) return;

    const taskId = extractParamId(req, res, "taskId");
    if (taskId === undefined) return;

    const result = await this.removeTaskUseCase.execute(goalId, userId, taskId);
    if (!result.ok) {
      res.status(httpStatusForError(result.error.code)).json({ error: result.error });
      return;
    }

    res.status(200).json(result.value);
  }
}
