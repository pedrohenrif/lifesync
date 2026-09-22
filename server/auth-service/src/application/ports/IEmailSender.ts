export type PasswordResetMail = {
  readonly to: string;
  readonly code: string;
};

export interface IEmailSender {
  readonly isConfigured: boolean;
  sendPasswordResetCode(mail: PasswordResetMail): Promise<void>;
}
