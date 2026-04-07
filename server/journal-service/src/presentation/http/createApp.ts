import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import type { SaveJournalEntryUseCase } from "../../application/use-cases/SaveJournalEntryUseCase.js";
import type { GetMonthlyJournalUseCase } from "../../application/use-cases/GetMonthlyJournalUseCase.js";
import type { GetTodayEntryUseCase } from "../../application/use-cases/GetTodayEntryUseCase.js";
import { JournalController } from "./controllers/JournalController.js";
import { createAuthMiddleware } from "./middlewares/AuthMiddleware.js";

export type AppDependencies = {
  readonly saveJournalEntryUseCase: SaveJournalEntryUseCase;
  readonly getMonthlyJournalUseCase: GetMonthlyJournalUseCase;
  readonly getTodayEntryUseCase: GetTodayEntryUseCase;
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
  const c = new JournalController(
    deps.saveJournalEntryUseCase,
    deps.getMonthlyJournalUseCase,
    deps.getTodayEntryUseCase,
  );

  app.use(cors());
  app.use(express.json());

  app.post("/journal", authMiddleware, (req, res, next) => { void c.save(req, res).catch(next); });
  app.get("/journal/today", authMiddleware, (req, res, next) => { void c.getToday(req, res).catch(next); });
  app.get("/journal/month/:year/:month", authMiddleware, (req, res, next) => { void c.getMonthly(req, res).catch(next); });

  app.use(handleAsyncError);

  return app;
}
