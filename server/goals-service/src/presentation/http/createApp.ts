import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import type { CreateGoalUseCase } from "../../application/use-cases/CreateGoalUseCase.js";
import type { ListUserGoalsUseCase } from "../../application/use-cases/ListUserGoalsUseCase.js";
import type { UpdateGoalUseCase } from "../../application/use-cases/UpdateGoalUseCase.js";
import type { DeleteGoalUseCase } from "../../application/use-cases/DeleteGoalUseCase.js";
import type { AddTaskToGoalUseCase } from "../../application/use-cases/AddTaskToGoalUseCase.js";
import type { ToggleGoalTaskUseCase } from "../../application/use-cases/ToggleGoalTaskUseCase.js";
import type { RemoveTaskFromGoalUseCase } from "../../application/use-cases/RemoveTaskFromGoalUseCase.js";
import { GoalsController } from "./controllers/GoalsController.js";
import { createAuthMiddleware } from "./middlewares/AuthMiddleware.js";

export type AppDependencies = {
  readonly createGoalUseCase: CreateGoalUseCase;
  readonly listUserGoalsUseCase: ListUserGoalsUseCase;
  readonly updateGoalUseCase: UpdateGoalUseCase;
  readonly deleteGoalUseCase: DeleteGoalUseCase;
  readonly addTaskUseCase: AddTaskToGoalUseCase;
  readonly toggleTaskUseCase: ToggleGoalTaskUseCase;
  readonly removeTaskUseCase: RemoveTaskFromGoalUseCase;
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
  const c = new GoalsController(
    deps.createGoalUseCase,
    deps.listUserGoalsUseCase,
    deps.updateGoalUseCase,
    deps.deleteGoalUseCase,
    deps.addTaskUseCase,
    deps.toggleTaskUseCase,
    deps.removeTaskUseCase,
  );

  app.use(cors());
  app.use(express.json());

  app.post("/goals", authMiddleware, (req, res, next) => { void c.create(req, res).catch(next); });
  app.get("/goals", authMiddleware, (req, res, next) => { void c.list(req, res).catch(next); });
  app.patch("/goals/:id", authMiddleware, (req, res, next) => { void c.update(req, res).catch(next); });
  app.delete("/goals/:id", authMiddleware, (req, res, next) => { void c.remove(req, res).catch(next); });

  app.post("/goals/:id/tasks", authMiddleware, (req, res, next) => { void c.addTask(req, res).catch(next); });
  app.patch("/goals/:id/tasks/:taskId/toggle", authMiddleware, (req, res, next) => { void c.toggleTask(req, res).catch(next); });
  app.delete("/goals/:id/tasks/:taskId", authMiddleware, (req, res, next) => { void c.removeTask(req, res).catch(next); });

  app.use(handleAsyncError);

  return app;
}
