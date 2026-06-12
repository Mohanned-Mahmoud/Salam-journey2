import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq, gt } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  adminsTable,
  adminSessionsTable,
  bookingsTable,
  coursesTable,
  enrollmentsTable,
  usersTable,
} from "@workspace/db";

const router = Router();

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

type AdminBookingSummary = {
  id: string;
  date: string;
  slot: string | null;
  sessionType: string | null;
  bookingKind: string;
  packageSessionsTotal: number | null;
  packageSessionsRemaining: number | null;
  topic: string | null;
  notes: string | null;
  name: string | null;
  email: string | null;
  whatsapp: string | null;
  status: string | null;
  createdAt: string;
};

type AdminUserSummary = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  bookings: AdminBookingSummary[];
  enrolledCourses: { id: string; title: string; enrolledAt: string; progress: number }[];
};

function asIsoString(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

router.post("/admin/login", async (req, res) => {
  try {
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
  } catch {
    res.status(503).json({ error: "Admin database is unavailable" });
  }
});

router.get("/admin/users", async (_req, res) => {
  try {
    const [users, bookings, enrollments, courses] = await Promise.all([
      db.select().from(usersTable),
      db.select().from(bookingsTable),
      db.select().from(enrollmentsTable),
      db.select().from(coursesTable),
    ]);

    const typedBookings = bookings as unknown as Array<{
      id: string;
      userId: string | null;
      date: string;
      slot: string | null;
      sessionType: string | null;
      bookingKind: string;
      packageSessionsTotal: number | null;
      packageSessionsRemaining: number | null;
      topic: string | null;
      notes: string | null;
      guestName: string | null;
      guestEmail: string | null;
      guestWhatsapp: string | null;
      status: string | null;
      createdAt: string | Date;
    }>;

    const courseTitleById = new Map(courses.map((course) => [course.id, course.titleAr || course.titleEn]));
    const bookingsByUser = new Map<string, AdminBookingSummary[]>();
    for (const booking of typedBookings) {
      if (!booking.userId) continue;
      const next = bookingsByUser.get(booking.userId) ?? [];
      next.push({
        id: booking.id,
        date: booking.date,
        slot: booking.slot,
        sessionType: booking.sessionType,
        bookingKind: booking.bookingKind,
        packageSessionsTotal: booking.packageSessionsTotal,
        packageSessionsRemaining: booking.packageSessionsRemaining,
        topic: booking.topic,
        notes: booking.notes,
        name: booking.guestName,
        email: booking.guestEmail,
        whatsapp: booking.guestWhatsapp,
        status: booking.status,
        createdAt: asIsoString(booking.createdAt),
      });
      bookingsByUser.set(booking.userId, next);
    }

    const enrollmentsByUser = new Map<string, AdminUserSummary["enrolledCourses"]>();
    for (const enrollment of enrollments as Array<{
      userId: string;
      courseId: string;
      enrolledAt: string | Date;
      progress: number | null;
    }>) {
      const next = enrollmentsByUser.get(enrollment.userId) ?? [];
      next.push({
        id: enrollment.courseId,
        title: courseTitleById.get(enrollment.courseId) ?? enrollment.courseId,
        enrolledAt: asIsoString(enrollment.enrolledAt),
        progress: enrollment.progress ?? 0,
      });
      enrollmentsByUser.set(enrollment.userId, next);
    }

    const payload: AdminUserSummary[] = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: asIsoString(user.createdAt),
      bookings: bookingsByUser.get(user.id) ?? [],
      enrolledCourses: enrollmentsByUser.get(user.id) ?? [],
    }));

    res.json(payload);
  } catch {
    res.status(503).json({ error: "Admin database is unavailable" });
  }
});

router.get("/admin/verify", async (req, res) => {
  try {
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
  } catch {
    res.status(503).json({ error: "Admin database is unavailable" });
  }
});

router.post("/admin/logout", async (req, res) => {
  try {
    const auth = req.headers.authorization ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

    if (token) {
      await db
        .delete(adminSessionsTable)
        .where(eq(adminSessionsTable.token, token));
    }

    res.json({ ok: true });
  } catch {
    res.status(503).json({ error: "Admin database is unavailable" });
  }
});

export default router;
