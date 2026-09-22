import type { Trip } from "../entities/Trip.js";
import type { Paginated, PaginationParams } from "../pagination.js";

export type TripFilter = {
  /** Viagens arquivadas ficam fora da listagem por padrão. */
  readonly includeArchived: boolean;
};

export interface ITripRepository {
  save(trip: Trip): Promise<void>;
  findById(id: string): Promise<Trip | null>;
  findByUserId(
    userId: string,
    filter: TripFilter,
    pagination: PaginationParams,
  ): Promise<Paginated<Trip>>;
  update(trip: Trip): Promise<void>;
  delete(id: string): Promise<void>;
}
