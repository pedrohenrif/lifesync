import { err, ok, type Result } from "../result.js";
import type { TripAccessError } from "../errors.js";
import type { ChecklistItem, PackingItem, Trip } from "../../domain/entities/Trip.js";
import type { ITripRepository } from "../../domain/repositories/ITripRepository.js";

/** Resumo usado na listagem: contadores em vez das listas inteiras. */
export type TripSummary = {
  readonly id: string;
  readonly name: string;
  readonly destination: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly notes: string | null;
  readonly isArchived: boolean;
  readonly packingTotal: number;
  readonly packingDone: number;
  readonly checklistTotal: number;
  readonly checklistDone: number;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type TripDetail = TripSummary & {
  readonly packingItems: readonly PackingItemView[];
  readonly checklistItems: readonly ChecklistItemView[];
};

export type PackingItemView = Omit<PackingItem, "createdAt"> & {
  readonly createdAt: string;
};

export type ChecklistItemView = Omit<ChecklistItem, "createdAt"> & {
  readonly createdAt: string;
};

export function toTripSummary(trip: Trip): TripSummary {
  return {
    id: trip.id,
    name: trip.name,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
    notes: trip.notes,
    isArchived: trip.isArchived,
    packingTotal: trip.packingItems.length,
    packingDone: trip.packedCount,
    checklistTotal: trip.checklistItems.length,
    checklistDone: trip.doneChecklistCount,
    createdAt: trip.createdAt.toISOString(),
    updatedAt: trip.updatedAt.toISOString(),
  };
}

export function toTripDetail(trip: Trip): TripDetail {
  return {
    ...toTripSummary(trip),
    packingItems: trip.packingItems.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
    checklistItems: trip.checklistItems.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
  };
}

/**
 * Toda operação sobre uma viagem passa por aqui: garante que ela existe e que
 * pertence a quem está pedindo, antes de qualquer mutação.
 */
export async function loadOwnedTrip(
  trips: ITripRepository,
  tripId: string,
  userId: string,
): Promise<Result<Trip, TripAccessError>> {
  const trip = await trips.findById(tripId);
  if (trip === null) return err({ code: "TRIP_NOT_FOUND" });
  if (trip.userId !== userId) return err({ code: "FORBIDDEN" });
  return ok(trip);
}
