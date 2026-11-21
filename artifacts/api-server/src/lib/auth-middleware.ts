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
  const tokenQuery = req.query.token as string | undefined;

  let tokenToVerify: string | undefined;

  if (authHeader) {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
      tokenToVerify = parts[1];
    }
  } else if (tokenQuery && typeof tokenQuery === "string") {
    tokenToVerify = tokenQuery;
  }

  if (tokenToVerify) {
    const payload = verifyAccessToken(tokenToVerify);
    if (payload && payload.sub) {
      req.userId = payload.sub;
      req.token = tokenToVerify;
    }
  }

  // Fallback to X-User-Id header if token not provided or invalid
  if (!req.userId && req.headers["x-user-id"] && typeof req.headers["x-user-id"] === "string") {
    req.userId = req.headers["x-user-id"].trim();
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
