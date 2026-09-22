import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import type { StartGoogleAuthUseCase } from "../../application/use-cases/StartGoogleAuthUseCase.js";
import type { CompleteGoogleAuthUseCase } from "../../application/use-cases/CompleteGoogleAuthUseCase.js";
import type { GetConnectionStatusUseCase } from "../../application/use-cases/GetConnectionStatusUseCase.js";
import type { DisconnectGoogleUseCase } from "../../application/use-cases/DisconnectGoogleUseCase.js";
import type { ListEventsUseCase } from "../../application/use-cases/ListEventsUseCase.js";
import type { CreateEventUseCase } from "../../application/use-cases/CreateEventUseCase.js";
import type { UpdateEventUseCase } from "../../application/use-cases/UpdateEventUseCase.js";
import type { DeleteEventUseCase } from "../../application/use-cases/DeleteEventUseCase.js";
import { CalendarController } from "./controllers/CalendarController.js";
import { createAuthMiddleware } from "./middlewares/AuthMiddleware.js";

export type AppDependencies = {
  readonly startGoogleAuthUseCase: StartGoogleAuthUseCase;
  readonly completeGoogleAuthUseCase: CompleteGoogleAuthUseCase;
  readonly getConnectionStatusUseCase: GetConnectionStatusUseCase;
  readonly disconnectGoogleUseCase: DisconnectGoogleUseCase;
  readonly listEventsUseCase: ListEventsUseCase;
  readonly createEventUseCase: CreateEventUseCase;
  readonly updateEventUseCase: UpdateEventUseCase;
  readonly deleteEventUseCase: DeleteEventUseCase;
  readonly jwtSecret: string;
  readonly appUrl: string;
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
  const c = new CalendarController(
    deps.startGoogleAuthUseCase,
    deps.completeGoogleAuthUseCase,
    deps.getConnectionStatusUseCase,
    deps.disconnectGoogleUseCase,
    deps.listEventsUseCase,
    deps.createEventUseCase,
    deps.updateEventUseCase,
    deps.deleteEventUseCase,
    deps.appUrl,
  );

  app.use(cors());
  app.use(express.json({ limit: "128kb" }));

  app.get("/health", (_req, res) => {
    res.status(200).json({ service: "calendar-service", status: "ok" });
  });

  // Rota pública: quem chama é o Google, autenticado pelo state assinado.
  app.get("/calendar/oauth/callback", (req, res, next) => {
    void c.oauthCallback(req, res).catch(next);
  });

  app.get("/calendar/connection", authMiddleware, (req, res, next) => {
    void c.getConnection(req, res).catch(next);
  });
  app.post("/calendar/connection/start", authMiddleware, (req, res) => {
    c.startConnection(req, res);
  });
  app.delete("/calendar/connection", authMiddleware, (req, res, next) => {
    void c.disconnect(req, res).catch(next);
  });

  app.get("/calendar/events", authMiddleware, (req, res, next) => {
    void c.listEvents(req, res).catch(next);
  });
  app.post("/calendar/events", authMiddleware, (req, res, next) => {
    void c.createEvent(req, res).catch(next);
  });
  app.patch("/calendar/events/:id", authMiddleware, (req, res, next) => {
    void c.updateEvent(req, res).catch(next);
  });
  app.delete("/calendar/events/:id", authMiddleware, (req, res, next) => {
    void c.deleteEvent(req, res).catch(next);
  });

  app.use(handleAsyncError);

  return app;
}
