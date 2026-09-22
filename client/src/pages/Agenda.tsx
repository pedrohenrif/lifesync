import { useEffect, useMemo, useState, type ReactElement } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { addDays, eachDayOfInterval, isToday } from "date-fns";
import { toast } from "sonner";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Unlink,
} from "lucide-react";
import {
  useCalendarConnection,
  useCalendarEvents,
  useCreateCalendarEvent,
  useDeleteCalendarEvent,
  useDisconnectCalendar,
  useStartCalendarConnection,
  useUpdateCalendarEvent,
} from "../hooks/useCalendar";
import type { CalendarEvent, CreateEventInput } from "../api/calendar";
import { GoogleConnectCard } from "../components/calendar/GoogleConnectCard";
import { EventFormModal } from "../components/calendar/EventFormModal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import {
  formatDayHeading,
  formatEventTime,
  formatWeekLabel,
  getWeekStart,
  overlapsDay,
} from "../lib/calendarDates";

const CALLBACK_ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Você cancelou a autorização do Google.",
  invalid_state: "O link de conexão expirou. Tente conectar de novo.",
  google_auth_failed: "O Google recusou a autorização. Tente de novo.",
  missing_refresh_token:
    "O Google não devolveu a autorização completa. Remova o acesso do LifeSync na sua conta Google e conecte de novo.",
};

function EventCard({
  event,
  onEdit,
  onDelete,
}: {
  readonly event: CalendarEvent;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}): ReactElement {
  return (
    <div className="ls-card flex items-start gap-3 p-3.5">
      <div className="mt-1 h-full w-0.5 shrink-0 self-stretch rounded-full bg-blue-600/70" />

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-blue-500/90">
          {event.isAllDay ? "Dia inteiro" : formatEventTime(event.start, event.end)}
        </p>
        <p className="mt-0.5 truncate text-sm font-medium text-zinc-100">{event.title}</p>

        {event.location !== null && (
          <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-zinc-500">
            <MapPin className="h-3 w-3 shrink-0" />
            {event.location}
          </p>
        )}
        {event.description !== null && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-600">
            {event.description}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {event.htmlLink !== null && (
          <a
            href={event.htmlLink}
            target="_blank"
            rel="noreferrer"
            className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300"
            aria-label="Abrir no Google Agenda"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300"
          aria-label="Editar evento"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-800 hover:text-red-400"
          aria-label="Remover evento"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function Agenda(): ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [formEvent, setFormEvent] = useState<CalendarEvent | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);

  const connection = useCalendarConnection();
  const startConnection = useStartCalendarConnection();
  const disconnect = useDisconnectCalendar();
  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();

  const range = useMemo(
    () => ({
      start: weekStart.toISOString(),
      end: addDays(weekStart, 7).toISOString(),
    }),
    [weekStart],
  );

  const isConnected = connection.data?.connected === true;
  const events = useCalendarEvents(range, isConnected);

  // O Google redireciona de volta com o resultado na query string.
  useEffect(() => {
    const connected = searchParams.get("google");
    const errorCode = searchParams.get("google_error");
    if (connected === null && errorCode === null) return;

    if (connected === "connected") {
      toast.success("Google Agenda conectado.");
      void queryClient.invalidateQueries({ queryKey: ["calendar"] });
    } else if (errorCode !== null) {
      toast.error(
        CALLBACK_ERROR_MESSAGES[errorCode] ?? "Não foi possível conectar sua conta Google.",
      );
    }

    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, queryClient]);

  const days = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) }),
    [weekStart],
  );

  const openCreateForm = (): void => {
    setFormEvent(null);
    setIsFormOpen(true);
  };

  const openEditForm = (event: CalendarEvent): void => {
    setFormEvent(event);
    setIsFormOpen(true);
  };

  const handleSubmit = (input: CreateEventInput): void => {
    const onDone = { onSuccess: () => setIsFormOpen(false) };

    if (formEvent === null) {
      createEvent.mutate(input, onDone);
      return;
    }
    updateEvent.mutate({ id: formEvent.id, input }, onDone);
  };

  const handleDelete = (): void => {
    if (eventToDelete === null) return;
    deleteEvent.mutate(eventToDelete.id, {
      onSuccess: () => setEventToDelete(null),
    });
  };

  const eventList = events.data ?? [];
  const isSubmitting = createEvent.isPending || updateEvent.isPending;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-6 w-6 shrink-0 text-zinc-400" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Agenda</h1>
            {connection.data?.googleEmail != null && (
              <p className="truncate text-xs text-zinc-600">
                {connection.data.googleEmail}
              </p>
            )}
          </div>
        </div>

        {isConnected && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => disconnect.mutate()}
              disabled={disconnect.isPending}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200 disabled:opacity-50"
            >
              <Unlink className="h-3.5 w-3.5" />
              Desconectar
            </button>
            <button type="button" onClick={openCreateForm} className="ls-btn">
              <Plus className="h-4 w-4" />
              Novo evento
            </button>
          </div>
        )}
      </div>

      {connection.isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-700" />
        </div>
      )}

      {connection.isError && (
        <p className="ls-card p-4 text-sm text-red-400">
          Não foi possível verificar sua conexão com o Google.
        </p>
      )}

      {connection.data !== undefined && !isConnected && (
        <GoogleConnectCard
          available={connection.data.available}
          pending={startConnection.isPending}
          onConnect={() => startConnection.mutate()}
        />
      )}

      {isConnected && (
        <>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              className="rounded-lg border border-zinc-800 p-2 text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setWeekStart(getWeekStart(new Date()))}
              className="flex-1 rounded-lg py-2 text-center text-sm font-medium text-zinc-300 transition hover:bg-zinc-900"
            >
              {formatWeekLabel(weekStart)}
            </button>

            <button
              type="button"
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              className="rounded-lg border border-zinc-800 p-2 text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200"
              aria-label="Próxima semana"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {events.isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-700" />
            </div>
          )}

          {events.isError && (
            <p className="ls-card p-4 text-sm text-red-400">
              Não foi possível carregar os eventos desta semana.
            </p>
          )}

          {events.isSuccess && eventList.length === 0 && (
            <div className="ls-card p-8 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-zinc-700" />
              <p className="mt-3 text-sm text-zinc-400">Nenhum evento nesta semana.</p>
              <p className="mt-1 text-xs text-zinc-600">
                Que tal reservar um horário para suas metas?
              </p>
            </div>
          )}

          {events.isSuccess &&
            eventList.length > 0 &&
            days.map((day) => {
              const dayEvents = eventList.filter((event) =>
                overlapsDay(event.start, event.end, day),
              );
              if (dayEvents.length === 0) return null;

              return (
                <section key={day.toISOString()} className="space-y-2">
                  <h2
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      isToday(day) ? "text-blue-500" : "text-zinc-600"
                    }`}
                  >
                    {formatDayHeading(day)}
                    {isToday(day) && " · hoje"}
                  </h2>
                  {dayEvents.map((event) => (
                    <EventCard
                      key={`${day.toISOString()}-${event.id}`}
                      event={event}
                      onEdit={() => openEditForm(event)}
                      onDelete={() => setEventToDelete(event)}
                    />
                  ))}
                </section>
              );
            })}
        </>
      )}

      {isFormOpen && (
        <EventFormModal
          event={formEvent}
          defaultDate={weekStart}
          pending={isSubmitting}
          onSubmit={handleSubmit}
          onClose={() => setIsFormOpen(false)}
        />
      )}

      {eventToDelete !== null && (
        <ConfirmDialog
          title="Remover evento"
          description={`"${eventToDelete.title}" será apagado da sua agenda do Google. Essa ação não pode ser desfeita.`}
          confirmLabel="Remover"
          danger
          pending={deleteEvent.isPending}
          onConfirm={handleDelete}
          onClose={() => setEventToDelete(null)}
        />
      )}
    </div>
  );
}
