/** Cifra simétrica para o refresh token, que fica em repouso no banco. */
export interface ITokenCipher {
  encrypt(plainText: string): string;
  /** Retorna null quando o texto cifrado é inválido ou foi adulterado. */
  decrypt(cipherText: string): string | null;
}
