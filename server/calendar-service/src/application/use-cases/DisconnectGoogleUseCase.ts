import type { IGoogleConnectionRepository } from "../../domain/repositories/IGoogleConnectionRepository.js";
import type { GoogleAccessTokenProvider } from "../services/GoogleAccessTokenProvider.js";

export class DisconnectGoogleUseCase {
  constructor(
    private readonly connections: IGoogleConnectionRepository,
    private readonly tokenProvider: GoogleAccessTokenProvider,
  ) {}

  async execute(userId: string): Promise<void> {
    await this.connections.deleteByUserId(userId);
    this.tokenProvider.invalidate(userId);
  }
}
