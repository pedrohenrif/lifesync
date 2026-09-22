import type { ITripRepository, TripFilter } from "../../domain/repositories/ITripRepository.js";
import { mapPaginated, type Paginated, type PaginationParams } from "../../domain/pagination.js";
import { toTripSummary, type TripSummary } from "./shared.js";

export class ListTripsUseCase {
  constructor(private readonly trips: ITripRepository) {}

  async execute(
    userId: string,
    filter: TripFilter,
    pagination: PaginationParams,
  ): Promise<Paginated<TripSummary>> {
    const page = await this.trips.findByUserId(userId, filter, pagination);
    return mapPaginated(page, toTripSummary);
  }
}
