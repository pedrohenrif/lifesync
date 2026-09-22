import jwt from "jsonwebtoken";
import type { IOAuthStateSigner } from "../../application/ports/IOAuthStateSigner.js";

const STATE_TTL_SECONDS = 600;
/** Distingue o state de um token de sessão assinado com o mesmo segredo. */
const STATE_PURPOSE = "google-oauth-state";

export class JwtOAuthStateSigner implements IOAuthStateSigner {
  constructor(private readonly secret: string) {}

  sign(userId: string): string {
    return jwt.sign({ sub: userId, purpose: STATE_PURPOSE }, this.secret, {
      expiresIn: STATE_TTL_SECONDS,
    });
  }

  verify(state: string): string | null {
    try {
      const payload = jwt.verify(state, this.secret);
      if (typeof payload === "string") return null;
      if (payload.purpose !== STATE_PURPOSE) return null;
      return typeof payload.sub === "string" ? payload.sub : null;
    } catch {
      return null;
    }
  }
}
