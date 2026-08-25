import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

type JwtPayload = { readonly sub?: unknown };

function parseBearerToken(authorization: string | undefined): string | null {
  if (authorization === undefined) return null;
  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || token === undefined || token.length === 0) return null;
  return token;
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
