import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable, insertUserSchema, type User } from "@workspace/db";
import admin from "firebase-admin";

let firebaseInitialized = false;
function tryInitFirebase() {
  if (firebaseInitialized) return;
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!key) return;
  try {
    const parsed = JSON.parse(key);
    admin.initializeApp({ credential: admin.credential.cert(parsed as any) });
    firebaseInitialized = true;
  } catch (err) {
    // ignore initialization errors; fallback to Google tokeninfo
    console.error("Failed to initialize Firebase Admin:", err);
  }
}

const router: IRouter = Router();

function sanitizeUser(user: User) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

router.post("/auth/login", async (req, res) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user.length) {
      return res.status(404).json({ error: "not_found" });
    }

    const record = user[0];
    const stored = record.passwordHash ?? "";
    const matches = stored.startsWith("$") ? await bcrypt.compare(password, stored) : stored === password;

    if (!matches) {
      return res.status(401).json({ error: "wrong_password" });
    }

    return res.json({ user: sanitizeUser(record) });
  } catch (error) {
    return res.status(500).json({ error: "Failed to login" });
  }
});

router.post("/auth/change-password", async (req, res) => {
  try {
    const userId = typeof req.body?.userId === "string" ? req.body.userId : "";
    const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
    const nextPassword = typeof req.body?.nextPassword === "string" ? req.body.nextPassword : "";

    if (!userId || !currentPassword || !nextPassword) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const current = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!current.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const record = current[0];
    const stored = record.passwordHash ?? "";
    const matches = stored.startsWith("$") ? await bcrypt.compare(currentPassword, stored) : stored === currentPassword;

    if (!matches) {
      return res.status(401).json({ error: "wrong_password" });
    }

    const hashedPassword = await bcrypt.hash(nextPassword, 10);
    const updated = await db
      .update(usersTable)
      .set({ passwordHash: hashedPassword })
      .where(eq(usersTable.id, userId))
      .returning();

    return res.json({ user: sanitizeUser(updated[0]) });
  } catch (error) {
    return res.status(500).json({ error: "Failed to change password" });
  }
});

router.post("/auth/google", async (req, res) => {
  try {
    const credential = typeof req.body?.credential === "string" ? req.body.credential : "";
    if (!credential) {
      return res.status(400).json({ error: "Invalid Google credential" });
    }

    // Prefer Firebase Admin verification when service account key is provided
    tryInitFirebase();
    let email: string | undefined;
    let name: string | undefined;
    let emailVerified = false;

    if (firebaseInitialized) {
      try {
        const decoded = await admin.auth().verifyIdToken(credential);
        email = decoded.email;
        name = decoded.name ?? undefined;
        emailVerified = !!decoded.email_verified;
      } catch (err) {
        console.error("Firebase token verification failed:", err);
        return res.status(401).json({ error: "Invalid Google token" });
      }
    } else {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        return res.status(500).json({ error: "GOOGLE_CLIENT_ID is not configured" });
      }

      const tokenInfoResponse = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
      );

      if (!tokenInfoResponse.ok) {
        return res.status(401).json({ error: "Invalid Google token" });
      }

      const tokenInfo = await tokenInfoResponse.json() as {
        aud?: string;
        email?: string;
        email_verified?: string;
        name?: string;
        picture?: string;
        sub?: string;
      };

      if (tokenInfo.aud !== clientId || tokenInfo.email_verified !== "true" || !tokenInfo.email) {
        return res.status(401).json({ error: "Invalid Google token" });
      }

      email = tokenInfo.email;
      name = tokenInfo.name;
      emailVerified = tokenInfo.email_verified === "true";
    }

    if (!email || !emailVerified) {
      return res.status(401).json({ error: "Invalid Google token" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, normalizedEmail))
      .limit(1);

    let user = existing[0];
    if (!user) {
      const inserted = await db
        .insert(usersTable)
        .values({
          name: (name?.trim() || normalizedEmail.split("@")[0] || "Google User"),
          email: normalizedEmail,
          phone: null,
          passwordHash: null,
        })
        .returning();
      user = inserted[0];
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ error: "Failed to authenticate with Google" });
  }
});

export default router;