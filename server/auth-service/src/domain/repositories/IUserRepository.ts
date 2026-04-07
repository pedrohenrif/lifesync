import type { User, UserStatus } from "../entities/User.js";

export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByStatus(status: UserStatus): Promise<User[]>;
  updateStatus(id: string, status: UserStatus): Promise<void>;
}
