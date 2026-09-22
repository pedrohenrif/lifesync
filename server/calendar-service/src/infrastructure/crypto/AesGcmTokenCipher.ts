import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { ITokenCipher } from "../../application/ports/ITokenCipher.js";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

/**
 * Cifra o refresh token em repouso. Um vazamento do banco sozinho não dá acesso
 * à agenda do usuário: sem a TOKEN_ENCRYPTION_KEY o valor é inútil.
 *
 * Formato armazenado: base64(iv || authTag || ciphertext).
 */
export class AesGcmTokenCipher implements ITokenCipher {
  private readonly key: Buffer;

  constructor(base64Key: string) {
    const key = Buffer.from(base64Key, "base64");
    if (key.length !== KEY_BYTES) {
      throw new Error(
        `TOKEN_ENCRYPTION_KEY must decode to ${KEY_BYTES} bytes. Generate one with: openssl rand -base64 32`,
      );
    }
    this.key = key;
  }

  encrypt(plainText: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64");
  }

  decrypt(cipherText: string): string | null {
    try {
      const raw = Buffer.from(cipherText, "base64");
      if (raw.length <= IV_BYTES + AUTH_TAG_BYTES) return null;

      const iv = raw.subarray(0, IV_BYTES);
      const authTag = raw.subarray(IV_BYTES, IV_BYTES + AUTH_TAG_BYTES);
      const encrypted = raw.subarray(IV_BYTES + AUTH_TAG_BYTES);

      const decipher = createDecipheriv(ALGORITHM, this.key, iv);
      decipher.setAuthTag(authTag);
      return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    } catch {
      // Tag inválida significa chave trocada ou dado adulterado: tratamos como sem conexão.
      return null;
    }
  }
}
