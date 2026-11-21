import { Router, Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, siteSettingsTable, usersTable } from "@workspace/db";
import jwt from "jsonwebtoken";

const router = Router();

async function isAdminAuthenticated(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const userIdHeader = (req.headers["x-user-id"] as string) ?? "";

    let userId: string | null = null;

    if (token) {
      try {
        const secret = process.env.JWT_SECRET || "secret";
        const decoded: any = jwt.verify(token, secret);
        userId = decoded.userId || decoded.id || decoded.sub;
      } catch {
        // token verification failed, try fallback
      }
    }

    if (!userId && userIdHeader) {
      userId = userIdHeader.trim();
    }

    if (!userId) {
      res.status(401).json({ error: "No token or admin user ID provided" });
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
    const key = req.params.key as string;
    const [row] = await db
      .select()
      .from(siteSettingsTable)
      .where(eq(siteSettingsTable.key, key))
      .limit(1);
    if (!row) {
      const defaults: Record<string, string> = {
        display_mode: "full_website",
        whatsapp_number: "+201015473623",
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
    const key = req.params.key as string;
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

// Bulk update site settings (both admin-prefixed and root-level)
router.put("/admin/site-settings", isAdminAuthenticated, async (req, res): Promise<any> => {
  try {
    const body = req.body as any;
    const settings = body.settings || body;
    if (!settings || typeof settings !== "object") {
      return res.status(400).json({ error: "settings must be an object of key-value pairs" });
    }

    const updatedKeys: string[] = [];
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === "string" || typeof value === "number") {
        const valStr = String(value);
        await db
          .insert(siteSettingsTable)
          .values({ key, value: valStr, updatedAt: new Date() })
          .onConflictDoUpdate({
            target: siteSettingsTable.key,
            set: { value: valStr, updatedAt: new Date() },
          });
        updatedKeys.push(key);
      }
    }

    res.json({ success: true, updated: updatedKeys });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update settings" });
  }
});

router.put("/site-settings", isAdminAuthenticated, async (req, res): Promise<any> => {
  try {
    const body = req.body as any;
    const settings = body.settings || body;
    if (!settings || typeof settings !== "object") {
      return res.status(400).json({ error: "settings must be an object of key-value pairs" });
    }

    const updatedKeys: string[] = [];
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === "string" || typeof value === "number") {
        const valStr = String(value);
        await db
          .insert(siteSettingsTable)
          .values({ key, value: valStr, updatedAt: new Date() })
          .onConflictDoUpdate({
            target: siteSettingsTable.key,
            set: { value: valStr, updatedAt: new Date() },
          });
        updatedKeys.push(key);
      }
    }

    res.json({ success: true, updated: updatedKeys });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update settings" });
  }
});

export default router;
