import type { GoogleConnection } from "../entities/GoogleConnection.js";

export interface IGoogleConnectionRepository {
  /** Substitui a conexão existente do usuário — só há uma conta Google por usuário. */
  upsert(connection: GoogleConnection): Promise<void>;
  findByUserId(userId: string): Promise<GoogleConnection | null>;
  deleteByUserId(userId: string): Promise<void>;
}
