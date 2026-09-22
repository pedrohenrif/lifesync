import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import type { CreateTripUseCase } from "../../application/use-cases/CreateTripUseCase.js";
import type { ListTripsUseCase } from "../../application/use-cases/ListTripsUseCase.js";
import type { GetTripUseCase } from "../../application/use-cases/GetTripUseCase.js";
import type { UpdateTripUseCase } from "../../application/use-cases/UpdateTripUseCase.js";
import type { DeleteTripUseCase } from "../../application/use-cases/DeleteTripUseCase.js";
import type { AddPackingItemUseCase } from "../../application/use-cases/AddPackingItemUseCase.js";
import type { UpdatePackingItemUseCase } from "../../application/use-cases/UpdatePackingItemUseCase.js";
import type { RemovePackingItemUseCase } from "../../application/use-cases/RemovePackingItemUseCase.js";
import type { AddChecklistItemUseCase } from "../../application/use-cases/AddChecklistItemUseCase.js";
import type { UpdateChecklistItemUseCase } from "../../application/use-cases/UpdateChecklistItemUseCase.js";
import type { RemoveChecklistItemUseCase } from "../../application/use-cases/RemoveChecklistItemUseCase.js";
import { TripsController } from "./controllers/TripsController.js";
import { createAuthMiddleware } from "./middlewares/AuthMiddleware.js";

export type AppDependencies = {
  readonly createTripUseCase: CreateTripUseCase;
  readonly listTripsUseCase: ListTripsUseCase;
  readonly getTripUseCase: GetTripUseCase;
  readonly updateTripUseCase: UpdateTripUseCase;
  readonly deleteTripUseCase: DeleteTripUseCase;
  readonly addPackingItemUseCase: AddPackingItemUseCase;
  readonly updatePackingItemUseCase: UpdatePackingItemUseCase;
  readonly removePackingItemUseCase: RemovePackingItemUseCase;
  readonly addChecklistItemUseCase: AddChecklistItemUseCase;
  readonly updateChecklistItemUseCase: UpdateChecklistItemUseCase;
  readonly removeChecklistItemUseCase: RemoveChecklistItemUseCase;
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
  const c = new TripsController(
    deps.createTripUseCase,
    deps.listTripsUseCase,
    deps.getTripUseCase,
    deps.updateTripUseCase,
    deps.deleteTripUseCase,
    deps.addPackingItemUseCase,
    deps.updatePackingItemUseCase,
    deps.removePackingItemUseCase,
    deps.addChecklistItemUseCase,
    deps.updateChecklistItemUseCase,
    deps.removeChecklistItemUseCase,
  );

  app.use(cors());
  app.use(express.json({ limit: "256kb" }));

  app.get("/health", (_req, res) => {
    res.status(200).json({ service: "trip-service", status: "ok" });
  });

  app.post("/trips", authMiddleware, (req, res, next) => {
    void c.create(req, res).catch(next);
  });
  app.get("/trips", authMiddleware, (req, res, next) => {
    void c.list(req, res).catch(next);
  });
  app.get("/trips/:id", authMiddleware, (req, res, next) => {
    void c.get(req, res).catch(next);
  });
  app.patch("/trips/:id", authMiddleware, (req, res, next) => {
    void c.update(req, res).catch(next);
  });
  app.delete("/trips/:id", authMiddleware, (req, res, next) => {
    void c.remove(req, res).catch(next);
  });

  app.post("/trips/:id/packing", authMiddleware, (req, res, next) => {
    void c.addPackingItem(req, res).catch(next);
  });
  app.patch("/trips/:id/packing/:itemId", authMiddleware, (req, res, next) => {
    void c.updatePackingItem(req, res).catch(next);
  });
  app.delete("/trips/:id/packing/:itemId", authMiddleware, (req, res, next) => {
    void c.removePackingItem(req, res).catch(next);
  });

  app.post("/trips/:id/checklist", authMiddleware, (req, res, next) => {
    void c.addChecklistItem(req, res).catch(next);
  });
  app.patch("/trips/:id/checklist/:itemId", authMiddleware, (req, res, next) => {
    void c.updateChecklistItem(req, res).catch(next);
  });
  app.delete("/trips/:id/checklist/:itemId", authMiddleware, (req, res, next) => {
    void c.removeChecklistItem(req, res).catch(next);
  });

  app.use(handleAsyncError);

  return app;
}
