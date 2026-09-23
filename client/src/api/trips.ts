import { apiRequest } from "./client";
import {
  buildPageQuery,
  readPaginationMeta,
  type Page,
  type PageRequest,
} from "./pagination";

export const PACKING_CATEGORIES = [
  "ROUPA",
  "HIGIENE",
  "ELETRONICO",
  "DOCUMENTO",
  "SAUDE",
  "OUTRO",
] as const;

export type PackingCategory = (typeof PACKING_CATEGORIES)[number];

export type PackingItem = {
  readonly id: string;
  readonly name: string;
  readonly category: PackingCategory;
  readonly quantity: number;
  readonly isPacked: boolean;
  readonly createdAt: string;
};

export type ChecklistItem = {
  readonly id: string;
  readonly title: string;
  /** YYYY-MM-DD ou null. */
  readonly dueDate: string | null;
  readonly isDone: boolean;
  readonly createdAt: string;
};

export const RESERVATION_TYPES = [
  "FLIGHT",
  "LODGING",
  "TRANSPORT",
  "ACTIVITY",
  "OTHER",
] as const;

export type ReservationType = (typeof RESERVATION_TYPES)[number];

export type Reservation = {
  readonly id: string;
  readonly type: ReservationType;
  readonly title: string;
  readonly provider: string | null;
  readonly confirmationCode: string | null;
  readonly url: string | null;
  /** YYYY-MM-DDTHH:mm sem fuso, na hora local do destino. */
  readonly startAt: string | null;
  readonly endAt: string | null;
  readonly address: string | null;
  readonly notes: string | null;
  readonly createdAt: string;
};

export type ItineraryItem = {
  readonly id: string;
  /** YYYY-MM-DD */
  readonly date: string;
  /** HH:mm ou null */
  readonly time: string | null;
  readonly title: string;
  readonly description: string | null;
  readonly location: string | null;
  readonly createdAt: string;
};

export type TripSummary = {
  readonly id: string;
  readonly name: string;
  readonly destination: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly notes: string | null;
  readonly budgetAmount: number | null;
  readonly isArchived: boolean;
  readonly packingTotal: number;
  readonly packingDone: number;
  readonly checklistTotal: number;
  readonly checklistDone: number;
  readonly reservationTotal: number;
  readonly itineraryTotal: number;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type Trip = TripSummary & {
  readonly packingItems: readonly PackingItem[];
  readonly checklistItems: readonly ChecklistItem[];
  readonly reservations: readonly Reservation[];
  readonly itineraryItems: readonly ItineraryItem[];
};

export type CreateTripInput = {
  readonly name: string;
  readonly destination: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly notes: string | null;
  readonly budgetAmount: number | null;
};

export type UpdateTripInput = {
  readonly name?: string;
  readonly destination?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly notes?: string | null;
  readonly budgetAmount?: number | null;
  readonly isArchived?: boolean;
};

export type AddPackingItemInput = {
  readonly name: string;
  readonly category: PackingCategory;
  readonly quantity: number;
};

export type UpdatePackingItemInput = {
  readonly name?: string;
  readonly category?: PackingCategory;
  readonly quantity?: number;
  readonly isPacked?: boolean;
};

export type AddChecklistItemInput = {
  readonly title: string;
  readonly dueDate: string | null;
};

export type UpdateChecklistItemInput = {
  readonly title?: string;
  readonly dueDate?: string | null;
  readonly isDone?: boolean;
};

export type AddReservationInput = {
  readonly type: ReservationType;
  readonly title: string;
  readonly provider: string | null;
  readonly confirmationCode: string | null;
  readonly url: string | null;
  readonly startAt: string | null;
  readonly endAt: string | null;
  readonly address: string | null;
  readonly notes: string | null;
};

export type UpdateReservationInput = Partial<AddReservationInput>;

export type AddItineraryItemInput = {
  readonly date: string;
  readonly time: string | null;
  readonly title: string;
  readonly description: string | null;
  readonly location: string | null;
};

export type UpdateItineraryItemInput = Partial<AddItineraryItemInput>;

const ERROR_MESSAGES: Record<string, string> = {
  TRIP_NOT_FOUND: "Essa viagem não existe mais.",
  FORBIDDEN: "Essa viagem não é sua.",
  ITEM_NOT_FOUND: "Esse item não está mais na lista.",
  NAME_REQUIRED: "Dê um nome para a viagem.",
  DESTINATION_REQUIRED: "Informe o destino.",
  INVALID_DATE: "As datas informadas são inválidas.",
  END_BEFORE_START: "A volta precisa ser depois da ida.",
  INVALID_BUDGET: "Informe um orçamento maior que zero.",
  ITEM_TITLE_REQUIRED: "Escreva o nome do item.",
  INVALID_QUANTITY: "A quantidade precisa ser um número inteiro maior que zero.",
  INVALID_CATEGORY: "Categoria inválida.",
  INVALID_RESERVATION_TYPE: "Tipo de reserva inválido.",
  INVALID_DATETIME: "A data e hora informadas são inválidas.",
  INVALID_TIME: "O horário informado é inválido.",
  RESERVATION_END_BEFORE_START: "O fim da reserva precisa ser depois do início.",
  VALIDATION_ERROR: "Revise os campos preenchidos.",
  UNAUTHORIZED: "Sua sessão expirou. Entre novamente.",
};

export class TripApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(ERROR_MESSAGES[code] ?? "Não foi possível completar a operação.");
    this.name = "TripApiError";
    this.status = status;
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractErrorCode(data: unknown): string {
  if (!isRecord(data)) return "UNKNOWN_ERROR";
  const error = data.error;
  if (!isRecord(error)) return "UNKNOWN_ERROR";
  return typeof error.code === "string" ? error.code : "UNKNOWN_ERROR";
}

async function tripRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await apiRequest(path, options);

  if (response.status === 204) return null as T;

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new TripApiError(response.status, extractErrorCode(data));
  }
  return data as T;
}

/** Todas as mutações devolvem a viagem inteira, então o cache fica consistente. */
async function tripMutation(
  path: string,
  method: string,
  body?: unknown,
): Promise<Trip> {
  const data = await tripRequest<{ readonly trip: Trip }>(path, { method, body });
  return data.trip;
}

export async function getTrips(
  request: PageRequest = {},
  includeArchived = false,
): Promise<Page<TripSummary>> {
  const query = buildPageQuery(request, {
    includeArchived: includeArchived ? "true" : undefined,
  });
  const data = await tripRequest<{ readonly trips: readonly TripSummary[] }>(
    `/trips${query}`,
  );
  const items = data.trips ?? [];
  return { items, pagination: readPaginationMeta(data, items.length) };
}

export async function getTrip(tripId: string): Promise<Trip> {
  const data = await tripRequest<{ readonly trip: Trip }>(`/trips/${tripId}`);
  return data.trip;
}

export async function createTrip(input: CreateTripInput): Promise<Trip> {
  return tripMutation("/trips", "POST", input);
}

export async function updateTrip(
  tripId: string,
  input: UpdateTripInput,
): Promise<Trip> {
  return tripMutation(`/trips/${tripId}`, "PATCH", input);
}

export async function deleteTrip(tripId: string): Promise<void> {
  await tripRequest<null>(`/trips/${tripId}`, { method: "DELETE" });
}

export async function addPackingItem(
  tripId: string,
  input: AddPackingItemInput,
): Promise<Trip> {
  return tripMutation(`/trips/${tripId}/packing`, "POST", input);
}

export async function updatePackingItem(
  tripId: string,
  itemId: string,
  input: UpdatePackingItemInput,
): Promise<Trip> {
  return tripMutation(`/trips/${tripId}/packing/${itemId}`, "PATCH", input);
}

export async function removePackingItem(
  tripId: string,
  itemId: string,
): Promise<Trip> {
  return tripMutation(`/trips/${tripId}/packing/${itemId}`, "DELETE");
}

export async function addChecklistItem(
  tripId: string,
  input: AddChecklistItemInput,
): Promise<Trip> {
  return tripMutation(`/trips/${tripId}/checklist`, "POST", input);
}

export async function updateChecklistItem(
  tripId: string,
  itemId: string,
  input: UpdateChecklistItemInput,
): Promise<Trip> {
  return tripMutation(`/trips/${tripId}/checklist/${itemId}`, "PATCH", input);
}

export async function removeChecklistItem(
  tripId: string,
  itemId: string,
): Promise<Trip> {
  return tripMutation(`/trips/${tripId}/checklist/${itemId}`, "DELETE");
}

export async function addReservation(
  tripId: string,
  input: AddReservationInput,
): Promise<Trip> {
  return tripMutation(`/trips/${tripId}/reservations`, "POST", input);
}

export async function updateReservation(
  tripId: string,
  itemId: string,
  input: UpdateReservationInput,
): Promise<Trip> {
  return tripMutation(`/trips/${tripId}/reservations/${itemId}`, "PATCH", input);
}

export async function removeReservation(
  tripId: string,
  itemId: string,
): Promise<Trip> {
  return tripMutation(`/trips/${tripId}/reservations/${itemId}`, "DELETE");
}

export async function addItineraryItem(
  tripId: string,
  input: AddItineraryItemInput,
): Promise<Trip> {
  return tripMutation(`/trips/${tripId}/itinerary`, "POST", input);
}

export async function updateItineraryItem(
  tripId: string,
  itemId: string,
  input: UpdateItineraryItemInput,
): Promise<Trip> {
  return tripMutation(`/trips/${tripId}/itinerary/${itemId}`, "PATCH", input);
}

export async function removeItineraryItem(
  tripId: string,
  itemId: string,
): Promise<Trip> {
  return tripMutation(`/trips/${tripId}/itinerary/${itemId}`, "DELETE");
}
