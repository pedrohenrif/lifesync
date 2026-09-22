import { err, ok, type Result } from "../result.js";
import type { CalendarOperationError } from "../errors.js";
import {
  validateRange,
  type CalendarEvent,
  type CalendarRange,
} from "../../domain/entities/CalendarEvent.js";
import type { IGoogleCalendarClient } from "../ports/IGoogleCalendarClient.js";
import type { GoogleAccessTokenProvider } from "../services/GoogleAccessTokenProvider.js";

export class ListEventsUseCase {
  constructor(
    private readonly tokenProvider: GoogleAccessTokenProvider,
    private readonly calendarClient: IGoogleCalendarClient,
  ) {}

  async execute(
    userId: string,
    range: CalendarRange,
  ): Promise<Result<readonly CalendarEvent[], CalendarOperationError>> {
    const invalidRange = validateRange(range);
    if (invalidRange !== null) return err(invalidRange);

    const token = await this.tokenProvider.getAccessToken(userId);
    if (!token.ok) return err(token.error);

    const events = await this.calendarClient.listEvents(token.value, range);
    return events.ok ? ok(events.value) : err(events.error);
  }
}
