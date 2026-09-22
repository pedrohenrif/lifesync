import type { Result } from "../result.js";

export type GoogleAuthError =
  | { readonly code: "GOOGLE_NOT_CONFIGURED" }
  | { readonly code: "GOOGLE_AUTH_DENIED" }
  | { readonly code: "GOOGLE_UPSTREAM_ERROR"; readonly status: number }
  | { readonly code: "GOOGLE_MISSING_REFRESH_TOKEN" };

export type GoogleTokens = {
  readonly refreshToken: string;
  readonly accessToken: string;
  readonly expiresInSeconds: number;
  readonly scope: string;
  readonly email: string | null;
};

export type RefreshedAccessToken = {
  readonly accessToken: string;
  readonly expiresInSeconds: number;
};

export interface IGoogleOAuthClient {
  isConfigured(): boolean;
  /** URL de consentimento; `state` amarra o callback ao usuário que iniciou o fluxo. */
  buildAuthUrl(state: string): string;
  exchangeCode(code: string): Promise<Result<GoogleTokens, GoogleAuthError>>;
  refreshAccessToken(
    refreshToken: string,
  ): Promise<Result<RefreshedAccessToken, GoogleAuthError>>;
}
