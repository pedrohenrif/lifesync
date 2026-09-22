import { err, ok, type Result } from "../result.js";
import type { IGoogleConnectionRepository } from "../../domain/repositories/IGoogleConnectionRepository.js";
import type { IGoogleOAuthClient } from "../ports/IGoogleOAuthClient.js";
import type { ITokenCipher } from "../ports/ITokenCipher.js";

export type AccessTokenError =
  | { readonly code: "NOT_CONNECTED" }
  | { readonly code: "CONNECTION_BROKEN" }
  | { readonly code: "GOOGLE_UNAVAILABLE" };

type CachedToken = {
  readonly accessToken: string;
  readonly expiresAtMs: number;
};

/** Margem para não usar um token que expira no meio da requisição seguinte. */
const EXPIRY_SKEW_MS = 60_000;

/**
 * Troca o refresh token guardado por um access token válido. O access token vale
 * cerca de uma hora, então fica em memória para não gastar uma ida à Google a
 * cada requisição da agenda. Cache em processo é suficiente: se o serviço
 * reiniciar, o pior caso é um refresh extra.
 */
export class GoogleAccessTokenProvider {
  private readonly cache = new Map<string, CachedToken>();

  constructor(
    private readonly connections: IGoogleConnectionRepository,
    private readonly oauthClient: IGoogleOAuthClient,
    private readonly cipher: ITokenCipher,
  ) {}

  async getAccessToken(userId: string): Promise<Result<string, AccessTokenError>> {
    const cached = this.cache.get(userId);
    if (cached !== undefined && cached.expiresAtMs - EXPIRY_SKEW_MS > Date.now()) {
      return ok(cached.accessToken);
    }

    const connection = await this.connections.findByUserId(userId);
    if (connection === null) return err({ code: "NOT_CONNECTED" });

    const refreshToken = this.cipher.decrypt(connection.encryptedRefreshToken);
    if (refreshToken === null) return err({ code: "CONNECTION_BROKEN" });

    const refreshed = await this.oauthClient.refreshAccessToken(refreshToken);
    if (!refreshed.ok) {
      // Token revogado pelo usuário na conta Google: a conexão não serve mais.
      if (refreshed.error.code === "GOOGLE_AUTH_DENIED") {
        this.cache.delete(userId);
        return err({ code: "CONNECTION_BROKEN" });
      }
      return err({ code: "GOOGLE_UNAVAILABLE" });
    }

    this.cache.set(userId, {
      accessToken: refreshed.value.accessToken,
      expiresAtMs: Date.now() + refreshed.value.expiresInSeconds * 1000,
    });
    return ok(refreshed.value.accessToken);
  }

  invalidate(userId: string): void {
    this.cache.delete(userId);
  }
}
