import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "./jwt";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  token?: string;
}

/**
 * Middleware to verify JWT tokens in Authorization header.
 * If token is invalid or missing, passes control to next middleware.
 * Sets userId on request if token is valid.
 */
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return next();
  }

  const token = parts[1];
  const payload = verifyAccessToken(token);

  if (payload && payload.sub) {
    req.userId = payload.sub;
    req.token = token;
  }

  next();
}

/**
 * Middleware to require authentication.
 * Returns 401 if no valid token is present.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
