import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import type { CreateHabitUseCase } from "../../application/use-cases/CreateHabitUseCase.js";
import type { ListHabitsUseCase } from "../../application/use-cases/ListHabitsUseCase.js";
import type { ToggleHabitUseCase } from "../../application/use-cases/ToggleHabitUseCase.js";
import type { UpdateHabitUseCase } from "../../application/use-cases/UpdateHabitUseCase.js";
import type { DeleteHabitUseCase } from "../../application/use-cases/DeleteHabitUseCase.js";
import { HabitsController } from "./controllers/HabitsController.js";
import { createAuthMiddleware } from "./middlewares/AuthMiddleware.js";

export type AppDependencies = {
  readonly createHabitUseCase: CreateHabitUseCase;
  readonly listHabitsUseCase: ListHabitsUseCase;
  readonly toggleHabitUseCase: ToggleHabitUseCase;
  readonly updateHabitUseCase: UpdateHabitUseCase;
  readonly deleteHabitUseCase: DeleteHabitUseCase;
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
  const c = new HabitsController(
    deps.createHabitUseCase,
    deps.listHabitsUseCase,
    deps.toggleHabitUseCase,
    deps.updateHabitUseCase,
    deps.deleteHabitUseCase,
  );

  app.use(cors());
  app.use(express.json());

  app.post("/habits", authMiddleware, (req, res, next) => { void c.create(req, res).catch(next); });
  app.get("/habits", authMiddleware, (req, res, next) => { void c.list(req, res).catch(next); });
  app.patch("/habits/:id/toggle", authMiddleware, (req, res, next) => { void c.toggle(req, res).catch(next); });
  app.patch("/habits/:id", authMiddleware, (req, res, next) => { void c.update(req, res).catch(next); });
  app.delete("/habits/:id", authMiddleware, (req, res, next) => { void c.remove(req, res).catch(next); });

  app.use(handleAsyncError);

  return app;
}
