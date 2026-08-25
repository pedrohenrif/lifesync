import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import type { CreateNoteUseCase } from "../../application/use-cases/CreateNoteUseCase.js";
import type { GetNotesByUserUseCase } from "../../application/use-cases/GetNotesByUserUseCase.js";
import type { UpdateNoteUseCase } from "../../application/use-cases/UpdateNoteUseCase.js";
import type { DeleteNoteUseCase } from "../../application/use-cases/DeleteNoteUseCase.js";
import type { GetVaultTagsUseCase } from "../../application/use-cases/GetVaultTagsUseCase.js";
import { VaultController } from "./controllers/VaultController.js";
import { createAuthMiddleware } from "./middlewares/AuthMiddleware.js";

export type AppDependencies = {
  readonly createNoteUseCase: CreateNoteUseCase;
  readonly getNotesUseCase: GetNotesByUserUseCase;
  readonly updateNoteUseCase: UpdateNoteUseCase;
  readonly deleteNoteUseCase: DeleteNoteUseCase;
  readonly getVaultTagsUseCase: GetVaultTagsUseCase;
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
  const c = new VaultController(
    deps.createNoteUseCase,
    deps.getNotesUseCase,
    deps.updateNoteUseCase,
    deps.deleteNoteUseCase,
    deps.getVaultTagsUseCase,
  );

  app.use(cors());
  app.use(express.json());

  app.post("/vault", authMiddleware, (req, res, next) => { void c.create(req, res).catch(next); });
  app.get("/vault", authMiddleware, (req, res, next) => { void c.list(req, res).catch(next); });
  app.get("/vault/tags", authMiddleware, (req, res, next) => { void c.listTags(req, res).catch(next); });
  app.patch("/vault/:id", authMiddleware, (req, res, next) => { void c.update(req, res).catch(next); });
  app.delete("/vault/:id", authMiddleware, (req, res, next) => { void c.remove(req, res).catch(next); });

  app.use(handleAsyncError);

  return app;
}
