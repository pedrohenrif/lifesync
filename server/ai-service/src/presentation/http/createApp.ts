import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import type { ParseFinanceCommandUseCase } from "../../application/use-cases/ParseFinanceCommandUseCase.js";
import type { SuggestNoteMetadataUseCase } from "../../application/use-cases/SuggestNoteMetadataUseCase.js";
import type { GetAiUsageUseCase } from "../../application/use-cases/GetAiUsageUseCase.js";
import { AiController } from "./controllers/AiController.js";
import { createAuthMiddleware } from "./middlewares/AuthMiddleware.js";

export type AppDependencies = {
  readonly parseFinanceCommandUseCase: ParseFinanceCommandUseCase;
  readonly suggestNoteMetadataUseCase: SuggestNoteMetadataUseCase;
  readonly getAiUsageUseCase: GetAiUsageUseCase;
  readonly jwtSecret: string;
};

function handleAsyncError(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(err);
  if (!res.headersSent) {
    res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR" } });
  }
}

export function createApp(deps: AppDependencies): Express {
  const app = express();
  const authMiddleware = createAuthMiddleware(deps.jwtSecret);
  const c = new AiController(
    deps.parseFinanceCommandUseCase,
    deps.suggestNoteMetadataUseCase,
    deps.getAiUsageUseCase,
  );

  app.use(cors());
  app.use(express.json({ limit: "128kb" }));

  app.get("/health", (_req, res) => {
    res.status(200).json({ service: "ai-service", status: "ok" });
  });

  app.post("/ai/finance/parse", authMiddleware, (req, res, next) => {
    void c.parseFinance(req, res).catch(next);
  });
  app.post("/ai/vault/suggest", authMiddleware, (req, res, next) => {
    void c.suggestNote(req, res).catch(next);
  });
  app.get("/ai/usage", authMiddleware, (req, res, next) => {
    void c.usage(req, res).catch(next);
  });

  app.use(handleAsyncError);

  return app;
}
