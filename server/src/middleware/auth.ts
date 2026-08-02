import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import { ACCESS_COOKIE } from "../lib/authCookies.js";
import { AppError } from "../lib/errors.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: "MUSICIAN" | "RECRUITER" | "ADMIN" | "TOURIST" | "ORGANIZER" | "FESTIVAL";
    }
  }
}

// Accepte le jeton depuis le cookie httpOnly (web) OU l'en-tête
// Authorization: Bearer <token> (app mobile qui n'a pas de cookie jar).
function extractAccessToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  return req.cookies?.[ACCESS_COOKIE];
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractAccessToken(req);
  if (!token) {
    return next(new AppError(401, "not_authenticated", "Connexion requise."));
  }

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    next(new AppError(401, "not_authenticated", "Session expirée."));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.userRole !== "ADMIN") {
    return next(new AppError(403, "forbidden", "Réservé aux administrateurs."));
  }
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractAccessToken(req);
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      req.userId = payload.sub;
      req.userRole = payload.role;
    } catch {
      // ignore invalid/expired token, treat as anonymous
    }
  }
  next();
}
