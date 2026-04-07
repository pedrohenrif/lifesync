import type { Request, Response } from "express";
import { z } from "zod";
import type { CreateNoteUseCase } from "../../../application/use-cases/CreateNoteUseCase.js";
import type { GetNotesByUserUseCase } from "../../../application/use-cases/GetNotesByUserUseCase.js";
import type { DeleteNoteUseCase } from "../../../application/use-cases/DeleteNoteUseCase.js";

const createNoteBodySchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(["NOTE", "LINK"]),
  goalId: z.string().optional(),
});

function extractUserId(req: Request, res: Response): string | undefined {
  const userId = req.user?.id;
  if (userId === undefined) {
    res.status(401).json({ error: { code: "UNAUTHORIZED" } });
  }
  return userId;
}

const ERROR_STATUS_MAP: Record<string, number> = {
  NOTE_NOT_FOUND: 404,
  FORBIDDEN: 403,
};

function httpStatusForError(code: string): number {
  return ERROR_STATUS_MAP[code] ?? 400;
}

export class VaultController {
  constructor(
    private readonly createNoteUseCase: CreateNoteUseCase,
    private readonly getNotesUseCase: GetNotesByUserUseCase,
    private readonly deleteNoteUseCase: DeleteNoteUseCase,
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    const userId = extractUserId(req, res);
    if (userId === undefined) return;

    const parsed = createNoteBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: "INVALID_BODY", issues: parsed.error.flatten() } });
      return;
    }

    const result = await this.createNoteUseCase.execute(userId, parsed.data);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json({ note: result.value });
  }

  async list(req: Request, res: Response): Promise<void> {
    const userId = extractUserId(req, res);
    if (userId === undefined) return;

    const result = await this.getNotesUseCase.execute(userId);
    if (!result.ok) {
      res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR" } });
      return;
    }

    res.status(200).json({ notes: result.value });
  }

  async remove(req: Request, res: Response): Promise<void> {
    const userId = extractUserId(req, res);
    if (userId === undefined) return;

    const noteId = req.params.id;
    if (typeof noteId !== "string" || noteId.length === 0) {
      res.status(400).json({ error: { code: "MISSING_NOTE_ID" } });
      return;
    }

    const result = await this.deleteNoteUseCase.execute(noteId, userId);
    if (!result.ok) {
      res.status(httpStatusForError(result.error.code)).json({ error: result.error });
      return;
    }

    res.status(204).end();
  }
}
