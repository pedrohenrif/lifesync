export type PasswordResetRecord = {
  readonly email: string;
  readonly codeHash: string;
  readonly expiresAt: Date;
  readonly attemptCount: number;
  readonly createdAt: Date;
};

export interface IPasswordResetRepository {
  replaceForEmail(
    record: Omit<PasswordResetRecord, "attemptCount">,
  ): Promise<void>;
  findByEmail(email: string): Promise<PasswordResetRecord | null>;
  incrementAttempts(email: string): Promise<number>;
  deleteByEmail(email: string): Promise<void>;
}
