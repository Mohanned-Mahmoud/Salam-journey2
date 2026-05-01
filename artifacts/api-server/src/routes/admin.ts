import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq, gt } from "drizzle-orm";
import { db } from "@workspace/db";
import { adminsTable, adminSessionsTable } from "@workspace/db";

const router = Router();

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

router.post("/admin/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [admin] = await db
    .select()
    .from(adminsTable)
    .where(eq(adminsTable.email, email.toLowerCase().trim()))
    .limit(1);

  if (!admin) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(adminSessionsTable).values({
    token,
    adminId: admin.id,
    expiresAt,
  });

  res.json({ token, email: admin.email });
});

router.get("/admin/verify", async (req, res) => {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const now = new Date();

  const [session] = await db
    .select()
    .from(adminSessionsTable)
    .where(eq(adminSessionsTable.token, token))
    .limit(1);

  if (!session || session.expiresAt < now) {
    res.status(401).json({ error: "Invalid or expired session" });
    return;
  }

  const [admin] = await db
    .select()
    .from(adminsTable)
    .where(eq(adminsTable.id, session.adminId))
    .limit(1);

  if (!admin) {
    res.status(401).json({ error: "Admin not found" });
    return;
  }

  res.json({ email: admin.email });
});

router.post("/admin/logout", async (req, res) => {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (token) {
    await db
      .delete(adminSessionsTable)
      .where(eq(adminSessionsTable.token, token));
  }

  res.json({ ok: true });
});

export default router;
