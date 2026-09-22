import { createHmac, timingSafeEqual } from "node:crypto";
import type { IResetCodeDigest } from "../../application/ports/IResetCodeDigest.js";

export class HmacResetCodeDigest implements IResetCodeDigest {
  constructor(private readonly secret: string) {}

  hash(code: string): string {
    return createHmac("sha256", this.secret).update(code, "utf8").digest("hex");
  }

  matches(code: string, storedHash: string): boolean {
    const computed = Buffer.from(this.hash(code), "hex");
    const stored = Buffer.from(storedHash, "hex");
    if (computed.length !== stored.length) {
      return false;
    }
    return timingSafeEqual(computed, stored);
  }
}
