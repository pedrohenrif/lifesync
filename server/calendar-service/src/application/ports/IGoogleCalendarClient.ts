import type { Result } from "../result.js";
import type {
  CalendarEvent,
  CalendarEventDraft,
  CalendarEventChanges,
  CalendarRange,
} from "../../domain/entities/CalendarEvent.js";

export type CalendarApiError =
  | { readonly code: "CALENDAR_UPSTREAM_ERROR"; readonly status: number }
  | { readonly code: "CALENDAR_EVENT_NOT_FOUND" }
  | { readonly code: "CALENDAR_TIMEOUT" }
  | { readonly code: "CALENDAR_INVALID_RESPONSE" };

export interface IGoogleCalendarClient {
  listEvents(
    accessToken: string,
    range: CalendarRange,
  ): Promise<Result<readonly CalendarEvent[], CalendarApiError>>;
  createEvent(
    accessToken: string,
    draft: CalendarEventDraft,
  ): Promise<Result<CalendarEvent, CalendarApiError>>;
  updateEvent(
    accessToken: string,
    eventId: string,
    changes: CalendarEventChanges,
  ): Promise<Result<CalendarEvent, CalendarApiError>>;
  deleteEvent(
    accessToken: string,
    eventId: string,
  ): Promise<Result<null, CalendarApiError>>;
}
