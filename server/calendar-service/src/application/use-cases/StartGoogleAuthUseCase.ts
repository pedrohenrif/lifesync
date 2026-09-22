import { err, ok, type Result } from "../result.js";
import type { IGoogleOAuthClient } from "../ports/IGoogleOAuthClient.js";
import type { IOAuthStateSigner } from "../ports/IOAuthStateSigner.js";

export type StartGoogleAuthError = { readonly code: "GOOGLE_NOT_CONFIGURED" };

export class StartGoogleAuthUseCase {
  constructor(
    private readonly oauthClient: IGoogleOAuthClient,
    private readonly stateSigner: IOAuthStateSigner,
  ) {}

  execute(userId: string): Result<{ readonly authUrl: string }, StartGoogleAuthError> {
    if (!this.oauthClient.isConfigured()) {
      return err({ code: "GOOGLE_NOT_CONFIGURED" });
    }
    const state = this.stateSigner.sign(userId);
    return ok({ authUrl: this.oauthClient.buildAuthUrl(state) });
  }
}
