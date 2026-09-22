import { randomUUID } from "node:crypto";
import { err, ok, type Result } from "../result.js";
import type { TripOperationError } from "../errors.js";
import type { ITripRepository } from "../../domain/repositories/ITripRepository.js";
import { loadOwnedTrip, toTripDetail, type TripDetail } from "./shared.js";

export type AddChecklistItemDto = {
  readonly title: string;
  readonly dueDate: string | null;
};

export class AddChecklistItemUseCase {
  constructor(private readonly trips: ITripRepository) {}

  async execute(
    userId: string,
    tripId: string,
    dto: AddChecklistItemDto,
  ): Promise<Result<TripDetail, TripOperationError>> {
    const existing = await loadOwnedTrip(this.trips, tripId, userId);
    if (!existing.ok) return err(existing.error);

    const updated = existing.value.withChecklistItem({
      id: randomUUID(),
      title: dto.title,
      dueDate: dto.dueDate,
      createdAt: new Date(),
    });
    if (!updated.ok) return err(updated.error);

    await this.trips.update(updated.trip);
    return ok(toTripDetail(updated.trip));
  }
}
