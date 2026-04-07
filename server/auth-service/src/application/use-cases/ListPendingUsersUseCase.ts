import { ok, type Result } from "../result.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";

export type PendingUser = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly createdAt: string;
};

export type ListPendingUsersSuccess = {
  readonly users: PendingUser[];
};

export class ListPendingUsersUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(): Promise<Result<ListPendingUsersSuccess, never>> {
    const pendingUsers = await this.users.findByStatus("PENDING");

    return ok({
      users: pendingUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt.toISOString(),
      })),
    });
  }
}
