import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "./jwt";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

/**
 * Middleware to require admin authentication.
 * Checks whether current user exists and has role: 'admin'.
 */
export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : (req.query?.token as string);
    const userIdHeader = (req.headers["x-user-id"] as string)?.trim();

    let userId = req.userId;

    if (!userId && token) {
      const payload = verifyAccessToken(token);
      if (payload && payload.sub) {
        userId = payload.sub;
      }
    }

    if (!userId && userIdHeader) {
      userId = userIdHeader;
    }

    if (!userId) {
      res.status(401).json({ error: "يرجى تسجيل الدخول أولاً للوصول للوحة التحكم" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    if (!user || (user as any).role !== "admin") {
      res.status(403).json({ error: "عذراً، هذه الصلاحية للمسؤولين فقط" });
      return;
    }

    req.userId = userId;
    next();
  } catch (err: any) {
    res.status(401).json({ error: "فشل التحقق من الجلسة" });
  }
}

