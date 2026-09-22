import type { IGoogleConnectionRepository } from "../../domain/repositories/IGoogleConnectionRepository.js";
import type { IGoogleOAuthClient } from "../ports/IGoogleOAuthClient.js";

export type ConnectionStatus = {
  readonly connected: boolean;
  readonly googleEmail: string | null;
  readonly connectedAt: string | null;
  /** False quando o servidor não tem credenciais OAuth: a UI esconde o botão. */
  readonly available: boolean;
};

export class GetConnectionStatusUseCase {
  constructor(
    private readonly connections: IGoogleConnectionRepository,
    private readonly oauthClient: IGoogleOAuthClient,
  ) {}

  async execute(userId: string): Promise<ConnectionStatus> {
    const available = this.oauthClient.isConfigured();
    const connection = await this.connections.findByUserId(userId);

    if (connection === null) {
      return { connected: false, googleEmail: null, connectedAt: null, available };
    }

    return {
      connected: true,
      googleEmail: connection.googleEmail,
      connectedAt: connection.connectedAt.toISOString(),
      available,
    };
  }
}
