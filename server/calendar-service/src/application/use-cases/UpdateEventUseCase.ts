import { err, ok, type Result } from "../result.js";
import type { CalendarOperationError } from "../errors.js";
import {
  validateEventWindow,
  type CalendarEvent,
  type CalendarEventChanges,
} from "../../domain/entities/CalendarEvent.js";
import type { IGoogleCalendarClient } from "../ports/IGoogleCalendarClient.js";
import type { GoogleAccessTokenProvider } from "../services/GoogleAccessTokenProvider.js";

export class UpdateEventUseCase {
  constructor(
    private readonly tokenProvider: GoogleAccessTokenProvider,
    private readonly calendarClient: IGoogleCalendarClient,
  ) {}

  async execute(
    userId: string,
    eventId: string,
    changes: CalendarEventChanges,
  ): Promise<Result<CalendarEvent, CalendarOperationError>> {
    if (changes.title !== undefined && changes.title.trim().length === 0) {
      return err({ code: "TITLE_REQUIRED" });
    }
    if (changes.start !== undefined && changes.end !== undefined) {
      const invalidWindow = validateEventWindow(changes.start, changes.end);
      if (invalidWindow !== null) return err(invalidWindow);
    }

    const token = await this.tokenProvider.getAccessToken(userId);
    if (!token.ok) return err(token.error);

    const updated = await this.calendarClient.updateEvent(token.value, eventId, changes);
    return updated.ok ? ok(updated.value) : err(updated.error);
  }
}
