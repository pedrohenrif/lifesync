import jwt from "jsonwebtoken";
import type { ITokenGenerator } from "../../domain/services/ITokenGenerator.js";

export class JwtTokenService implements ITokenGenerator {
  constructor(private readonly secret: string) {}

  generate(userId: string): string {
    return jwt.sign({ sub: userId }, this.secret, { expiresIn: "1d" });
  }
}
