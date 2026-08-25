import type { Request, Response } from "express";
import { z } from "zod";
import type { ParseFinanceCommandUseCase } from "../../../application/use-cases/ParseFinanceCommandUseCase.js";
import type { SuggestNoteMetadataUseCase } from "../../../application/use-cases/SuggestNoteMetadataUseCase.js";
import type { GetAiUsageUseCase } from "../../../application/use-cases/GetAiUsageUseCase.js";

const MAX_COMMAND_LENGTH = 600;
const MAX_NOTE_CONTENT_LENGTH = 6_000;

const financeCommandBodySchema = z.object({
  text: z.string().min(3).max(MAX_COMMAND_LENGTH),
});

const noteSuggestionBodySchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(MAX_NOTE_CONTENT_LENGTH),
  existingTags: z.array(z.string().min(1).max(24)).max(50).optional(),
});

/** 503 para indisponibilidade da IA, 429 para limites, 422 quando não há o que extrair. */
const ERROR_STATUS_MAP: Record<string, number> = {
  AI_DISABLED: 503,
  AI_TIMEOUT: 504,
  AI_UPSTREAM_ERROR: 502,
  AI_RATE_LIMITED: 429,
  AI_BUDGET_EXCEEDED: 429,
  AI_INVALID_OUTPUT: 502,
  NO_TRANSACTION_FOUND: 422,
};

function httpStatusForError(code: string): number {
  return ERROR_STATUS_MAP[code] ?? 500;
}

function extractUserId(req: Request, res: Response): string | undefined {
  const userId = req.user?.id;
  if (userId === undefined) {
    res.status(401).json({ error: { code: "UNAUTHORIZED" } });
  }
  return userId;
}

export class AiController {
  constructor(
    private readonly parseFinanceCommand: ParseFinanceCommandUseCase,
    private readonly suggestNoteMetadata: SuggestNoteMetadataUseCase,
    private readonly getAiUsage: GetAiUsageUseCase,
  ) {}

  readonly parseFinance = async (req: Request, res: Response): Promise<void> => {
    const userId = extractUserId(req, res);
    if (userId === undefined) return;

    const parsed = financeCommandBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: "INVALID_BODY", issues: parsed.error.flatten() } });
      return;
    }

    const result = await this.parseFinanceCommand.execute(userId, parsed.data.text, new Date());
    if (!result.ok) {
      res.status(httpStatusForError(result.error.code)).json({ error: result.error });
      return;
    }

    res.status(200).json({ drafts: result.value.drafts, usage: result.value.usage });
  };

  readonly suggestNote = async (req: Request, res: Response): Promise<void> => {
    const userId = extractUserId(req, res);
    if (userId === undefined) return;

    const parsed = noteSuggestionBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: "INVALID_BODY", issues: parsed.error.flatten() } });
      return;
    }

    const result = await this.suggestNoteMetadata.execute(userId, parsed.data);
    if (!result.ok) {
      res.status(httpStatusForError(result.error.code)).json({ error: result.error });
      return;
    }

    res.status(200).json({ suggestion: result.value.suggestion, usage: result.value.usage });
  };

  readonly usage = async (req: Request, res: Response): Promise<void> => {
    const userId = extractUserId(req, res);
    if (userId === undefined) return;

    const result = await this.getAiUsage.execute(userId);
    if (!result.ok) {
      res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR" } });
      return;
    }

    res.status(200).json(result.value);
  };
}
