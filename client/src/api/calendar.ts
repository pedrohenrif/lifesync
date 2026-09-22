import { apiRequest } from "./client";

export type CalendarEvent = {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly location: string | null;
  /** ISO 8601. Em eventos de dia inteiro, `end` é exclusivo (semântica do Google). */
  readonly start: string;
  readonly end: string;
  readonly isAllDay: boolean;
  readonly htmlLink: string | null;
};

export type CalendarConnection = {
  readonly connected: boolean;
  readonly googleEmail: string | null;
  readonly connectedAt: string | null;
  /** False quando o servidor não tem credenciais OAuth configuradas. */
  readonly available: boolean;
};

export type CalendarRange = {
  readonly start: string;
  readonly end: string;
};

export type CreateEventInput = {
  readonly title: string;
  readonly description: string | null;
  readonly location: string | null;
  readonly start: string;
  readonly end: string;
  readonly isAllDay: boolean;
};

export type UpdateEventInput = {
  readonly title?: string;
  readonly description?: string | null;
  readonly location?: string | null;
  readonly start?: string;
  readonly end?: string;
  readonly isAllDay?: boolean;
};

const ERROR_MESSAGES: Record<string, string> = {
  NOT_CONNECTED: "Conecte sua conta Google para ver a agenda.",
  CONNECTION_BROKEN: "O acesso à sua conta Google expirou. Conecte novamente.",
  GOOGLE_UNAVAILABLE: "O Google está indisponível no momento. Tente de novo.",
  GOOGLE_NOT_CONFIGURED: "A integração com o Google não está configurada neste ambiente.",
  CALENDAR_UPSTREAM_ERROR: "O Google Agenda recusou a operação. Tente de novo.",
  CALENDAR_EVENT_NOT_FOUND: "Esse evento não existe mais na sua agenda.",
  CALENDAR_TIMEOUT: "O Google demorou demais para responder.",
  CALENDAR_INVALID_RESPONSE: "O Google respondeu em um formato inesperado.",
  TITLE_REQUIRED: "Dê um título para o evento.",
  INVALID_DATE: "As datas informadas são inválidas.",
  END_BEFORE_START: "O término precisa ser depois do início.",
  VALIDATION_ERROR: "Revise os campos do evento.",
  UNAUTHORIZED: "Sua sessão expirou. Entre novamente.",
};

export class CalendarApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(ERROR_MESSAGES[code] ?? "Não foi possível falar com o Google Agenda.");
    this.name = "CalendarApiError";
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

async function calendarRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await apiRequest(path, options);

  if (response.status === 204) return null as T;

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new CalendarApiError(response.status, extractErrorCode(data));
  }
  return data as T;
}

export async function getCalendarConnection(): Promise<CalendarConnection> {
  return calendarRequest<CalendarConnection>("/calendar/connection");
}

export async function startCalendarConnection(): Promise<{ readonly authUrl: string }> {
  return calendarRequest<{ readonly authUrl: string }>("/calendar/connection/start", {
    method: "POST",
  });
}

export async function disconnectCalendar(): Promise<void> {
  await calendarRequest<null>("/calendar/connection", { method: "DELETE" });
}

export async function getCalendarEvents(
  range: CalendarRange,
): Promise<readonly CalendarEvent[]> {
  const query = new URLSearchParams({ start: range.start, end: range.end });
  const data = await calendarRequest<{ readonly events: readonly CalendarEvent[] }>(
    `/calendar/events?${query.toString()}`,
  );
  return data.events;
}

export async function createCalendarEvent(
  input: CreateEventInput,
): Promise<CalendarEvent> {
  const data = await calendarRequest<{ readonly event: CalendarEvent }>(
    "/calendar/events",
    { method: "POST", body: input },
  );
  return data.event;
}

export async function updateCalendarEvent(
  id: string,
  input: UpdateEventInput,
): Promise<CalendarEvent> {
  const data = await calendarRequest<{ readonly event: CalendarEvent }>(
    `/calendar/events/${id}`,
    { method: "PATCH", body: input },
  );
  return data.event;
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  await calendarRequest<null>(`/calendar/events/${id}`, { method: "DELETE" });
}
