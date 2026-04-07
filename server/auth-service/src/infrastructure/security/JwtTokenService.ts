import jwt from "jsonwebtoken";
import type { ITokenGenerator } from "../../domain/services/ITokenGenerator.js";

export class JwtTokenService implements ITokenGenerator {
  constructor(private readonly secret: string) {}

  generate(userId: string, role: string): string {
    return jwt.sign({ sub: userId, role }, this.secret, { expiresIn: "1d" });
  }
}
