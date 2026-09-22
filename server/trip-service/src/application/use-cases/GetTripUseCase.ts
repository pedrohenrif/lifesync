import { err, ok, type Result } from "../result.js";
import type { TripAccessError } from "../errors.js";
import type { ITripRepository } from "../../domain/repositories/ITripRepository.js";
import { loadOwnedTrip, toTripDetail, type TripDetail } from "./shared.js";

export class GetTripUseCase {
  constructor(private readonly trips: ITripRepository) {}

  async execute(
    userId: string,
    tripId: string,
  ): Promise<Result<TripDetail, TripAccessError>> {
    const trip = await loadOwnedTrip(this.trips, tripId, userId);
    if (!trip.ok) return err(trip.error);
    return ok(toTripDetail(trip.value));
  }
}
