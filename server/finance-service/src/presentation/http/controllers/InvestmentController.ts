import type { Request, Response } from "express";
import { z } from "zod";
import type { CreateInvestmentUseCase } from "../../../application/use-cases/CreateInvestmentUseCase.js";
import type { ListInvestmentsUseCase } from "../../../application/use-cases/ListInvestmentsUseCase.js";
import type { UpdateInvestmentBalanceUseCase } from "../../../application/use-cases/UpdateInvestmentBalanceUseCase.js";
import type { AddInvestmentContributionUseCase } from "../../../application/use-cases/AddInvestmentContributionUseCase.js";
import type { DeleteInvestmentUseCase } from "../../../application/use-cases/DeleteInvestmentUseCase.js";
import type { RenameInvestmentUseCase } from "../../../application/use-cases/RenameInvestmentUseCase.js";
import { extractUserId, ERROR_STATUS_MAP } from "./FinanceController.js";
import { paginationQuerySchema, toPaginationMeta } from "../pagination.js";

const createInvestmentBodySchema = z.object({
  name: z.string().min(1),
  investedAmount: z.number().nonnegative(),
});

const updateBalanceBodySchema = z.object({
  currentBalance: z.number(),
});

const contributeBodySchema = z.object({
  amount: z.number().positive(),
});

const renameBodySchema = z.object({
  name: z.string().min(1),
});

export class InvestmentController {
  constructor(
    private readonly createInvestment: CreateInvestmentUseCase,
    private readonly listInvestments: ListInvestmentsUseCase,
    private readonly updateBalance: UpdateInvestmentBalanceUseCase,
    private readonly addContribution: AddInvestmentContributionUseCase,
    private readonly deleteInvestment: DeleteInvestmentUseCase,
    private readonly renameInvestment: RenameInvestmentUseCase,
  ) {}

  readonly create = async (req: Request, res: Response): Promise<void> => {
    const userId = extractUserId(req, res);
    if (userId === null) return;

    const parsed = createInvestmentBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", details: parsed.error.flatten() } });
      return;
    }

    const result = await this.createInvestment.execute(userId, parsed.data);
    if (!result.ok) {
      const status = ERROR_STATUS_MAP[result.error.code] ?? 400;
      res.status(status).json({ error: result.error });
      return;
    }

    res.status(201).json({ investment: result.value });
  };

  readonly list = async (req: Request, res: Response): Promise<void> => {
    const userId = extractUserId(req, res);
    if (userId === null) return;

    const parsedQuery = paginationQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      res
        .status(400)
        .json({ error: { code: "INVALID_QUERY", details: parsedQuery.error.flatten() } });
      return;
    }

    const result = await this.listInvestments.execute(userId, parsedQuery.data);
    if (!result.ok) {
      res.status(500).json({ error: { code: "UNKNOWN_ERROR" } });
      return;
    }

    const { investments, ...totals } = result.value;
    res.status(200).json({
      ...totals,
      investments: investments.items,
      pagination: toPaginationMeta(investments),
    });
  };

  readonly updateCurrentBalance = async (req: Request, res: Response): Promise<void> => {
    const userId = extractUserId(req, res);
    if (userId === null) return;

    const investmentId = req.params.id;
    if (typeof investmentId !== "string" || investmentId.length === 0) {
      res.status(400).json({ error: { code: "INVALID_ID" } });
      return;
    }

    const parsed = updateBalanceBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", details: parsed.error.flatten() } });
      return;
    }

    const result = await this.updateBalance.execute(investmentId, userId, parsed.data.currentBalance);
    if (!result.ok) {
      const status = ERROR_STATUS_MAP[result.error.code] ?? 400;
      res.status(status).json({ error: result.error });
      return;
    }

    res.status(200).json(result.value);
  };

  readonly contribute = async (req: Request, res: Response): Promise<void> => {
    const userId = extractUserId(req, res);
    if (userId === null) return;

    const investmentId = req.params.id;
    if (typeof investmentId !== "string" || investmentId.length === 0) {
      res.status(400).json({ error: { code: "INVALID_ID" } });
      return;
    }

    const parsed = contributeBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", details: parsed.error.flatten() } });
      return;
    }

    const result = await this.addContribution.execute(investmentId, userId, parsed.data.amount);
    if (!result.ok) {
      const status = ERROR_STATUS_MAP[result.error.code] ?? 400;
      res.status(status).json({ error: result.error });
      return;
    }

    res.status(200).json(result.value);
  };

  readonly remove = async (req: Request, res: Response): Promise<void> => {
    const userId = extractUserId(req, res);
    if (userId === null) return;

    const investmentId = req.params.id;
    if (typeof investmentId !== "string" || investmentId.length === 0) {
      res.status(400).json({ error: { code: "INVALID_ID" } });
      return;
    }

    const result = await this.deleteInvestment.execute(investmentId, userId);
    if (!result.ok) {
      const status = ERROR_STATUS_MAP[result.error.code] ?? 400;
      res.status(status).json({ error: result.error });
      return;
    }

    res.status(204).end();
  };

  readonly rename = async (req: Request, res: Response): Promise<void> => {
    const userId = extractUserId(req, res);
    if (userId === null) return;

    const investmentId = req.params.id;
    if (typeof investmentId !== "string" || investmentId.length === 0) {
      res.status(400).json({ error: { code: "INVALID_ID" } });
      return;
    }

    const parsed = renameBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", details: parsed.error.flatten() } });
      return;
    }

    const result = await this.renameInvestment.execute(investmentId, userId, parsed.data.name);
    if (!result.ok) {
      const status = ERROR_STATUS_MAP[result.error.code] ?? 400;
      res.status(status).json({ error: result.error });
      return;
    }

    res.status(200).json(result.value);
  };
}
