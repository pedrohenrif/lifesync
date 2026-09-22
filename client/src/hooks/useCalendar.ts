import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarApiError,
  createCalendarEvent,
  deleteCalendarEvent,
  disconnectCalendar,
  getCalendarConnection,
  getCalendarEvents,
  startCalendarConnection,
  updateCalendarEvent,
  type CalendarRange,
  type CreateEventInput,
  type UpdateEventInput,
} from "../api/calendar";

const CONNECTION_KEY = ["calendar", "connection"] as const;
const EVENTS_KEY = ["calendar", "events"] as const;

function notifyError(error: unknown): void {
  toast.error(
    error instanceof CalendarApiError
      ? error.message
      : "Não foi possível falar com o Google Agenda.",
  );
}

export function useCalendarConnection() {
  return useQuery({
    queryKey: CONNECTION_KEY,
    queryFn: getCalendarConnection,
    staleTime: 60_000,
    retry: false,
  });
}

export function useCalendarEvents(range: CalendarRange, enabled: boolean) {
  return useQuery({
    queryKey: [...EVENTS_KEY, range.start, range.end],
    queryFn: () => getCalendarEvents(range),
    enabled,
    // A agenda vive no Google: uma janela curta evita mostrar dados vencidos
    // quando o usuário edita algo pelo app do celular.
    staleTime: 30_000,
    retry: false,
  });
}

export function useStartCalendarConnection() {
  return useMutation({
    mutationFn: startCalendarConnection,
    onSuccess: ({ authUrl }) => {
      window.location.href = authUrl;
    },
    onError: notifyError,
  });
}

export function useDisconnectCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disconnectCalendar,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CONNECTION_KEY });
      void queryClient.removeQueries({ queryKey: EVENTS_KEY });
      toast.success("Conta Google desconectada.");
    },
    onError: notifyError,
  });
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEventInput) => createCalendarEvent(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: EVENTS_KEY });
      toast.success("Evento criado na sua agenda.");
    },
    onError: notifyError,
  });
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { readonly id: string; readonly input: UpdateEventInput }) =>
      updateCalendarEvent(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: EVENTS_KEY });
      toast.success("Evento atualizado.");
    },
    onError: notifyError,
  });
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCalendarEvent(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: EVENTS_KEY });
      toast.success("Evento removido.");
    },
    onError: notifyError,
  });
}
