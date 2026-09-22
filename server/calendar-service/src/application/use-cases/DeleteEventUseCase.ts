import { err, ok, type Result } from "../result.js";
import type { CalendarOperationError } from "../errors.js";
import type { IGoogleCalendarClient } from "../ports/IGoogleCalendarClient.js";
import type { GoogleAccessTokenProvider } from "../services/GoogleAccessTokenProvider.js";

export class DeleteEventUseCase {
  constructor(
    private readonly tokenProvider: GoogleAccessTokenProvider,
    private readonly calendarClient: IGoogleCalendarClient,
  ) {}

  async execute(
    userId: string,
    eventId: string,
  ): Promise<Result<null, CalendarOperationError>> {
    const token = await this.tokenProvider.getAccessToken(userId);
    if (!token.ok) return err(token.error);

    const deleted = await this.calendarClient.deleteEvent(token.value, eventId);
    return deleted.ok ? ok(null) : err(deleted.error);
  }
}
