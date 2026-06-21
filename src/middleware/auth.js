import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../config/env.js";

const JWKS = createRemoteJWKSet(
  new URL(`${env.clientOrigin}/api/auth/jwks`),
);

export async function verifyJWT(req, res, next) {
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

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    next();
  };
}
