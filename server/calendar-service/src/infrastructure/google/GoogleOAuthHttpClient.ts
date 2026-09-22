import { err, ok, type Result } from "../../application/result.js";
import type {
  GoogleAuthError,
  GoogleTokens,
  IGoogleOAuthClient,
  RefreshedAccessToken,
} from "../../application/ports/IGoogleOAuthClient.js";

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

/**
 * `openid` e `email` são escopos não sensíveis e só servem para exibir qual conta
 * foi conectada. O acesso à agenda vem de `calendar`, que é o escopo sensível.
 */
const SCOPES = ["openid", "email", "https://www.googleapis.com/auth/calendar"] as const;

export type GoogleOAuthConfig = {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly redirectUri: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Lê o email do id_token sem verificar assinatura. É seguro aqui porque o token
 * veio direto do endpoint da Google, por TLS, em resposta à nossa própria troca
 * autenticada — não é um token recebido de terceiros.
 */
function readEmailFromIdToken(idToken: string | null): string | null {
  if (idToken === null) return null;
  const payload = idToken.split(".")[1];
  if (payload === undefined) return null;

  try {
    const decoded: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return isRecord(decoded) ? readString(decoded.email) : null;
  } catch {
    return null;
  }
}

export class GoogleOAuthHttpClient implements IGoogleOAuthClient {
  constructor(private readonly config: GoogleOAuthConfig) {}

  isConfigured(): boolean {
    return (
      this.config.clientId.trim().length > 0 && this.config.clientSecret.trim().length > 0
    );
  }

  buildAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: "code",
      scope: SCOPES.join(" "),
      // A Google só devolve refresh_token com access_type=offline, e só na primeira
      // autorização — prompt=consent força um novo a cada reconexão.
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      state,
    });
    return `${AUTH_ENDPOINT}?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<Result<GoogleTokens, GoogleAuthError>> {
    if (!this.isConfigured()) return err({ code: "GOOGLE_NOT_CONFIGURED" });

    const response = await this.postForm({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri,
      grant_type: "authorization_code",
      code,
    });
    if (!response.ok) return err(response.error);

    const payload = response.value;
    if (!isRecord(payload)) return err({ code: "GOOGLE_UPSTREAM_ERROR", status: 0 });

    const refreshToken = readString(payload.refresh_token);
    const accessToken = readString(payload.access_token);
    if (refreshToken === null || accessToken === null) {
      return err({ code: "GOOGLE_MISSING_REFRESH_TOKEN" });
    }

    return ok({
      refreshToken,
      accessToken,
      expiresInSeconds: typeof payload.expires_in === "number" ? payload.expires_in : 3600,
      scope: readString(payload.scope) ?? SCOPES.join(" "),
      email: readEmailFromIdToken(readString(payload.id_token)),
    });
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<Result<RefreshedAccessToken, GoogleAuthError>> {
    if (!this.isConfigured()) return err({ code: "GOOGLE_NOT_CONFIGURED" });

    const response = await this.postForm({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });
    if (!response.ok) return err(response.error);

    const payload = response.value;
    const accessToken = isRecord(payload) ? readString(payload.access_token) : null;
    if (accessToken === null) return err({ code: "GOOGLE_AUTH_DENIED" });

    return ok({
      accessToken,
      expiresInSeconds:
        isRecord(payload) && typeof payload.expires_in === "number" ? payload.expires_in : 3600,
    });
  }

  private async postForm(
    body: Record<string, string>,
  ): Promise<Result<unknown, GoogleAuthError>> {
    try {
      const response = await fetch(TOKEN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(body).toString(),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        console.error(`Google OAuth error ${response.status}: ${detail}`);
        // invalid_grant significa refresh token revogado ou expirado: o usuário
        // precisa reconectar, não adianta tentar de novo.
        if (response.status === 400 || response.status === 401) {
          return err({ code: "GOOGLE_AUTH_DENIED" });
        }
        return err({ code: "GOOGLE_UPSTREAM_ERROR", status: response.status });
      }

      return ok(await response.json());
    } catch (error) {
      console.error("Google OAuth request failed", error);
      return err({ code: "GOOGLE_UPSTREAM_ERROR", status: 0 });
    }
  }
}
