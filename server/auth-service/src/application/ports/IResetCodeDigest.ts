/** Digest one-way do código de 6 dígitos. A implementação usa HMAC, não bcrypt. */
export interface IResetCodeDigest {
  hash(code: string): string;
  matches(code: string, storedHash: string): boolean;
}
