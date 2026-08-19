import cors from "cors";
import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import type { CreateHabitUseCase } from "../../application/use-cases/CreateHabitUseCase.js";
import type { ListHabitsUseCase } from "../../application/use-cases/ListHabitsUseCase.js";
import type { ToggleHabitUseCase } from "../../application/use-cases/ToggleHabitUseCase.js";
import type { UpdateHabitUseCase } from "../../application/use-cases/UpdateHabitUseCase.js";
import type { DeleteHabitUseCase } from "../../application/use-cases/DeleteHabitUseCase.js";
import type { ListUserIdsWithPendingHabitsTodayUseCase } from "../../application/use-cases/ListUserIdsWithPendingHabitsTodayUseCase.js";
import { HabitsController } from "./controllers/HabitsController.js";
import { InternalHabitsController } from "./controllers/InternalHabitsController.js";
import { createAuthMiddleware } from "./middlewares/AuthMiddleware.js";

export type AppDependencies = {
  readonly createHabitUseCase: CreateHabitUseCase;
  readonly listHabitsUseCase: ListHabitsUseCase;
  readonly toggleHabitUseCase: ToggleHabitUseCase;
  readonly updateHabitUseCase: UpdateHabitUseCase;
  readonly deleteHabitUseCase: DeleteHabitUseCase;
  readonly listUserIdsWithPendingHabitsTodayUseCase: ListUserIdsWithPendingHabitsTodayUseCase;
  readonly jwtSecret: string;
  readonly internalServiceKey: string;
};

function createInternalKeyMiddleware(secret: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (secret.length === 0) {
      res.status(503).json({ error: { code: "INTERNAL_ROUTES_NOT_CONFIGURED" } });
      return;
    }
    const key = req.header("x-internal-key");
    if (key !== secret) {
      res.status(401).json({ error: { code: "UNAUTHORIZED" } });
      return;
    }
    next();
  };
}

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
  const internalMiddleware = createInternalKeyMiddleware(deps.internalServiceKey);
  const c = new HabitsController(
    deps.createHabitUseCase,
    deps.listHabitsUseCase,
    deps.toggleHabitUseCase,
    deps.updateHabitUseCase,
    deps.deleteHabitUseCase,
  );
  const internalC = new InternalHabitsController(deps.listUserIdsWithPendingHabitsTodayUseCase);

  app.use(cors());
  app.use(express.json());

  app.get("/habits/internal/users-pending-today", internalMiddleware, (req, res, next) => {
    void internalC.listUsersPendingToday(req, res).catch(next);
  });

  app.post("/habits", authMiddleware, (req, res, next) => { void c.create(req, res).catch(next); });
  app.get("/habits", authMiddleware, (req, res, next) => { void c.list(req, res).catch(next); });
  app.patch("/habits/:id/toggle", authMiddleware, (req, res, next) => { void c.toggle(req, res).catch(next); });
  app.patch("/habits/:id", authMiddleware, (req, res, next) => { void c.update(req, res).catch(next); });
  app.delete("/habits/:id", authMiddleware, (req, res, next) => { void c.remove(req, res).catch(next); });

  app.use(handleAsyncError);

  return app;
}
