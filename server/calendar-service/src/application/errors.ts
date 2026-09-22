import type { CalendarApiError } from "./ports/IGoogleCalendarClient.js";
import type { AccessTokenError } from "./services/GoogleAccessTokenProvider.js";
import type { CalendarEventValidationError } from "../domain/entities/CalendarEvent.js";

/** Erros que qualquer operação sobre eventos pode devolver. */
export type CalendarOperationError =
  | AccessTokenError
  | CalendarApiError
  | CalendarEventValidationError;
