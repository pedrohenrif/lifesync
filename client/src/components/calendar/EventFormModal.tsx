import { useState, type FormEvent, type ReactElement } from "react";
import { addHours } from "date-fns";
import { Loader2 } from "lucide-react";
import { AppModalShell } from "../ui/AppModalShell";
import type { CalendarEvent, CreateEventInput } from "../../api/calendar";
import {
  allDayEndToInclusiveDate,
  allDayRangeToIso,
  toDateInputValue,
  toLocalInputValue,
} from "../../lib/calendarDates";

type EventFormModalProps = {
  readonly event: CalendarEvent | null;
  /** Dia pré-selecionado ao criar um evento a partir da semana visível. */
  readonly defaultDate: Date;
  readonly pending: boolean;
  readonly onSubmit: (input: CreateEventInput) => void;
  readonly onClose: () => void;
};

function buildInitialTimes(event: CalendarEvent | null, defaultDate: Date) {
  if (event !== null && !event.isAllDay) {
    return {
      start: toLocalInputValue(new Date(event.start)),
      end: toLocalInputValue(new Date(event.end)),
    };
  }

  const start = new Date(defaultDate);
  start.setHours(9, 0, 0, 0);
  return {
    start: toLocalInputValue(start),
    end: toLocalInputValue(addHours(start, 1)),
  };
}

function buildInitialDates(event: CalendarEvent | null, defaultDate: Date) {
  if (event !== null && event.isAllDay) {
    return {
      start: toDateInputValue(new Date(event.start)),
      end: allDayEndToInclusiveDate(event.end),
    };
  }

  const day = toDateInputValue(event === null ? defaultDate : new Date(event.start));
  return { start: day, end: day };
}

export function EventFormModal({
  event,
  defaultDate,
  pending,
  onSubmit,
  onClose,
}: EventFormModalProps): ReactElement {
  const initialTimes = buildInitialTimes(event, defaultDate);
  const initialDates = buildInitialDates(event, defaultDate);

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [isAllDay, setIsAllDay] = useState(event?.isAllDay ?? false);
  const [startTime, setStartTime] = useState(initialTimes.start);
  const [endTime, setEndTime] = useState(initialTimes.end);
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formEvent: FormEvent): void => {
    formEvent.preventDefault();

    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      setError("Dê um título para o evento.");
      return;
    }

    const range = isAllDay
      ? allDayRangeToIso(startDate, endDate)
      : { start: new Date(startTime).toISOString(), end: new Date(endTime).toISOString() };

    if (Number.isNaN(Date.parse(range.start)) || Number.isNaN(Date.parse(range.end))) {
      setError("Preencha as datas do evento.");
      return;
    }
    if (Date.parse(range.end) <= Date.parse(range.start)) {
      setError("O término precisa ser depois do início.");
      return;
    }

    setError(null);
    onSubmit({
      title: trimmedTitle,
      description: description.trim().length > 0 ? description.trim() : null,
      location: location.trim().length > 0 ? location.trim() : null,
      start: range.start,
      end: range.end,
      isAllDay,
    });
  };

  return (
    <AppModalShell
      title={event === null ? "Novo evento" : "Editar evento"}
      onClose={onClose}
      maxWidthClass="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="event-title" className="mb-1.5 block text-xs font-medium text-zinc-400">
            Título
          </label>
          <input
            id="event-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Reunião com o time"
            className="ls-input"
            autoFocus
          />
        </div>

        <label className="flex items-center gap-2.5 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={isAllDay}
            onChange={(e) => setIsAllDay(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-700 bg-navy-950 accent-blue-600"
          />
          Dia inteiro
        </label>

        {isAllDay ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="event-start-date" className="mb-1.5 block text-xs font-medium text-zinc-400">
                Início
              </label>
              <input
                id="event-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="ls-input"
              />
            </div>
            <div>
              <label htmlFor="event-end-date" className="mb-1.5 block text-xs font-medium text-zinc-400">
                Fim
              </label>
              <input
                id="event-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="ls-input"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="event-start-time" className="mb-1.5 block text-xs font-medium text-zinc-400">
                Início
              </label>
              <input
                id="event-start-time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="ls-input"
              />
            </div>
            <div>
              <label htmlFor="event-end-time" className="mb-1.5 block text-xs font-medium text-zinc-400">
                Fim
              </label>
              <input
                id="event-end-time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="ls-input"
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="event-location" className="mb-1.5 block text-xs font-medium text-zinc-400">
            Local <span className="text-zinc-600">(opcional)</span>
          </label>
          <input
            id="event-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Escritório, link da call…"
            className="ls-input"
          />
        </div>

        <div>
          <label htmlFor="event-description" className="mb-1.5 block text-xs font-medium text-zinc-400">
            Descrição <span className="text-zinc-600">(opcional)</span>
          </label>
          <textarea
            id="event-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="ls-input resize-none"
          />
        </div>

        {error !== null && (
          <p className="rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-xs text-red-400">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="min-h-11 rounded-lg border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-900 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button type="submit" disabled={pending} className="ls-btn">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {event === null ? "Criar evento" : "Salvar"}
          </button>
        </div>
      </form>
    </AppModalShell>
  );
}
