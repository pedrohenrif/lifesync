import { randomUUID } from "node:crypto";
import { err, ok, type Result } from "../result.js";
import { Trip, type TripValidationError } from "../../domain/entities/Trip.js";
import type { ITripRepository } from "../../domain/repositories/ITripRepository.js";
import { toTripDetail, type TripDetail } from "./shared.js";

export type CreateTripDto = {
  readonly name: string;
  readonly destination: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly notes: string | null;
  readonly budgetAmount: number | null;
};

export class CreateTripUseCase {
  constructor(private readonly trips: ITripRepository) {}

  async execute(
    userId: string,
    dto: CreateTripDto,
  ): Promise<Result<TripDetail, TripValidationError>> {
    const now = new Date();
    const result = Trip.create({
      id: randomUUID(),
      userId,
      name: dto.name,
      destination: dto.destination,
      startDate: dto.startDate,
      endDate: dto.endDate,
      notes: dto.notes,
      budgetAmount: dto.budgetAmount,
      isArchived: false,
      packingItems: [],
      checklistItems: [],
      reservations: [],
      itineraryItems: [],
      createdAt: now,
      updatedAt: now,
    });

    if (!result.ok) return err(result.error);

    await this.trips.save(result.trip);
    return ok(toTripDetail(result.trip));
  }
}
