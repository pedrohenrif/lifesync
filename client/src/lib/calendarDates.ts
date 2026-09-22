import { addDays, format, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Valor aceito por `<input type="datetime-local">`. */
export function toLocalInputValue(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

/** Valor aceito por `<input type="date">`. */
export function toDateInputValue(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * O Google trata a data final de eventos de dia inteiro como exclusiva, então o
 * último dia selecionado vira o dia seguinte às 00:00.
 */
export function allDayRangeToIso(startDate: string, endDate: string): {
  readonly start: string;
  readonly end: string;
} {
  const exclusiveEnd = addDays(new Date(`${endDate}T00:00:00`), 1);
  return {
    start: `${startDate}T00:00:00`,
    end: `${toDateInputValue(exclusiveEnd)}T00:00:00`,
  };
}

/** Converte o `end` exclusivo do Google de volta para o último dia visível. */
export function allDayEndToInclusiveDate(endIso: string): string {
  return toDateInputValue(addDays(new Date(endIso), -1));
}

export function getWeekStart(reference: Date): Date {
  return startOfWeek(reference, { weekStartsOn: 1 });
}

export function formatWeekLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();

  const startLabel = format(weekStart, sameMonth ? "d" : "d 'de' MMM", { locale: ptBR });
  const endLabel = format(weekEnd, "d 'de' MMM", { locale: ptBR });
  return `${startLabel} – ${endLabel}`;
}

export function formatDayHeading(day: Date): string {
  return format(day, "EEEE, d 'de' MMMM", { locale: ptBR });
}

export function formatEventTime(startIso: string, endIso: string): string {
  return `${format(new Date(startIso), "HH:mm")} – ${format(new Date(endIso), "HH:mm")}`;
}

/** Um evento aparece no dia se o intervalo dele cruza aquele dia. */
export function overlapsDay(startIso: string, endIso: string, day: Date): boolean {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = addDays(dayStart, 1);

  return new Date(startIso) < dayEnd && new Date(endIso) > dayStart;
}
