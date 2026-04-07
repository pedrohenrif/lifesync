import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      readonly id: string;
      readonly role: string;
    };
  }
}
