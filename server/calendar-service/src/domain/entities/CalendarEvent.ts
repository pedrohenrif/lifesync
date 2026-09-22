/**
 * Evento como o app enxerga. Nunca é persistido: vive no Google Calendar e é
 * consultado sob demanda, então aqui serve só de contrato entre as camadas.
 */
export type CalendarEvent = {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly location: string | null;
  /** ISO 8601. Em eventos de dia inteiro, é a data às 00:00. */
  readonly start: string;
  readonly end: string;
  readonly isAllDay: boolean;
  /** Link para abrir o evento no Google Calendar. */
  readonly htmlLink: string | null;
};

export type CalendarEventDraft = {
  readonly title: string;
  readonly description: string | null;
  readonly location: string | null;
  readonly start: string;
  readonly end: string;
  readonly isAllDay: boolean;
};

export type CalendarEventChanges = {
  readonly title?: string;
  readonly description?: string | null;
  readonly location?: string | null;
  readonly start?: string;
  readonly end?: string;
  readonly isAllDay?: boolean;
};

export type CalendarRange = {
  readonly start: string;
  readonly end: string;
};

export type CalendarEventValidationError =
  | { readonly code: "TITLE_REQUIRED" }
  | { readonly code: "INVALID_DATE" }
  | { readonly code: "END_BEFORE_START" };

function isValidIsoDate(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

/** Validação de intervalo compartilhada por criação e edição. */
export function validateEventWindow(
  start: string,
  end: string,
): CalendarEventValidationError | null {
  if (!isValidIsoDate(start) || !isValidIsoDate(end)) {
    return { code: "INVALID_DATE" };
  }
  if (Date.parse(end) <= Date.parse(start)) {
    return { code: "END_BEFORE_START" };
  }
  return null;
}

export function validateEventDraft(
  draft: CalendarEventDraft,
): CalendarEventValidationError | null {
  if (draft.title.trim().length === 0) {
    return { code: "TITLE_REQUIRED" };
  }
  return validateEventWindow(draft.start, draft.end);
}

export function validateRange(range: CalendarRange): CalendarEventValidationError | null {
  return validateEventWindow(range.start, range.end);
}
