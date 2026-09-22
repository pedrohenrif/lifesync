export interface GoogleConnectionProps {
  readonly id: string;
  readonly userId: string;
  /** Conta Google autorizada. Null quando o id_token não trouxe o email. */
  readonly googleEmail: string | null;
  /** Refresh token já cifrado — a entidade nunca vê o valor em claro. */
  readonly encryptedRefreshToken: string;
  readonly scope: string;
  readonly connectedAt: Date;
  readonly updatedAt: Date;
}

export type GoogleConnectionValidationError =
  | { readonly code: "USER_ID_REQUIRED" }
  | { readonly code: "REFRESH_TOKEN_REQUIRED" };

export type CreateGoogleConnectionResult =
  | { readonly ok: true; readonly connection: GoogleConnection }
  | { readonly ok: false; readonly error: GoogleConnectionValidationError };

export class GoogleConnection {
  private constructor(private readonly props: GoogleConnectionProps) {}

  static create(props: GoogleConnectionProps): CreateGoogleConnectionResult {
    if (props.userId.trim().length === 0) {
      return { ok: false, error: { code: "USER_ID_REQUIRED" } };
    }
    if (props.encryptedRefreshToken.trim().length === 0) {
      return { ok: false, error: { code: "REFRESH_TOKEN_REQUIRED" } };
    }
    return { ok: true, connection: new GoogleConnection(props) };
  }

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get googleEmail(): string | null { return this.props.googleEmail; }
  get encryptedRefreshToken(): string { return this.props.encryptedRefreshToken; }
  get scope(): string { return this.props.scope; }
  get connectedAt(): Date { return this.props.connectedAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
}
