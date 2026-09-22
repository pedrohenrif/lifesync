import type { Request, Response } from "express";
import { z } from "zod";
import type { CalendarOperationError } from "../../../application/errors.js";
import type { StartGoogleAuthUseCase } from "../../../application/use-cases/StartGoogleAuthUseCase.js";
import type { CompleteGoogleAuthUseCase } from "../../../application/use-cases/CompleteGoogleAuthUseCase.js";
import type { GetConnectionStatusUseCase } from "../../../application/use-cases/GetConnectionStatusUseCase.js";
import type { DisconnectGoogleUseCase } from "../../../application/use-cases/DisconnectGoogleUseCase.js";
import type { ListEventsUseCase } from "../../../application/use-cases/ListEventsUseCase.js";
import type { CreateEventUseCase } from "../../../application/use-cases/CreateEventUseCase.js";
import type { UpdateEventUseCase } from "../../../application/use-cases/UpdateEventUseCase.js";
import type { DeleteEventUseCase } from "../../../application/use-cases/DeleteEventUseCase.js";

const isoDateSchema = z
  .string()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: "Invalid ISO date" });

const rangeQuerySchema = z.object({
  start: isoDateSchema,
  end: isoDateSchema,
});

const createEventBodySchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(4000).nullish().transform((v) => v ?? null),
  location: z.string().trim().max(300).nullish().transform((v) => v ?? null),
  start: isoDateSchema,
  end: isoDateSchema,
  isAllDay: z.boolean().default(false),
});

const updateEventBodySchema = z
  .object({
    title: z.string().trim().min(1).max(300).optional(),
    description: z.string().trim().max(4000).nullable().optional(),
    location: z.string().trim().max(300).nullable().optional(),
    start: isoDateSchema.optional(),
    end: isoDateSchema.optional(),
    isAllDay: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: "Empty update" })
  // Mover um evento exige os dois extremos: o Google rejeita start sem end.
  .refine((body) => (body.start === undefined) === (body.end === undefined), {
    message: "start and end must be provided together",
  });

const oauthCallbackQuerySchema = z.object({
  code: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  error: z.string().min(1).optional(),
});

/** Express tipa params como `string | string[]`; aqui só faz sentido um id único. */
function readIdParam(value: string | readonly string[] | undefined): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  return value;
}

function statusForOperationError(error: CalendarOperationError): number {
  switch (error.code) {
    case "NOT_CONNECTED":
    case "CONNECTION_BROKEN":
      return 409;
    case "CALENDAR_EVENT_NOT_FOUND":
      return 404;
    case "CALENDAR_TIMEOUT":
      return 504;
    case "GOOGLE_UNAVAILABLE":
    case "CALENDAR_UPSTREAM_ERROR":
    case "CALENDAR_INVALID_RESPONSE":
      return 502;
    case "TITLE_REQUIRED":
    case "INVALID_DATE":
    case "END_BEFORE_START":
      return 400;
  }
}

export class CalendarController {
  constructor(
    private readonly startGoogleAuthUseCase: StartGoogleAuthUseCase,
    private readonly completeGoogleAuthUseCase: CompleteGoogleAuthUseCase,
    private readonly getConnectionStatusUseCase: GetConnectionStatusUseCase,
    private readonly disconnectGoogleUseCase: DisconnectGoogleUseCase,
    private readonly listEventsUseCase: ListEventsUseCase,
    private readonly createEventUseCase: CreateEventUseCase,
    private readonly updateEventUseCase: UpdateEventUseCase,
    private readonly deleteEventUseCase: DeleteEventUseCase,
    private readonly appUrl: string,
  ) {}

  async getConnection(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (userId === undefined) {
      res.status(401).json({ error: { code: "UNAUTHORIZED" } });
      return;
    }
    res.status(200).json(await this.getConnectionStatusUseCase.execute(userId));
  }

  startConnection(req: Request, res: Response): void {
    const userId = req.user?.id;
    if (userId === undefined) {
      res.status(401).json({ error: { code: "UNAUTHORIZED" } });
      return;
    }

    const result = this.startGoogleAuthUseCase.execute(userId);
    if (!result.ok) {
      res.status(503).json({ error: result.error });
      return;
    }
    res.status(200).json(result.value);
  }

  /**
   * Chamado pelo próprio Google, sem header de autenticação: a identidade do
   * usuário vem do `state` assinado. Sempre redireciona de volta para a agenda.
   */
  async oauthCallback(req: Request, res: Response): Promise<void> {
    const query = oauthCallbackQuerySchema.safeParse(req.query);
    if (!query.success) {
      this.redirectToAgenda(res, "invalid_request");
      return;
    }
    if (query.data.error !== undefined) {
      this.redirectToAgenda(res, "access_denied");
      return;
    }

    const { code, state } = query.data;
    if (code === undefined || state === undefined) {
      this.redirectToAgenda(res, "invalid_request");
      return;
    }

    const result = await this.completeGoogleAuthUseCase.execute({ code, state });
    this.redirectToAgenda(res, result.ok ? null : result.error.code.toLowerCase());
  }

  async disconnect(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (userId === undefined) {
      res.status(401).json({ error: { code: "UNAUTHORIZED" } });
      return;
    }
    await this.disconnectGoogleUseCase.execute(userId);
    res.status(204).send();
  }

  async listEvents(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (userId === undefined) {
      res.status(401).json({ error: { code: "UNAUTHORIZED" } });
      return;
    }

    const query = rangeQuerySchema.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", issues: query.error.issues } });
      return;
    }

    const result = await this.listEventsUseCase.execute(userId, query.data);
    if (!result.ok) {
      res.status(statusForOperationError(result.error)).json({ error: result.error });
      return;
    }
    res.status(200).json({ events: result.value });
  }

  async createEvent(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (userId === undefined) {
      res.status(401).json({ error: { code: "UNAUTHORIZED" } });
      return;
    }

    const body = createEventBodySchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", issues: body.error.issues } });
      return;
    }

    const result = await this.createEventUseCase.execute(userId, body.data);
    if (!result.ok) {
      res.status(statusForOperationError(result.error)).json({ error: result.error });
      return;
    }
    res.status(201).json({ event: result.value });
  }

  async updateEvent(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (userId === undefined) {
      res.status(401).json({ error: { code: "UNAUTHORIZED" } });
      return;
    }

    const eventId = readIdParam(req.params.id);
    if (eventId === null) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR" } });
      return;
    }

    const body = updateEventBodySchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", issues: body.error.issues } });
      return;
    }

    const result = await this.updateEventUseCase.execute(userId, eventId, body.data);
    if (!result.ok) {
      res.status(statusForOperationError(result.error)).json({ error: result.error });
      return;
    }
    res.status(200).json({ event: result.value });
  }

  async deleteEvent(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (userId === undefined) {
      res.status(401).json({ error: { code: "UNAUTHORIZED" } });
      return;
    }

    const eventId = readIdParam(req.params.id);
    if (eventId === null) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR" } });
      return;
    }

    const result = await this.deleteEventUseCase.execute(userId, eventId);
    if (!result.ok) {
      res.status(statusForOperationError(result.error)).json({ error: result.error });
      return;
    }
    res.status(204).send();
  }

  private redirectToAgenda(res: Response, errorCode: string | null): void {
    const status = errorCode === null ? "google=connected" : `google_error=${errorCode}`;
    res.redirect(`${this.appUrl}/agenda?${status}`);
  }
}
