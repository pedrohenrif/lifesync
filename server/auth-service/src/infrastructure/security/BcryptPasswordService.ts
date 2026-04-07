import bcrypt from "bcrypt";
import type { IPasswordHasher } from "../../domain/services/IPasswordHasher.js";

const SALT_ROUNDS = 12;

export class BcryptPasswordService implements IPasswordHasher {
  async hash(plainTextPassword: string): Promise<string> {
    return bcrypt.hash(plainTextPassword, SALT_ROUNDS);
  }

  async compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}
