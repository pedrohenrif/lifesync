import { err, ok, type Result } from "../result.js";
import type { TripOperationError } from "../errors.js";
import type { ChecklistItemChanges } from "../../domain/entities/Trip.js";
import type { ITripRepository } from "../../domain/repositories/ITripRepository.js";
import { loadOwnedTrip, toTripDetail, type TripDetail } from "./shared.js";

export class UpdateChecklistItemUseCase {
  constructor(private readonly trips: ITripRepository) {}

  async execute(
    userId: string,
    tripId: string,
    itemId: string,
    changes: ChecklistItemChanges,
  ): Promise<Result<TripDetail, TripOperationError>> {
    const existing = await loadOwnedTrip(this.trips, tripId, userId);
    if (!existing.ok) return err(existing.error);

    const updated = existing.value.withUpdatedChecklistItem(itemId, changes);
    if (!updated.ok) return err(updated.error);

    await this.trips.update(updated.trip);
    return ok(toTripDetail(updated.trip));
  }
}
