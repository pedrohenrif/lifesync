import { err, ok, type Result } from "../../application/result.js";
import type {
  CalendarApiError,
  IGoogleCalendarClient,
} from "../../application/ports/IGoogleCalendarClient.js";
import type {
  CalendarEvent,
  CalendarEventChanges,
  CalendarEventDraft,
  CalendarRange,
} from "../../domain/entities/CalendarEvent.js";

const CALENDAR_ID = "primary";
const BASE_URL = `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events`;
const MAX_RESULTS = 250;
const REQUEST_TIMEOUT_MS = 15_000;

type GoogleDate = {
  readonly date?: string;
  readonly dateTime?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readGoogleDate(value: unknown): GoogleDate | null {
  if (!isRecord(value)) return null;
  const date = readString(value.date);
  const dateTime = readString(value.dateTime);
  if (date === null && dateTime === null) return null;
  return { date: date ?? undefined, dateTime: dateTime ?? undefined };
}

/** Eventos de dia inteiro chegam como `date`; os demais, como `dateTime`. */
function toIsoString(value: GoogleDate): string {
  if (value.dateTime !== undefined) return value.dateTime;
  return `${value.date ?? ""}T00:00:00`;
}

function toDomain(raw: unknown): CalendarEvent | null {
  if (!isRecord(raw)) return null;

  const id = readString(raw.id);
  const start = readGoogleDate(raw.start);
  const end = readGoogleDate(raw.end);
  if (id === null || start === null || end === null) return null;

  return {
    id,
    title: readString(raw.summary) ?? "(sem título)",
    description: readString(raw.description),
    location: readString(raw.location),
    start: toIsoString(start),
    end: toIsoString(end),
    isAllDay: start.date !== undefined,
    htmlLink: readString(raw.htmlLink),
  };
}

/**
 * No Google, evento de dia inteiro usa `date` e a data final é EXCLUSIVA.
 * Mantemos essa semântica na borda: o `end` recebido já vem como o instante
 * seguinte ao último dia.
 */
function toGoogleDate(iso: string, isAllDay: boolean, timeZone: string): GoogleDate | Record<string, string> {
  if (isAllDay) {
    return { date: iso.slice(0, 10) };
  }
  return { dateTime: new Date(iso).toISOString(), timeZone };
}

export class GoogleCalendarHttpClient implements IGoogleCalendarClient {
  constructor(private readonly timeZone: string) {}

  async listEvents(
    accessToken: string,
    range: CalendarRange,
  ): Promise<Result<readonly CalendarEvent[], CalendarApiError>> {
    const query = new URLSearchParams({
      timeMin: new Date(range.start).toISOString(),
      timeMax: new Date(range.end).toISOString(),
      // Expande eventos recorrentes em ocorrências, que é o que a agenda exibe.
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: String(MAX_RESULTS),
    });

    const response = await this.request(accessToken, `${BASE_URL}?${query.toString()}`, "GET");
    if (!response.ok) return err(response.error);

    const payload = response.value;
    if (!isRecord(payload) || !Array.isArray(payload.items)) {
      return err({ code: "CALENDAR_INVALID_RESPONSE" });
    }

    const events: CalendarEvent[] = [];
    for (const item of payload.items) {
      // Instâncias canceladas de eventos recorrentes continuam vindo na listagem.
      if (isRecord(item) && item.status === "cancelled") continue;
      const event = toDomain(item);
      if (event !== null) events.push(event);
    }
    return ok(events);
  }

  async createEvent(
    accessToken: string,
    draft: CalendarEventDraft,
  ): Promise<Result<CalendarEvent, CalendarApiError>> {
    const body = {
      summary: draft.title,
      description: draft.description ?? undefined,
      location: draft.location ?? undefined,
      start: toGoogleDate(draft.start, draft.isAllDay, this.timeZone),
      end: toGoogleDate(draft.end, draft.isAllDay, this.timeZone),
    };

    const response = await this.request(accessToken, BASE_URL, "POST", body);
    if (!response.ok) return err(response.error);

    const event = toDomain(response.value);
    return event === null ? err({ code: "CALENDAR_INVALID_RESPONSE" }) : ok(event);
  }

  async updateEvent(
    accessToken: string,
    eventId: string,
    changes: CalendarEventChanges,
  ): Promise<Result<CalendarEvent, CalendarApiError>> {
    const body: Record<string, unknown> = {};
    if (changes.title !== undefined) body.summary = changes.title;
    if (changes.description !== undefined) body.description = changes.description;
    if (changes.location !== undefined) body.location = changes.location;

    // O Google exige start e end juntos quando o intervalo muda.
    if (changes.start !== undefined && changes.end !== undefined) {
      const isAllDay = changes.isAllDay ?? false;
      body.start = toGoogleDate(changes.start, isAllDay, this.timeZone);
      body.end = toGoogleDate(changes.end, isAllDay, this.timeZone);
    }

    const response = await this.request(
      accessToken,
      `${BASE_URL}/${encodeURIComponent(eventId)}`,
      "PATCH",
      body,
    );
    if (!response.ok) return err(response.error);

    const event = toDomain(response.value);
    return event === null ? err({ code: "CALENDAR_INVALID_RESPONSE" }) : ok(event);
  }

  async deleteEvent(
    accessToken: string,
    eventId: string,
  ): Promise<Result<null, CalendarApiError>> {
    const response = await this.request(
      accessToken,
      `${BASE_URL}/${encodeURIComponent(eventId)}`,
      "DELETE",
    );
    return response.ok ? ok(null) : err(response.error);
  }

  private async request(
    accessToken: string,
    url: string,
    method: string,
    body?: unknown,
  ): Promise<Result<unknown, CalendarApiError>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      // 410 Gone aparece quando o evento já havia sido removido.
      if (response.status === 404 || response.status === 410) {
        return err({ code: "CALENDAR_EVENT_NOT_FOUND" });
      }
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        console.error(`Google Calendar error ${response.status}: ${detail}`);
        return err({ code: "CALENDAR_UPSTREAM_ERROR", status: response.status });
      }
      if (response.status === 204) return ok(null);

      return ok(await response.json());
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return err({ code: "CALENDAR_TIMEOUT" });
      }
      console.error("Google Calendar request failed", error);
      return err({ code: "CALENDAR_UPSTREAM_ERROR", status: 0 });
    } finally {
      clearTimeout(timeout);
    }
  }
}
