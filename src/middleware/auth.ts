import { createRemoteJWKSet, jwtVerify } from "jose";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

const JWKS = createRemoteJWKSet(
  new URL(`${env.clientOrigin}/api/auth/jwks`),
);

export async function verifyJWT(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: env.clientOrigin,
    });

    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
}

export function requireRole(...roles: Array<"tenant" | "owner" | "admin">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    next();
  };
}
