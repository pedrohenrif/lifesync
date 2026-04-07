import type { NextFunction, Request, Response } from "express";

export function createAdminMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ error: { code: "FORBIDDEN" } });
      return;
    }
    next();
  };
}
