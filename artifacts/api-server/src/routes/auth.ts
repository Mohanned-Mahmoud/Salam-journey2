import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
// تم استيراد coachesTable هنا لربط وحفظ توكن الكوتش
import { db, usersTable, insertUserSchema, type User, coachesTable } from "@workspace/db";
import admin from "firebase-admin";
import { createAccessToken } from "../lib/jwt";
import path from "path";
import fs from "fs";
import { google } from "googleapis"; // استيراد مكتبة جوجل

let firebaseInitialized = false;
function tryInitFirebase() {
  if (firebaseInitialized) return;

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (serviceAccountPath) {
    try {
      if (!fs.existsSync(serviceAccountPath)) {
        console.error(`FIREBASE_SERVICE_ACCOUNT_PATH not found: ${serviceAccountPath}`);
      } else {
        const data = fs.readFileSync(serviceAccountPath, "utf-8");
        const parsed = JSON.parse(data);
        admin.initializeApp({ credential: admin.credential.cert(parsed as any) });
        firebaseInitialized = true;
        console.log(`Firebase initialized from FIREBASE_SERVICE_ACCOUNT_PATH: ${serviceAccountPath}`);
        return;
      }
    } catch (err) {
      console.error("Failed to initialize Firebase from FIREBASE_SERVICE_ACCOUNT_PATH:", err);
    }
  }

  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (key) {
    try {
      const parsed = JSON.parse(key);
      admin.initializeApp({ credential: admin.credential.cert(parsed as any) });
      firebaseInitialized = true;
      console.log("Firebase initialized from FIREBASE_SERVICE_ACCOUNT_KEY");
      return;
    } catch (err) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", err);
    }
  }

  const serviceAccountFiles = [
    "salam-jourey-firebase-adminsdk-fbsvc-2a397888cd.json",
    "firebase-adminsdk.json",
  ];

  const candidateDirs = [
    process.env.INIT_CWD,
    process.cwd(),
    path.resolve(process.cwd(), ".."),
    path.resolve(process.cwd(), "..", ".."),
  ].filter((value): value is string => Boolean(value));

  for (const dir of candidateDirs) {
    for (const filename of serviceAccountFiles) {
      const filePath = path.resolve(dir, filename);
      if (!fs.existsSync(filePath)) continue;

      try {
        const data = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(data);
        admin.initializeApp({ credential: admin.credential.cert(parsed as any) });
        firebaseInitialized = true;
        console.log(`Firebase initialized from ${filePath}`);
        return;
      } catch (err) {
        console.error(`Failed to load Firebase from ${filePath}:`, err);
      }
    }
  }

  const apiServerPath = path.resolve(process.cwd(), "firebase-adminsdk.json");
  if (fs.existsSync(apiServerPath)) {
    try {
      const data = fs.readFileSync(apiServerPath, "utf-8");
      const parsed = JSON.parse(data);
      admin.initializeApp({ credential: admin.credential.cert(parsed as any) });
      firebaseInitialized = true;
      console.log("Firebase initialized from artifacts/api-server/firebase-adminsdk.json");
      return;
    } catch (err) {
      console.error("Failed to load Firebase from artifacts/api-server:", err);
    }
  }

  console.warn(
    "Firebase Admin SDK not initialized. Fallback to Google tokeninfo verification will be used."
  );
}

// دالة مساعدة لتهيئة عميل الـ OAuth2 الخاص بجوجل كاليندر
function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI // مثال: http://localhost:5000/api/auth/google/calendar-callback
  );
}

const router: IRouter = Router();

function sanitizeUser(user: User) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

/* ──────────────────────────────────────────────────────────── */
/* طرق ربط تقويم جوجل الجديدة المخصصة للآدمن (الكوتش)         */
/* ──────────────────────────────────────────────────────────── */

// 1. إنشاء رابط طلب الصلاحيات للمدرّبة
router.get("/auth/google/calendar-url", (req, res) => {
  try {
    const oauth2Client = getOAuth2Client();
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline", // إجباري للحصول على المفتاح الدائم الـ refresh_token
      prompt: "consent",      // إجباري لإظهار شاشة الموافقة دائماً لتحديث التوكن بأمان
      scope: ["https://www.googleapis.com/auth/calendar.events"],
    });
    return res.json({ url });
  } catch (error) {
    return res.status(500).json({ error: "Failed to generate auth URL" });
  }
});

// 2. استقبال رد جوجل وتبديل الكود بالمفتاح السحري الدائم وحفظه
router.get("/auth/google/calendar-callback", async (req, res) => {
  try {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    if (!code) {
      return res.status(400).send("Missing authorization code");
    }

    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (tokens.refresh_token) {
      // جلب أول كوتش مسجل (المدرّبة إيمان) لتحديث بياناتها
      const coaches = await db.select().from(coachesTable).limit(1);
      
      if (coaches.length > 0) {
        await db
          .update(coachesTable)
          .set({
            googleRefreshToken: tokens.refresh_token,
          } as any)
          .where(eq(coachesTable.id, coaches[0].id));
        console.log("✅ تم حفظ مفتاح تقويم جوجل الدائم للكوتش بنجاح في قاعدة البيانات.");
      }
    }

    // إعادة توجيه الآدمن تلقائياً لصفحة الإعدادات في الـ Frontend بعد نجاح الربط
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(`${frontendUrl}/admin/settings?calendar=success`);
  } catch (error) {
    console.error("فشل تبديل كود الصلاحية من جوجل:", error);
    return res.status(500).send("Google Calendar Authentication Failed");
  }
});

/* ──────────────────────────────────────────────────────────── */
/* الطرق الأساسية القديمة (بدون أي تعديل لتجنب كسر السيستم)    */
/* ──────────────────────────────────────────────────────────── */

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

router.post("/auth/firebase", async (req, res) => {
  try {
    const idToken = typeof req.body?.idToken === "string" ? req.body.idToken : "";
    
    if (!idToken) {
      return res.status(400).json({ error: "Missing idToken" });
    }

    tryInitFirebase();

    if (!firebaseInitialized) {
      return res.status(500).json({ error: "Firebase Admin not configured" });
    }

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error("Firebase token verification failed:", error);
      return res.status(401).json({ error: "Invalid Firebase token" });
    }

    const email = decodedToken.email?.trim().toLowerCase();
    const picture = decodedToken.picture || null;

    if (!email) {
      return res.status(400).json({ error: "Firebase token missing email" });
    }

    const existingUsers = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    let user = existingUsers[0];

    if (!user) {
      const baseUsername = email.split("@")[0];
      let username = baseUsername;

      while (true) {
        const taken = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.name, username))
          .limit(1);
        
        if (!taken.length) {
          break;
        }
        
        username = `${baseUsername}${Math.floor(Math.random() * 10000)}`;
      }

      const insertedUsers = await db
        .insert(usersTable)
        .values({
          name: username,
          email: email,
          phone: null,
          passwordHash: null,
        })
        .returning();

      user = insertedUsers[0];
    }

    const accessToken = createAccessToken({ sub: user.id });

    return res.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 7 * 24 * 60 * 60,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Firebase auth error:", error);
    return res.status(500).json({ error: "Firebase authentication failed" });
  }
});

export default router;