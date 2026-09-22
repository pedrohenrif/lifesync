import { randomUUID } from "node:crypto";
import { err, ok, type Result } from "../result.js";
import { GoogleConnection } from "../../domain/entities/GoogleConnection.js";
import type { IGoogleConnectionRepository } from "../../domain/repositories/IGoogleConnectionRepository.js";
import type { IGoogleOAuthClient } from "../ports/IGoogleOAuthClient.js";
import type { IOAuthStateSigner } from "../ports/IOAuthStateSigner.js";
import type { ITokenCipher } from "../ports/ITokenCipher.js";
import type { GoogleAccessTokenProvider } from "../services/GoogleAccessTokenProvider.js";

export type CompleteGoogleAuthError =
  | { readonly code: "INVALID_STATE" }
  | { readonly code: "GOOGLE_AUTH_FAILED" }
  | { readonly code: "MISSING_REFRESH_TOKEN" }
  | { readonly code: "PERSISTENCE_FAILED" };

export type CompleteGoogleAuthInput = {
  readonly code: string;
  readonly state: string;
};

export class CompleteGoogleAuthUseCase {
  constructor(
    private readonly connections: IGoogleConnectionRepository,
    private readonly oauthClient: IGoogleOAuthClient,
    private readonly stateSigner: IOAuthStateSigner,
    private readonly cipher: ITokenCipher,
    private readonly tokenProvider: GoogleAccessTokenProvider,
  ) {}

  async execute(
    input: CompleteGoogleAuthInput,
  ): Promise<Result<{ readonly userId: string }, CompleteGoogleAuthError>> {
    const userId = this.stateSigner.verify(input.state);
    if (userId === null) return err({ code: "INVALID_STATE" });

    const tokens = await this.oauthClient.exchangeCode(input.code);
    if (!tokens.ok) {
      if (tokens.error.code === "GOOGLE_MISSING_REFRESH_TOKEN") {
        return err({ code: "MISSING_REFRESH_TOKEN" });
      }
      return err({ code: "GOOGLE_AUTH_FAILED" });
    }

    const now = new Date();
    const connection = GoogleConnection.create({
      id: randomUUID(),
      userId,
      googleEmail: tokens.value.email,
      encryptedRefreshToken: this.cipher.encrypt(tokens.value.refreshToken),
      scope: tokens.value.scope,
      connectedAt: now,
      updatedAt: now,
    });
    if (!connection.ok) return err({ code: "PERSISTENCE_FAILED" });

    await this.connections.upsert(connection.connection);
    // Uma reconexão invalida o access token em cache do refresh token antigo.
    this.tokenProvider.invalidate(userId);

    return ok({ userId });
  }
}
