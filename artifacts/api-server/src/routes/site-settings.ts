import { Router, Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, siteSettingsTable, usersTable } from "@workspace/db";
import jwt from "jsonwebtoken";

const router = Router();

async function isAdminAuthenticated(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) {
      res.status(401).json({ error: "No token provided" });
      return;
    }
    let decoded: any;
    try {
      const secret = process.env.JWT_SECRET || "secret";
      decoded = jwt.verify(token, secret);
    } catch {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }
    const userId = decoded.userId || decoded.id || decoded.sub;
    if (!userId) {
      res.status(401).json({ error: "Invalid token payload" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user || (user as any).role !== "admin") {
      res.status(403).json({ error: "Forbidden: admin only" });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

router.get("/site-settings/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const [row] = await db
      .select()
      .from(siteSettingsTable)
      .where(eq(siteSettingsTable.key, key))
      .limit(1);
    if (!row) {
      const defaults: Record<string, string> = {
        display_mode: "full_website",
      };
      res.json({ key, value: defaults[key] ?? "" });
      return;
    }
    res.json({ key: row.key, value: row.value });
  } catch {
    res.status(503).json({ error: "Failed to fetch setting" });
  }
});

router.put("/admin/site-settings/:key", isAdminAuthenticated, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body as { value: string };
    if (typeof value !== "string") {
      res.status(400).json({ error: "value must be a string" });
      return;
    }
    const existing = await db
      .select()
      .from(siteSettingsTable)
      .where(eq(siteSettingsTable.key, key))
      .limit(1);
    if (existing.length === 0) {
      const [created] = await db
        .insert(siteSettingsTable)
        .values({ key, value, updatedAt: new Date() })
        .returning();
      res.json({ key: created.key, value: created.value });
    } else {
      const [updated] = await db
        .update(siteSettingsTable)
        .set({ value, updatedAt: new Date() })
        .where(eq(siteSettingsTable.key, key))
        .returning();
      res.json({ key: updated.key, value: updated.value });
    }
  } catch {
    res.status(503).json({ error: "Failed to save setting" });
  }
});

export default router;
