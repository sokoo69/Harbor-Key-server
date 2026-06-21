import type { JWTPayload } from "jose";

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload & {
        userId?: string;
        email?: string;
        role?: "tenant" | "owner" | "admin";
      };
    }
  }
}

export {};
