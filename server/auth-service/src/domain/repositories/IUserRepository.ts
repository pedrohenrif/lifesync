import type { User } from "../entities/User.js";

/**
 * Contrato de persistência — implementação na Infrastructure (Mongoose).
 */
export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}
