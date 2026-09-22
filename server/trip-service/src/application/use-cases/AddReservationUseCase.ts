import { randomUUID } from "node:crypto";
import { err, ok, type Result } from "../result.js";
import type { TripOperationError } from "../errors.js";
import type { ITripRepository } from "../../domain/repositories/ITripRepository.js";
import { loadOwnedTrip, toTripDetail, type TripDetail } from "./shared.js";

export type AddReservationDto = {
  readonly type: string;
  readonly title: string;
  readonly provider: string | null;
  readonly confirmationCode: string | null;
  readonly url: string | null;
  readonly startAt: string | null;
  readonly endAt: string | null;
  readonly address: string | null;
  readonly notes: string | null;
};

export class AddReservationUseCase {
  constructor(private readonly trips: ITripRepository) {}

  async execute(
    userId: string,
    tripId: string,
    dto: AddReservationDto,
  ): Promise<Result<TripDetail, TripOperationError>> {
    const existing = await loadOwnedTrip(this.trips, tripId, userId);
    if (!existing.ok) return err(existing.error);

    const updated = existing.value.withReservation({
      id: randomUUID(),
      createdAt: new Date(),
      ...dto,
    });
    if (!updated.ok) return err(updated.error);

    await this.trips.update(updated.trip);
    return ok(toTripDetail(updated.trip));
  }
}
