import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import type { GetMeUseCase } from "../../application/use-cases/GetMeUseCase.js";
import type { LoginUseCase } from "../../application/use-cases/LoginUseCase.js";
import type { RegisterUserUseCase } from "../../application/use-cases/RegisterUserUseCase.js";
import type { ListPendingUsersUseCase } from "../../application/use-cases/ListPendingUsersUseCase.js";
import type { ReviewUserUseCase } from "../../application/use-cases/ReviewUserUseCase.js";
import { AuthController } from "./controllers/AuthController.js";
import { AdminController } from "./controllers/AdminController.js";
import { createAuthMiddleware } from "./middlewares/AuthMiddleware.js";
import { createAdminMiddleware } from "./middlewares/AdminMiddleware.js";
import { healthRouter } from "./routes/healthRoutes.js";

export type AppDependencies = {
  readonly registerUserUseCase: RegisterUserUseCase;
  readonly loginUseCase: LoginUseCase;
  readonly getMeUseCase: GetMeUseCase;
  readonly listPendingUsersUseCase: ListPendingUsersUseCase;
  readonly reviewUserUseCase: ReviewUserUseCase;
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
  const adminMiddleware = createAdminMiddleware();

  const authController = new AuthController(
    deps.registerUserUseCase,
    deps.loginUseCase,
    deps.getMeUseCase,
  );

  const adminController = new AdminController(
    deps.listPendingUsersUseCase,
    deps.reviewUserUseCase,
  );

  app.use(cors());
  app.use(express.json());
  app.use("/health", healthRouter);

  app.post("/auth/register", (req, res, next) => {
    void authController.register(req, res).catch(next);
  });
  app.post("/auth/login", (req, res, next) => {
    void authController.login(req, res).catch(next);
  });
  app.get("/auth/me", authMiddleware, (req, res, next) => {
    void authController.me(req, res).catch(next);
  });

  app.get("/auth/admin/users/pending", authMiddleware, adminMiddleware, (req, res, next) => {
    void adminController.listPending(req, res).catch(next);
  });
  app.patch("/auth/admin/users/:id/status", authMiddleware, adminMiddleware, (req, res, next) => {
    void adminController.reviewUser(req, res).catch(next);
  });

  app.use(handleAsyncError);

  return app;
}
