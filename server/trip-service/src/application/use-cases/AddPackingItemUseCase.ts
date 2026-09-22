import { randomUUID } from "node:crypto";
import { err, ok, type Result } from "../result.js";
import type { TripOperationError } from "../errors.js";
import type { PackingCategory } from "../../domain/entities/Trip.js";
import type { ITripRepository } from "../../domain/repositories/ITripRepository.js";
import { loadOwnedTrip, toTripDetail, type TripDetail } from "./shared.js";

export type AddPackingItemDto = {
  readonly name: string;
  readonly category: PackingCategory;
  readonly quantity: number;
};

export class AddPackingItemUseCase {
  constructor(private readonly trips: ITripRepository) {}

  async execute(
    userId: string,
    tripId: string,
    dto: AddPackingItemDto,
  ): Promise<Result<TripDetail, TripOperationError>> {
    const existing = await loadOwnedTrip(this.trips, tripId, userId);
    if (!existing.ok) return err(existing.error);

    const updated = existing.value.withPackingItem({
      id: randomUUID(),
      name: dto.name,
      category: dto.category,
      quantity: dto.quantity,
      createdAt: new Date(),
    });
    if (!updated.ok) return err(updated.error);

    await this.trips.update(updated.trip);
    return ok(toTripDetail(updated.trip));
  }
}
