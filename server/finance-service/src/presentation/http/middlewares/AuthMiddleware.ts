import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

function parseBearerToken(header: string | undefined): string | null {
  if (header === undefined) return null;
  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1] ?? null;
}

export function createAuthMiddleware(secret: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = parseBearerToken(req.header("authorization"));
    if (token === null) {
      res.status(401).json({ error: { code: "UNAUTHORIZED" } });
      return;
    }
    try {
      const decoded = jwt.verify(token, secret) as JwtPayload;
      if (typeof decoded.sub !== "string" || decoded.sub.length === 0) {
        res.status(401).json({ error: { code: "UNAUTHORIZED" } });
        return;
      }
      req.user = { id: decoded.sub };
      next();
    } catch {
      res.status(401).json({ error: { code: "UNAUTHORIZED" } });
    }
  };
}
