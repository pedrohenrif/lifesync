/**
 * Porta de domínio: hashing de senha sem acoplar bcrypt/biblioteca na Application.
 * Implementação concreta fica na Infrastructure.
 */
export interface IPasswordHasher {
  hash(plainTextPassword: string): Promise<string>;
  compare(plainText: string, hash: string): Promise<boolean>;
}
