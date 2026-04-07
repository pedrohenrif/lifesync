import type { Request, Response } from "express";
import { z } from "zod";
import type { CreateTransactionUseCase } from "../../../application/use-cases/CreateTransactionUseCase.js";
import type { GetFinancialSummaryUseCase } from "../../../application/use-cases/GetFinancialSummaryUseCase.js";
import type { DeleteTransactionUseCase } from "../../../application/use-cases/DeleteTransactionUseCase.js";

const createTransactionBodySchema = z.object({
  title: z.string().min(1),
  amount: z.number().positive(),
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().min(1),
  date: z.string().min(1),
  paymentMethod: z.enum(["DEBIT", "CREDIT"]).default("DEBIT"),
  isFixed: z.boolean().default(false),
  installments: z.number().int().min(1).max(48).optional(),
});

const ERROR_STATUS_MAP: Record<string, number> = {
  TRANSACTION_NOT_FOUND: 404,
  INVESTMENT_NOT_FOUND: 404,
  FORBIDDEN: 403,
  INVALID_DATE: 400,
  INVALID_INSTALLMENTS: 400,
  TITLE_REQUIRED: 400,
  USER_ID_REQUIRED: 400,
  INVALID_AMOUNT: 400,
  CATEGORY_REQUIRED: 400,
  INVALID_TYPE: 400,
  INVALID_PAYMENT_METHOD: 400,
  INVALID_INSTALLMENT: 400,
  NAME_REQUIRED: 400,
  INVALID_INVESTED_AMOUNT: 400,
  INVALID_BALANCE: 400,
};

function extractUserId(req: Request, res: Response): string | null {
  const userId = req.user?.id;
  if (typeof userId !== "string" || userId.length === 0) {
    res.status(401).json({ error: { code: "UNAUTHORIZED" } });
    return null;
  }
  return userId;
}

export class FinanceController {
  constructor(
    private readonly createTransaction: CreateTransactionUseCase,
    private readonly getFinancialSummary: GetFinancialSummaryUseCase,
    private readonly deleteTransaction: DeleteTransactionUseCase,
  ) {}

  readonly create = async (req: Request, res: Response): Promise<void> => {
    const userId = extractUserId(req, res);
    if (userId === null) return;

    const parsed = createTransactionBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", details: parsed.error.flatten() } });
      return;
    }

    const result = await this.createTransaction.execute(userId, parsed.data);
    if (!result.ok) {
      const status = ERROR_STATUS_MAP[result.error.code] ?? 400;
      res.status(status).json({ error: result.error });
      return;
    }

    res.status(201).json(result.value);
  };

  readonly summary = async (req: Request, res: Response): Promise<void> => {
    const userId = extractUserId(req, res);
    if (userId === null) return;

    const result = await this.getFinancialSummary.execute(userId);
    if (!result.ok) {
      res.status(500).json({ error: { code: "UNKNOWN_ERROR" } });
      return;
    }

    res.status(200).json(result.value);
  };

  readonly remove = async (req: Request, res: Response): Promise<void> => {
    const userId = extractUserId(req, res);
    if (userId === null) return;

    const transactionId = req.params.id;
    if (typeof transactionId !== "string" || transactionId.length === 0) {
      res.status(400).json({ error: { code: "INVALID_ID" } });
      return;
    }

    const result = await this.deleteTransaction.execute(transactionId, userId);
    if (!result.ok) {
      const status = ERROR_STATUS_MAP[result.error.code] ?? 400;
      res.status(status).json({ error: result.error });
      return;
    }

    res.status(204).end();
  };
}

export { extractUserId, ERROR_STATUS_MAP };
