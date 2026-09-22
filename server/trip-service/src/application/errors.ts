import type { TripValidationError } from "../domain/entities/Trip.js";

export type TripAccessError =
  | { readonly code: "TRIP_NOT_FOUND" }
  /** Viagem existe, mas é de outro usuário: resposta 403. */
  | { readonly code: "FORBIDDEN" };

export type TripOperationError = TripAccessError | TripValidationError;
