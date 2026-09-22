import { err, ok, type Result } from "../result.js";
import type { CalendarOperationError } from "../errors.js";
import {
  validateEventDraft,
  type CalendarEvent,
  type CalendarEventDraft,
} from "../../domain/entities/CalendarEvent.js";
import type { IGoogleCalendarClient } from "../ports/IGoogleCalendarClient.js";
import type { GoogleAccessTokenProvider } from "../services/GoogleAccessTokenProvider.js";

export class CreateEventUseCase {
  constructor(
    private readonly tokenProvider: GoogleAccessTokenProvider,
    private readonly calendarClient: IGoogleCalendarClient,
  ) {}

  async execute(
    userId: string,
    draft: CalendarEventDraft,
  ): Promise<Result<CalendarEvent, CalendarOperationError>> {
    const invalidDraft = validateEventDraft(draft);
    if (invalidDraft !== null) return err(invalidDraft);

    const token = await this.tokenProvider.getAccessToken(userId);
    if (!token.ok) return err(token.error);

    const created = await this.calendarClient.createEvent(token.value, draft);
    return created.ok ? ok(created.value) : err(created.error);
  }
}
