import { randomUUID } from "node:crypto";
import { err, ok, type Result } from "../result.js";
import type { TripOperationError } from "../errors.js";
import type { ITripRepository } from "../../domain/repositories/ITripRepository.js";
import { loadOwnedTrip, toTripDetail, type TripDetail } from "./shared.js";

export type AddItineraryItemDto = {
  readonly date: string;
  readonly time: string | null;
  readonly title: string;
  readonly description: string | null;
  readonly location: string | null;
};

export class AddItineraryItemUseCase {
  constructor(private readonly trips: ITripRepository) {}

  async execute(
    userId: string,
    tripId: string,
    dto: AddItineraryItemDto,
  ): Promise<Result<TripDetail, TripOperationError>> {
    const existing = await loadOwnedTrip(this.trips, tripId, userId);
    if (!existing.ok) return err(existing.error);

    const updated = existing.value.withItineraryItem({
      id: randomUUID(),
      createdAt: new Date(),
      ...dto,
    });
    if (!updated.ok) return err(updated.error);

    await this.trips.update(updated.trip);
    return ok(toTripDetail(updated.trip));
  }
}
