import { ok, type Result } from "../result.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import type { User } from "../../domain/entities/User.js";
import {
  mapPaginated,
  type Paginated,
  type PaginationParams,
} from "../../domain/pagination.js";

export type PendingUser = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly createdAt: string;
};

export type ListPendingUsersSuccess = {
  readonly users: Paginated<PendingUser>;
};

function toPendingUser(user: User): PendingUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

export class ListPendingUsersUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(
    pagination: PaginationParams,
  ): Promise<Result<ListPendingUsersSuccess, never>> {
    const page = await this.users.findByStatus("PENDING", pagination);
    return ok({ users: mapPaginated(page, toPendingUser) });
  }
}
