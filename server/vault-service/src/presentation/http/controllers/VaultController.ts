import type { Request, Response } from "express";
import { z } from "zod";
import type { CreateNoteUseCase } from "../../../application/use-cases/CreateNoteUseCase.js";
import type { GetNotesByUserUseCase } from "../../../application/use-cases/GetNotesByUserUseCase.js";
import type { UpdateNoteUseCase } from "../../../application/use-cases/UpdateNoteUseCase.js";
import type { DeleteNoteUseCase } from "../../../application/use-cases/DeleteNoteUseCase.js";
import type { GetVaultTagsUseCase } from "../../../application/use-cases/GetVaultTagsUseCase.js";
import {
  MAX_TAGS_PER_NOTE,
  NOTE_CATEGORIES,
  NOTE_STAGES,
  NOTE_TYPES,
} from "../../../domain/entities/VaultNote.js";
import { paginationQuerySchema, toPaginationMeta } from "../pagination.js";

const tagsSchema = z.array(z.string().min(1)).max(MAX_TAGS_PER_NOTE);

const createNoteBodySchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(NOTE_TYPES),
  category: z.enum(NOTE_CATEGORIES).optional(),
  stage: z.enum(NOTE_STAGES).optional(),
  summary: z.string().optional(),
  tags: tagsSchema.optional(),
  sourceUrl: z.string().optional(),
  isFavorite: z.boolean().optional(),
  goalId: z.string().optional(),
});

const updateNoteBodySchema = z
  .object({
    title: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    type: z.enum(NOTE_TYPES).optional(),
    category: z.enum(NOTE_CATEGORIES).optional(),
    stage: z.enum(NOTE_STAGES).optional(),
    summary: z.string().nullable().optional(),
    tags: tagsSchema.optional(),
    sourceUrl: z.string().nullable().optional(),
    isFavorite: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    goalId: z.string().nullable().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: "EMPTY_UPDATE" });

// z.coerce.boolean() considera "false" verdadeiro, então lemos a flag explicitamente.
const queryFlagSchema = z
  .enum(["true", "false", "1", "0"])
  .optional()
  .transform((raw) => raw === "true" || raw === "1");

// `tags` aceita lista separada por vírgula (ex.: ?tags=produto,marketing).
const listNotesQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  type: z.enum(NOTE_TYPES).optional(),
  category: z.enum(NOTE_CATEGORIES).optional(),
  stage: z.enum(NOTE_STAGES).optional(),
  goalId: z.string().optional(),
  onlyFavorites: queryFlagSchema,
  includeArchived: queryFlagSchema,
  tags: z
    .string()
    .optional()
    .transform((raw) =>
      raw === undefined
        ? []
        : raw
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter((t) => t.length > 0),
    ),
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
    private readonly updateNoteUseCase: UpdateNoteUseCase,
    private readonly deleteNoteUseCase: DeleteNoteUseCase,
    private readonly getTagsUseCase: GetVaultTagsUseCase,
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

    const parsedQuery = listNotesQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      res
        .status(400)
        .json({ error: { code: "INVALID_QUERY", issues: parsedQuery.error.flatten() } });
      return;
    }

    const { page, pageSize, ...filter } = parsedQuery.data;
    const result = await this.getNotesUseCase.execute(userId, { page, pageSize }, filter);
    if (!result.ok) {
      res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR" } });
      return;
    }

    res
      .status(200)
      .json({ notes: result.value.items, pagination: toPaginationMeta(result.value) });
  }

  async listTags(req: Request, res: Response): Promise<void> {
    const userId = extractUserId(req, res);
    if (userId === undefined) return;

    const result = await this.getTagsUseCase.execute(userId);
    if (!result.ok) {
      res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR" } });
      return;
    }

    res.status(200).json(result.value);
  }

  async update(req: Request, res: Response): Promise<void> {
    const userId = extractUserId(req, res);
    if (userId === undefined) return;

    const noteId = req.params.id;
    if (typeof noteId !== "string" || noteId.length === 0) {
      res.status(400).json({ error: { code: "MISSING_NOTE_ID" } });
      return;
    }

    const parsed = updateNoteBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: "INVALID_BODY", issues: parsed.error.flatten() } });
      return;
    }

    const result = await this.updateNoteUseCase.execute(noteId, userId, parsed.data);
    if (!result.ok) {
      res.status(httpStatusForError(result.error.code)).json({ error: result.error });
      return;
    }

    res.status(200).json({ note: result.value });
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
