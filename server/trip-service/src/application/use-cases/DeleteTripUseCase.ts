import { err, ok, type Result } from "../result.js";
import type { TripAccessError } from "../errors.js";
import type { ITripRepository } from "../../domain/repositories/ITripRepository.js";
import { loadOwnedTrip } from "./shared.js";

export class DeleteTripUseCase {
  constructor(private readonly trips: ITripRepository) {}

  async execute(userId: string, tripId: string): Promise<Result<null, TripAccessError>> {
    const existing = await loadOwnedTrip(this.trips, tripId, userId);
    if (!existing.ok) return err(existing.error);

    await this.trips.delete(tripId);
    return ok(null);
  }
}
