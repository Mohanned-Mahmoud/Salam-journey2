import { Router, Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  bookingsTable,
  coursesTable,
  enrollmentsTable,
  usersTable,
} from "@workspace/db";
import jwt from "jsonwebtoken";
import { mapBookingToFrontend, mapBookingsToFrontend, asIsoString } from "../utils/booking-mapper";

const router = Router();

type AdminUserSummary = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  bookings: any[];
  enrolledCourses: { id: string; title: string; enrolledAt: string; progress: number }[];
};

// 🛡️ الميدل وير الموحد الجديد: بيفحص التوكن الحي ويشيك على رتبة الأدمن من جدول الـ usersTable
// 🛡️ الميدل وير الموحد بعد تزويده بكشافات إضاءة للـ Debugging الحتمي
async function isAdminAuthenticated(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization ?? "";
    
    console.log("\n=== 🛡️ [DEBUG AUTH] جاري فحص صلاحيات مسار الآدمن ===");
    console.log("الـ Authorization Header القادم من الفرونت:", auth);

    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

    if (!token) {
      console.log("❌ الرفض: لم يتم إرسال توكن نهائياً من الفرونت إند (Token is missing)");
      res.status(401).json({ error: "No token provided. يرجى تسجيل الدخول أولاً" });
      return;
    }

    // فحص فك التوكن والـ Secret Key المكتوم
    let decoded: any;
    try {
      const secret = process.env.JWT_SECRET || "secret";
      decoded = jwt.verify(token, secret);
      console.log("✅ نجاح فك التوكن بنجاح! الـ Payload الناتج هو:", decoded);
    } catch (jwtError: any) {
      console.log("❌ فشل jwt.verify والسبب الصريح:", jwtError.message);
      console.log("الـ Secret Key المستخدم حالياً في السيرفر:", process.env.JWT_SECRET ? "قادم من الـ .env سليم" : "مش قاري الـ .env وبيستخدم الـ fallback 'secret'");
      res.status(401).json({ error: "Unauthorized. التوكن غير صالح أو منتهي" });
      return;
    }

    const userId = decoded.userId || decoded.id || decoded.sub; // 🌟 ضفنا || decoded.sub عشان يلقط الـ ID من توكن جوجل الموحد

    if (!userId) {
      console.log("❌ الرفض: التوكن سليم بس مفيش جواه userId أو id");
      res.status(401).json({ error: "Invalid token payload. توكن غير صالح" });
      return;
    }

    // 2. التحقق المباشر من الداتابيز
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      console.log("❌ الرفض: التوكن سليم والـ ID فك، بس المستخدم ده ملوش وجود في الـ usersTable!");
      res.status(403).json({ error: "Forbidden. المستخدم غير موجود" });
      return;
    }

    if ((user as any).role !== "admin") {
      console.log(`❌ الرفض: الشخص ده مستخدم عادي برتبة "${(user as any).role}" وليس admin`);
      res.status(403).json({ error: "Forbidden. عذراً، لا تمتلك صلاحيات آدمن لدخول هذه الصفحة" });
      return;
    }

    console.log("🎯 [AUTH SUCCESS] الحساب آدمن وسليم ١٠٠٪، مرر الطلب للـ Database!");
    next();
  } catch (globalError: any) {
    console.log("💥 خطأ غير متوقع تماماً في الميدل وير:", globalError.message);
    res.status(401).json({ error: "Unauthorized. الجلسة منتهية أو التوكن غير صالح" });
  }
}

// -------------------------------------------------------------
// 🔒 الرابط الرئيسي: جلب بيانات الأمهات والحجوزات مأمن بالكامل بالميدل وير الموحد
// -------------------------------------------------------------
router.get("/admin/users", isAdminAuthenticated, async (_req, res) => {
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
    const bookingsByUser = new Map<string, any[]>();
    for (const booking of typedBookings) {
      if (!booking.userId) continue;
      const next = bookingsByUser.get(booking.userId) ?? [];
      next.push(mapBookingToFrontend(booking));
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

export default router;