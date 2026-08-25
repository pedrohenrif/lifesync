import express from "express";
import cors from "cors";
import { createAuthMiddleware } from "./middlewares/AuthMiddleware.js";
import { FinanceController } from "./controllers/FinanceController.js";
import { InvestmentController } from "./controllers/InvestmentController.js";
import type { CreateTransactionUseCase } from "../../application/use-cases/CreateTransactionUseCase.js";
import type { GetFinancialSummaryUseCase } from "../../application/use-cases/GetFinancialSummaryUseCase.js";
import type { DeleteTransactionUseCase } from "../../application/use-cases/DeleteTransactionUseCase.js";
import type { UpdateTransactionUseCase } from "../../application/use-cases/UpdateTransactionUseCase.js";
import type { GetFinanceAnalyticsUseCase } from "../../application/use-cases/GetFinanceAnalyticsUseCase.js";
import type { CreateInvestmentUseCase } from "../../application/use-cases/CreateInvestmentUseCase.js";
import type { ListInvestmentsUseCase } from "../../application/use-cases/ListInvestmentsUseCase.js";
import type { UpdateInvestmentBalanceUseCase } from "../../application/use-cases/UpdateInvestmentBalanceUseCase.js";
import type { AddInvestmentContributionUseCase } from "../../application/use-cases/AddInvestmentContributionUseCase.js";
import type { DeleteInvestmentUseCase } from "../../application/use-cases/DeleteInvestmentUseCase.js";
import type { RenameInvestmentUseCase } from "../../application/use-cases/RenameInvestmentUseCase.js";

export type AppDependencies = {
  readonly jwtSecret: string;
  readonly createTransactionUseCase: CreateTransactionUseCase;
  readonly getFinancialSummaryUseCase: GetFinancialSummaryUseCase;
  readonly deleteTransactionUseCase: DeleteTransactionUseCase;
  readonly updateTransactionUseCase: UpdateTransactionUseCase;
  readonly getFinanceAnalyticsUseCase: GetFinanceAnalyticsUseCase;
  readonly createInvestmentUseCase: CreateInvestmentUseCase;
  readonly listInvestmentsUseCase: ListInvestmentsUseCase;
  readonly updateInvestmentBalanceUseCase: UpdateInvestmentBalanceUseCase;
  readonly addInvestmentContributionUseCase: AddInvestmentContributionUseCase;
  readonly deleteInvestmentUseCase: DeleteInvestmentUseCase;
  readonly renameInvestmentUseCase: RenameInvestmentUseCase;
};

export function createApp(deps: AppDependencies) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  const authMiddleware = createAuthMiddleware(deps.jwtSecret);

  const financeController = new FinanceController(
    deps.createTransactionUseCase,
    deps.getFinancialSummaryUseCase,
    deps.deleteTransactionUseCase,
    deps.updateTransactionUseCase,
    deps.getFinanceAnalyticsUseCase,
  );

  const investmentController = new InvestmentController(
    deps.createInvestmentUseCase,
    deps.listInvestmentsUseCase,
    deps.updateInvestmentBalanceUseCase,
    deps.addInvestmentContributionUseCase,
    deps.deleteInvestmentUseCase,
    deps.renameInvestmentUseCase,
  );

  app.post("/transactions", authMiddleware, financeController.create);
  app.get("/transactions/summary", authMiddleware, financeController.summary);
  app.get("/finance/analytics", authMiddleware, financeController.analytics);
  app.patch("/transactions/:id", authMiddleware, financeController.update);
  app.delete("/transactions/:id", authMiddleware, financeController.remove);

  app.post("/investments", authMiddleware, investmentController.create);
  app.get("/investments", authMiddleware, investmentController.list);
  app.patch("/investments/:id/balance", authMiddleware, investmentController.updateCurrentBalance);
  app.patch("/investments/:id/contribute", authMiddleware, investmentController.contribute);
  app.patch("/investments/:id/name", authMiddleware, investmentController.rename);
  app.delete("/investments/:id", authMiddleware, investmentController.remove);

  return app;
}
