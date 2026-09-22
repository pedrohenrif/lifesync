import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addChecklistItem,
  addItineraryItem,
  addPackingItem,
  addReservation,
  createTrip,
  deleteTrip,
  getTrip,
  getTrips,
  removeChecklistItem,
  removeItineraryItem,
  removePackingItem,
  removeReservation,
  TripApiError,
  updateChecklistItem,
  updateItineraryItem,
  updatePackingItem,
  updateReservation,
  updateTrip,
  type AddChecklistItemInput,
  type AddItineraryItemInput,
  type AddPackingItemInput,
  type AddReservationInput,
  type CreateTripInput,
  type Trip,
  type TripSummary,
  type UpdateChecklistItemInput,
  type UpdateItineraryItemInput,
  type UpdatePackingItemInput,
  type UpdateReservationInput,
  type UpdateTripInput,
} from "../api/trips";
import { useInfiniteList } from "./useInfiniteList";

const TRIPS_LIST_KEY = ["trips", "list"] as const;

function tripKey(tripId: string) {
  return ["trips", "detail", tripId] as const;
}

function notifyError(error: unknown): void {
  toast.error(
    error instanceof TripApiError
      ? error.message
      : "Não foi possível completar a operação.",
  );
}

/** Os contadores do cabeçalho vêm no payload, então precisam ser refeitos junto. */
function withRecountedTotals(trip: Trip): Trip {
  return {
    ...trip,
    packingTotal: trip.packingItems.length,
    packingDone: trip.packingItems.filter((item) => item.isPacked).length,
    checklistTotal: trip.checklistItems.length,
    checklistDone: trip.checklistItems.filter((item) => item.isDone).length,
  };
}

export function useTrips(includeArchived = false) {
  return useInfiniteList<TripSummary, Awaited<ReturnType<typeof getTrips>>>({
    queryKey: [...TRIPS_LIST_KEY, { includeArchived }],
    fetchPage: (request) => getTrips(request, includeArchived),
  });
}

export function useTrip(tripId: string | undefined) {
  return useQuery({
    queryKey: tripKey(tripId ?? ""),
    queryFn: () => getTrip(tripId as string),
    enabled: tripId !== undefined && tripId.length > 0,
    retry: false,
  });
}

/** Mutações devolvem a viagem inteira: grava no cache e revalida só a listagem. */
function useTripMutationHandlers() {
  const queryClient = useQueryClient();

  return {
    queryClient,
    onTripSettled: (trip: Trip): void => {
      queryClient.setQueryData(tripKey(trip.id), trip);
      void queryClient.invalidateQueries({ queryKey: TRIPS_LIST_KEY });
    },
  };
}

export function useCreateTrip() {
  const { onTripSettled } = useTripMutationHandlers();

  return useMutation({
    mutationFn: (input: CreateTripInput) => createTrip(input),
    onSuccess: (trip) => {
      onTripSettled(trip);
      toast.success("Viagem criada.");
    },
    onError: notifyError,
  });
}

export function useUpdateTrip() {
  const { onTripSettled } = useTripMutationHandlers();

  return useMutation({
    mutationFn: ({ tripId, input }: { readonly tripId: string; readonly input: UpdateTripInput }) =>
      updateTrip(tripId, input),
    onSuccess: onTripSettled,
    onError: notifyError,
  });
}

export function useDeleteTrip() {
  const { queryClient } = useTripMutationHandlers();

  return useMutation({
    mutationFn: (tripId: string) => deleteTrip(tripId),
    onSuccess: (_result, tripId) => {
      queryClient.removeQueries({ queryKey: tripKey(tripId) });
      void queryClient.invalidateQueries({ queryKey: TRIPS_LIST_KEY });
      toast.success("Viagem removida.");
    },
    onError: notifyError,
  });
}

export function useAddPackingItem() {
  const { onTripSettled } = useTripMutationHandlers();

  return useMutation({
    mutationFn: ({
      tripId,
      input,
    }: {
      readonly tripId: string;
      readonly input: AddPackingItemInput;
    }) => addPackingItem(tripId, input),
    onSuccess: onTripSettled,
    onError: notifyError,
  });
}

/**
 * Marcar "já guardei" precisa responder na hora: numa lista de bagagem o usuário
 * toca vários itens seguidos, às vezes com conexão ruim.
 */
export function useUpdatePackingItem() {
  const { queryClient, onTripSettled } = useTripMutationHandlers();

  return useMutation({
    mutationFn: ({
      tripId,
      itemId,
      input,
    }: {
      readonly tripId: string;
      readonly itemId: string;
      readonly input: UpdatePackingItemInput;
    }) => updatePackingItem(tripId, itemId, input),
    onMutate: async ({ tripId, itemId, input }) => {
      await queryClient.cancelQueries({ queryKey: tripKey(tripId) });
      const previous = queryClient.getQueryData<Trip>(tripKey(tripId));

      if (previous !== undefined) {
        queryClient.setQueryData<Trip>(
          tripKey(tripId),
          withRecountedTotals({
            ...previous,
            packingItems: previous.packingItems.map((item) =>
              item.id === itemId ? { ...item, ...input } : item,
            ),
          }),
        );
      }

      return { previous };
    },
    onError: (error, variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(tripKey(variables.tripId), context.previous);
      }
      notifyError(error);
    },
    onSuccess: onTripSettled,
  });
}

export function useRemovePackingItem() {
  const { onTripSettled } = useTripMutationHandlers();

  return useMutation({
    mutationFn: ({ tripId, itemId }: { readonly tripId: string; readonly itemId: string }) =>
      removePackingItem(tripId, itemId),
    onSuccess: onTripSettled,
    onError: notifyError,
  });
}

export function useAddChecklistItem() {
  const { onTripSettled } = useTripMutationHandlers();

  return useMutation({
    mutationFn: ({
      tripId,
      input,
    }: {
      readonly tripId: string;
      readonly input: AddChecklistItemInput;
    }) => addChecklistItem(tripId, input),
    onSuccess: onTripSettled,
    onError: notifyError,
  });
}

export function useUpdateChecklistItem() {
  const { queryClient, onTripSettled } = useTripMutationHandlers();

  return useMutation({
    mutationFn: ({
      tripId,
      itemId,
      input,
    }: {
      readonly tripId: string;
      readonly itemId: string;
      readonly input: UpdateChecklistItemInput;
    }) => updateChecklistItem(tripId, itemId, input),
    onMutate: async ({ tripId, itemId, input }) => {
      await queryClient.cancelQueries({ queryKey: tripKey(tripId) });
      const previous = queryClient.getQueryData<Trip>(tripKey(tripId));

      if (previous !== undefined) {
        queryClient.setQueryData<Trip>(
          tripKey(tripId),
          withRecountedTotals({
            ...previous,
            checklistItems: previous.checklistItems.map((item) =>
              item.id === itemId ? { ...item, ...input } : item,
            ),
          }),
        );
      }

      return { previous };
    },
    onError: (error, variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(tripKey(variables.tripId), context.previous);
      }
      notifyError(error);
    },
    onSuccess: onTripSettled,
  });
}

export function useRemoveChecklistItem() {
  const { onTripSettled } = useTripMutationHandlers();

  return useMutation({
    mutationFn: ({ tripId, itemId }: { readonly tripId: string; readonly itemId: string }) =>
      removeChecklistItem(tripId, itemId),
    onSuccess: onTripSettled,
    onError: notifyError,
  });
}

export function useAddReservation() {
  const { onTripSettled } = useTripMutationHandlers();

  return useMutation({
    mutationFn: ({
      tripId,
      input,
    }: {
      readonly tripId: string;
      readonly input: AddReservationInput;
    }) => addReservation(tripId, input),
    onSuccess: (trip) => {
      onTripSettled(trip);
      toast.success("Reserva salva.");
    },
    onError: notifyError,
  });
}

export function useUpdateReservation() {
  const { onTripSettled } = useTripMutationHandlers();

  return useMutation({
    mutationFn: ({
      tripId,
      itemId,
      input,
    }: {
      readonly tripId: string;
      readonly itemId: string;
      readonly input: UpdateReservationInput;
    }) => updateReservation(tripId, itemId, input),
    onSuccess: onTripSettled,
    onError: notifyError,
  });
}

export function useRemoveReservation() {
  const { onTripSettled } = useTripMutationHandlers();

  return useMutation({
    mutationFn: ({ tripId, itemId }: { readonly tripId: string; readonly itemId: string }) =>
      removeReservation(tripId, itemId),
    onSuccess: onTripSettled,
    onError: notifyError,
  });
}

export function useAddItineraryItem() {
  const { onTripSettled } = useTripMutationHandlers();

  return useMutation({
    mutationFn: ({
      tripId,
      input,
    }: {
      readonly tripId: string;
      readonly input: AddItineraryItemInput;
    }) => addItineraryItem(tripId, input),
    onSuccess: onTripSettled,
    onError: notifyError,
  });
}

export function useUpdateItineraryItem() {
  const { onTripSettled } = useTripMutationHandlers();

  return useMutation({
    mutationFn: ({
      tripId,
      itemId,
      input,
    }: {
      readonly tripId: string;
      readonly itemId: string;
      readonly input: UpdateItineraryItemInput;
    }) => updateItineraryItem(tripId, itemId, input),
    onSuccess: onTripSettled,
    onError: notifyError,
  });
}

export function useRemoveItineraryItem() {
  const { onTripSettled } = useTripMutationHandlers();

  return useMutation({
    mutationFn: ({ tripId, itemId }: { readonly tripId: string; readonly itemId: string }) =>
      removeItineraryItem(tripId, itemId),
    onSuccess: onTripSettled,
    onError: notifyError,
  });
}
