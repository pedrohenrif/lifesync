import type { Request, Response } from "express";
import { z } from "zod";
import type { TripOperationError } from "../../../application/errors.js";
import { PACKING_CATEGORIES, RESERVATION_TYPES } from "../../../domain/entities/Trip.js";
import type { CreateTripUseCase } from "../../../application/use-cases/CreateTripUseCase.js";
import type { ListTripsUseCase } from "../../../application/use-cases/ListTripsUseCase.js";
import type { GetTripUseCase } from "../../../application/use-cases/GetTripUseCase.js";
import type { UpdateTripUseCase } from "../../../application/use-cases/UpdateTripUseCase.js";
import type { DeleteTripUseCase } from "../../../application/use-cases/DeleteTripUseCase.js";
import type { AddPackingItemUseCase } from "../../../application/use-cases/AddPackingItemUseCase.js";
import type { UpdatePackingItemUseCase } from "../../../application/use-cases/UpdatePackingItemUseCase.js";
import type { RemovePackingItemUseCase } from "../../../application/use-cases/RemovePackingItemUseCase.js";
import type { AddChecklistItemUseCase } from "../../../application/use-cases/AddChecklistItemUseCase.js";
import type { UpdateChecklistItemUseCase } from "../../../application/use-cases/UpdateChecklistItemUseCase.js";
import type { RemoveChecklistItemUseCase } from "../../../application/use-cases/RemoveChecklistItemUseCase.js";
import type { AddReservationUseCase } from "../../../application/use-cases/AddReservationUseCase.js";
import type { UpdateReservationUseCase } from "../../../application/use-cases/UpdateReservationUseCase.js";
import type { RemoveReservationUseCase } from "../../../application/use-cases/RemoveReservationUseCase.js";
import type { AddItineraryItemUseCase } from "../../../application/use-cases/AddItineraryItemUseCase.js";
import type { UpdateItineraryItemUseCase } from "../../../application/use-cases/UpdateItineraryItemUseCase.js";
import type { RemoveItineraryItemUseCase } from "../../../application/use-cases/RemoveItineraryItemUseCase.js";
import { paginationQuerySchema, toPaginationMeta } from "../pagination.js";

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato YYYY-MM-DD")
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: "Data inválida" });

/**
 * z.coerce.boolean() considera qualquer string não vazia como true, inclusive
 * "false" — por isso a flag é lida como enum explícito.
 */
const queryFlagSchema = z
  .enum(["true", "false", "1", "0"])
  .optional()
  .transform((raw) => raw === "true" || raw === "1");

const listTripsQuerySchema = paginationQuerySchema.extend({
  includeArchived: queryFlagSchema,
});

const createTripBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  destination: z.string().trim().min(1).max(160),
  startDate: dateOnlySchema,
  endDate: dateOnlySchema,
  notes: z.string().trim().max(4000).nullish().transform((v) => v ?? null),
  budgetAmount: z.number().positive().nullable().optional().transform((v) => v ?? null),
});

const updateTripBodySchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    destination: z.string().trim().min(1).max(160).optional(),
    startDate: dateOnlySchema.optional(),
    endDate: dateOnlySchema.optional(),
    notes: z.string().trim().max(4000).nullable().optional(),
    budgetAmount: z.number().positive().nullable().optional(),
    isArchived: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: "Empty update" });

const addPackingItemBodySchema = z.object({
  name: z.string().trim().min(1).max(160),
  category: z.enum(PACKING_CATEGORIES).default("OUTRO"),
  quantity: z.coerce.number().int().min(1).max(999).default(1),
});

const updatePackingItemBodySchema = z
  .object({
    name: z.string().trim().min(1).max(160).optional(),
    category: z.enum(PACKING_CATEGORIES).optional(),
    quantity: z.coerce.number().int().min(1).max(999).optional(),
    isPacked: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: "Empty update" });

const addChecklistItemBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  dueDate: dateOnlySchema.nullish().transform((v) => v ?? null),
});

const updateChecklistItemBodySchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    dueDate: dateOnlySchema.nullable().optional(),
    isDone: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: "Empty update" });

/** Sem fuso, na hora local do destino — o mesmo motivo das datas date-only. */
const naiveDateTimeSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Use o formato YYYY-MM-DDTHH:mm")
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: "Data e hora inválidas" });

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use o formato HH:mm");

const optionalText = (max: number) =>
  z.string().trim().max(max).nullish().transform((v) => v ?? null);

const addReservationBodySchema = z.object({
  type: z.enum(RESERVATION_TYPES).default("OTHER"),
  title: z.string().trim().min(1).max(200),
  provider: optionalText(120),
  confirmationCode: optionalText(120),
  url: z.string().trim().url().max(2000).nullish().transform((v) => v ?? null),
  startAt: naiveDateTimeSchema.nullish().transform((v) => v ?? null),
  endAt: naiveDateTimeSchema.nullish().transform((v) => v ?? null),
  address: optionalText(300),
  notes: optionalText(2000),
});

const updateReservationBodySchema = z
  .object({
    type: z.enum(RESERVATION_TYPES).optional(),
    title: z.string().trim().min(1).max(200).optional(),
    provider: z.string().trim().max(120).nullable().optional(),
    confirmationCode: z.string().trim().max(120).nullable().optional(),
    url: z.string().trim().url().max(2000).nullable().optional(),
    startAt: naiveDateTimeSchema.nullable().optional(),
    endAt: naiveDateTimeSchema.nullable().optional(),
    address: z.string().trim().max(300).nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: "Empty update" });

const addItineraryItemBodySchema = z.object({
  date: dateOnlySchema,
  time: timeSchema.nullish().transform((v) => v ?? null),
  title: z.string().trim().min(1).max(200),
  description: optionalText(2000),
  location: optionalText(300),
});

const updateItineraryItemBodySchema = z
  .object({
    date: dateOnlySchema.optional(),
    time: timeSchema.nullable().optional(),
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    location: z.string().trim().max(300).nullable().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: "Empty update" });

function statusForError(error: TripOperationError): number {
  switch (error.code) {
    case "TRIP_NOT_FOUND":
    case "ITEM_NOT_FOUND":
      return 404;
    case "FORBIDDEN":
      return 403;
    case "USER_ID_REQUIRED":
    case "NAME_REQUIRED":
    case "DESTINATION_REQUIRED":
    case "INVALID_DATE":
    case "END_BEFORE_START":
    case "INVALID_BUDGET":
    case "ITEM_TITLE_REQUIRED":
    case "INVALID_QUANTITY":
    case "INVALID_CATEGORY":
    case "INVALID_RESERVATION_TYPE":
    case "INVALID_DATETIME":
    case "INVALID_TIME":
    case "RESERVATION_END_BEFORE_START":
      return 400;
  }
}

/** Express tipa params como `string | string[]`; aqui só faz sentido um id único. */
function readIdParam(value: string | readonly string[] | undefined): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  return value;
}

export class TripsController {
  constructor(
    private readonly createTripUseCase: CreateTripUseCase,
    private readonly listTripsUseCase: ListTripsUseCase,
    private readonly getTripUseCase: GetTripUseCase,
    private readonly updateTripUseCase: UpdateTripUseCase,
    private readonly deleteTripUseCase: DeleteTripUseCase,
    private readonly addPackingItemUseCase: AddPackingItemUseCase,
    private readonly updatePackingItemUseCase: UpdatePackingItemUseCase,
    private readonly removePackingItemUseCase: RemovePackingItemUseCase,
    private readonly addChecklistItemUseCase: AddChecklistItemUseCase,
    private readonly updateChecklistItemUseCase: UpdateChecklistItemUseCase,
    private readonly removeChecklistItemUseCase: RemoveChecklistItemUseCase,
    private readonly addReservationUseCase: AddReservationUseCase,
    private readonly updateReservationUseCase: UpdateReservationUseCase,
    private readonly removeReservationUseCase: RemoveReservationUseCase,
    private readonly addItineraryItemUseCase: AddItineraryItemUseCase,
    private readonly updateItineraryItemUseCase: UpdateItineraryItemUseCase,
    private readonly removeItineraryItemUseCase: RemoveItineraryItemUseCase,
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    const userId = this.requireUser(req, res);
    if (userId === null) return;

    const body = createTripBodySchema.safeParse(req.body);
    if (!body.success) {
      this.respondValidationError(res, body.error.issues);
      return;
    }

    const result = await this.createTripUseCase.execute(userId, body.data);
    if (!result.ok) {
      res.status(statusForError(result.error)).json({ error: result.error });
      return;
    }
    res.status(201).json({ trip: result.value });
  }

  async list(req: Request, res: Response): Promise<void> {
    const userId = this.requireUser(req, res);
    if (userId === null) return;

    const query = listTripsQuerySchema.safeParse(req.query);
    if (!query.success) {
      this.respondValidationError(res, query.error.issues);
      return;
    }

    const { page, pageSize, includeArchived } = query.data;
    const result = await this.listTripsUseCase.execute(
      userId,
      { includeArchived },
      { page, pageSize },
    );

    res.status(200).json({
      trips: result.items,
      pagination: toPaginationMeta(result),
    });
  }

  async get(req: Request, res: Response): Promise<void> {
    const context = this.readTripContext(req, res);
    if (context === null) return;

    const result = await this.getTripUseCase.execute(context.userId, context.tripId);
    if (!result.ok) {
      res.status(statusForError(result.error)).json({ error: result.error });
      return;
    }
    res.status(200).json({ trip: result.value });
  }

  async update(req: Request, res: Response): Promise<void> {
    const context = this.readTripContext(req, res);
    if (context === null) return;

    const body = updateTripBodySchema.safeParse(req.body);
    if (!body.success) {
      this.respondValidationError(res, body.error.issues);
      return;
    }

    const result = await this.updateTripUseCase.execute(
      context.userId,
      context.tripId,
      body.data,
    );
    if (!result.ok) {
      res.status(statusForError(result.error)).json({ error: result.error });
      return;
    }
    res.status(200).json({ trip: result.value });
  }

  async remove(req: Request, res: Response): Promise<void> {
    const context = this.readTripContext(req, res);
    if (context === null) return;

    const result = await this.deleteTripUseCase.execute(context.userId, context.tripId);
    if (!result.ok) {
      res.status(statusForError(result.error)).json({ error: result.error });
      return;
    }
    res.status(204).send();
  }

  async addPackingItem(req: Request, res: Response): Promise<void> {
    const context = this.readTripContext(req, res);
    if (context === null) return;

    const body = addPackingItemBodySchema.safeParse(req.body);
    if (!body.success) {
      this.respondValidationError(res, body.error.issues);
      return;
    }

    const result = await this.addPackingItemUseCase.execute(
      context.userId,
      context.tripId,
      body.data,
    );
    if (!result.ok) {
      res.status(statusForError(result.error)).json({ error: result.error });
      return;
    }
    res.status(201).json({ trip: result.value });
  }

  async updatePackingItem(req: Request, res: Response): Promise<void> {
    const context = this.readItemContext(req, res);
    if (context === null) return;

    const body = updatePackingItemBodySchema.safeParse(req.body);
    if (!body.success) {
      this.respondValidationError(res, body.error.issues);
      return;
    }

    const result = await this.updatePackingItemUseCase.execute(
      context.userId,
      context.tripId,
      context.itemId,
      body.data,
    );
    if (!result.ok) {
      res.status(statusForError(result.error)).json({ error: result.error });
      return;
    }
    res.status(200).json({ trip: result.value });
  }

  async removePackingItem(req: Request, res: Response): Promise<void> {
    const context = this.readItemContext(req, res);
    if (context === null) return;

    const result = await this.removePackingItemUseCase.execute(
      context.userId,
      context.tripId,
      context.itemId,
    );
    if (!result.ok) {
      res.status(statusForError(result.error)).json({ error: result.error });
      return;
    }
    res.status(200).json({ trip: result.value });
  }

  async addChecklistItem(req: Request, res: Response): Promise<void> {
    const context = this.readTripContext(req, res);
    if (context === null) return;

    const body = addChecklistItemBodySchema.safeParse(req.body);
    if (!body.success) {
      this.respondValidationError(res, body.error.issues);
      return;
    }

    const result = await this.addChecklistItemUseCase.execute(
      context.userId,
      context.tripId,
      body.data,
    );
    if (!result.ok) {
      res.status(statusForError(result.error)).json({ error: result.error });
      return;
    }
    res.status(201).json({ trip: result.value });
  }

  async updateChecklistItem(req: Request, res: Response): Promise<void> {
    const context = this.readItemContext(req, res);
    if (context === null) return;

    const body = updateChecklistItemBodySchema.safeParse(req.body);
    if (!body.success) {
      this.respondValidationError(res, body.error.issues);
      return;
    }

    const result = await this.updateChecklistItemUseCase.execute(
      context.userId,
      context.tripId,
      context.itemId,
      body.data,
    );
    if (!result.ok) {
      res.status(statusForError(result.error)).json({ error: result.error });
      return;
    }
    res.status(200).json({ trip: result.value });
  }

  async removeChecklistItem(req: Request, res: Response): Promise<void> {
    const context = this.readItemContext(req, res);
    if (context === null) return;

    const result = await this.removeChecklistItemUseCase.execute(
      context.userId,
      context.tripId,
      context.itemId,
    );
    if (!result.ok) {
      res.status(statusForError(result.error)).json({ error: result.error });
      return;
    }
    res.status(200).json({ trip: result.value });
  }

  async addReservation(req: Request, res: Response): Promise<void> {
    const context = this.readTripContext(req, res);
    if (context === null) return;

    const body = addReservationBodySchema.safeParse(req.body);
    if (!body.success) {
      this.respondValidationError(res, body.error.issues);
      return;
    }

    const result = await this.addReservationUseCase.execute(
      context.userId,
      context.tripId,
      body.data,
    );
    if (!result.ok) {
      res.status(statusForError(result.error)).json({ error: result.error });
      return;
    }
    res.status(201).json({ trip: result.value });
  }

  async updateReservation(req: Request, res: Response): Promise<void> {
    const context = this.readItemContext(req, res);
    if (context === null) return;

    const body = updateReservationBodySchema.safeParse(req.body);
    if (!body.success) {
      this.respondValidationError(res, body.error.issues);
      return;
    }

    const result = await this.updateReservationUseCase.execute(
      context.userId,
      context.tripId,
      context.itemId,
      body.data,
    );
    if (!result.ok) {
      res.status(statusForError(result.error)).json({ error: result.error });
      return;
    }
    res.status(200).json({ trip: result.value });
  }

  async removeReservation(req: Request, res: Response): Promise<void> {
    const context = this.readItemContext(req, res);
    if (context === null) return;

    const result = await this.removeReservationUseCase.execute(
      context.userId,
      context.tripId,
      context.itemId,
    );
    if (!result.ok) {
      res.status(statusForError(result.error)).json({ error: result.error });
      return;
    }
    res.status(200).json({ trip: result.value });
  }

  async addItineraryItem(req: Request, res: Response): Promise<void> {
    const context = this.readTripContext(req, res);
    if (context === null) return;

    const body = addItineraryItemBodySchema.safeParse(req.body);
    if (!body.success) {
      this.respondValidationError(res, body.error.issues);
      return;
    }

    const result = await this.addItineraryItemUseCase.execute(
      context.userId,
      context.tripId,
      body.data,
    );
    if (!result.ok) {
      res.status(statusForError(result.error)).json({ error: result.error });
      return;
    }
    res.status(201).json({ trip: result.value });
  }

  async updateItineraryItem(req: Request, res: Response): Promise<void> {
    const context = this.readItemContext(req, res);
    if (context === null) return;

    const body = updateItineraryItemBodySchema.safeParse(req.body);
    if (!body.success) {
      this.respondValidationError(res, body.error.issues);
      return;
    }

    const result = await this.updateItineraryItemUseCase.execute(
      context.userId,
      context.tripId,
      context.itemId,
      body.data,
    );
    if (!result.ok) {
      res.status(statusForError(result.error)).json({ error: result.error });
      return;
    }
    res.status(200).json({ trip: result.value });
  }

  async removeItineraryItem(req: Request, res: Response): Promise<void> {
    const context = this.readItemContext(req, res);
    if (context === null) return;

    const result = await this.removeItineraryItemUseCase.execute(
      context.userId,
      context.tripId,
      context.itemId,
    );
    if (!result.ok) {
      res.status(statusForError(result.error)).json({ error: result.error });
      return;
    }
    res.status(200).json({ trip: result.value });
  }

  private requireUser(req: Request, res: Response): string | null {
    const userId = req.user?.id;
    if (userId === undefined) {
      res.status(401).json({ error: { code: "UNAUTHORIZED" } });
      return null;
    }
    return userId;
  }

  private readTripContext(
    req: Request,
    res: Response,
  ): { readonly userId: string; readonly tripId: string } | null {
    const userId = this.requireUser(req, res);
    if (userId === null) return null;

    const tripId = readIdParam(req.params.id);
    if (tripId === null) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR" } });
      return null;
    }
    return { userId, tripId };
  }

  private readItemContext(
    req: Request,
    res: Response,
  ): { readonly userId: string; readonly tripId: string; readonly itemId: string } | null {
    const context = this.readTripContext(req, res);
    if (context === null) return null;

    const itemId = readIdParam(req.params.itemId);
    if (itemId === null) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR" } });
      return null;
    }
    return { ...context, itemId };
  }

  private respondValidationError(res: Response, issues: unknown): void {
    res.status(400).json({ error: { code: "VALIDATION_ERROR", issues } });
  }
}
