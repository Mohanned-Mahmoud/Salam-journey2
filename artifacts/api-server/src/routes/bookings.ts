import { Router, type IRouter } from "express";
import { db, bookingsTable, coachesTable, insertBookingSchema } from "@workspace/db";
import { eq } from "drizzle-orm";
import { google } from "googleapis"; // تثبيت المكتبة مطلوب: pnpm add googleapis
import { mapBookingToFrontend, mapBookingsToFrontend } from "../utils/booking-mapper"; // 🌟 mapping helper


const router: IRouter = Router();

// دالة مساعدة لإنشاء الحدث داخل تقويم جوجل
async function createGoogleCalendarEvent(bookingData: any, adminRefreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: adminRefreshToken,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  // دمج التاريخ والساعة لبداية ونهاية الجلسة (جلسة مدتها ساعة تلقائياً)
  const slotTime = bookingData.slot || "10:00";
  const startDateTime = `${bookingData.date}T${slotTime}:00`;
  
  const [hours, minutes] = slotTime.split(":");
  const endHours = String(Number(hours) + 1).padStart(2, "0");
  const endDateTime = `${bookingData.date}T${endHours}:${minutes}:00`;

  const event = {
    summary: `رحلة سلام - ${bookingData.sessionType || "جلسة خاصة"}`,
    description: `اسم الأم: ${bookingData.guestName || "غير محدد"}\nموضوع الجلسة: ${bookingData.topic || "غير محدد"}\nرقم الواتساب: ${bookingData.guestWhatsapp || "غير محدد"}\nملاحظات إضافية: ${bookingData.notes || "لا يوجد"}`,
    start: {
      dateTime: startDateTime,
      timeZone: "Asia/Riyadh", // التوقيت الافتراضي للحساب
    },
    end: {
      dateTime: endDateTime,
      timeZone: "Asia/Riyadh",
    },
    // إرسال دعوة مباشرة لإيميل الأم المدخل في الـ Form
    attendees: bookingData.guestEmail ? [{ email: bookingData.guestEmail }] : [],
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 }, // تذكير بالإيميل قبلها بـ 24 ساعة
        { method: "popup", minutes: 30 },      // تذكير على الموبايل قبلها بـ 30 دقيقة
      ],
    },
  };

  try {
    await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
      sendUpdates: "all", // تفعيل إرسال الإيميلات للمدعوين تلقائياً
    });
  } catch (error) {
    console.error("Google Calendar Event Creation Failed:", error);
  }
}

// Get all bookings
router.get("/bookings", async (req, res) => {
  try {
    const bookings = await db.select().from(bookingsTable);
    res.json(mapBookingsToFrontend(bookings));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// Get bookings by user
router.get("/bookings/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId as string;
    const bookings = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.userId, userId));

    res.json(mapBookingsToFrontend(bookings));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// Get booking by ID
router.get("/bookings/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const booking = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, id))
      .limit(1);

    if (!booking.length) {
      return res.status(404).json({ error: "Booking not found" });
    }
    return res.json(mapBookingToFrontend(booking[0]));
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch booking" });
  }
});

// Create booking
router.post("/bookings", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const bookingKind = body.bookingKind === "package" ? "package" : "single";
    const packageSessionsTotal = typeof body.packageSessionsTotal === "number" && body.packageSessionsTotal > 0
      ? Math.floor(body.packageSessionsTotal)
      : bookingKind === "package"
        ? 3
        : null;
    const packageSessionsRemaining = typeof body.packageSessionsRemaining === "number" && body.packageSessionsRemaining >= 0
      ? Math.floor(body.packageSessionsRemaining)
      : packageSessionsTotal;
    const status: "confirmed" | "pending" | "cancelled" | undefined =
      body.status === "confirmed" || body.status === "pending" || body.status === "cancelled"
        ? body.status
        : undefined;

    const parsed = {
      userId: typeof body.userId === "string" && body.userId.trim() ? body.userId.trim() : null,
      bookingKind,
      date: typeof body.date === "string" ? body.date : "",
      slot: typeof body.slot === "string" ? body.slot : null,
      sessionType: typeof body.sessionType === "string" ? body.sessionType : null,
      packageSessionsTotal,
      packageSessionsRemaining,
      topic: typeof body.topic === "string" ? body.topic : null,
      notes: typeof body.notes === "string" ? body.notes : null,
      guestName: typeof body.guestName === "string" ? body.guestName : null,
      guestEmail: typeof body.guestEmail === "string" ? body.guestEmail : null,
      guestWhatsapp: typeof body.guestWhatsapp === "string" ? body.guestWhatsapp : null,
      status,
    };

    if (!parsed.date) {
      return res.status(400).json({ error: "date is required" });
    }
    
    // جلب بيانات الكوتش أو إنشائه الافتراضي
    let coachId = typeof req.body?.coachId === "string" && req.body.coachId.trim()
      ? req.body.coachId.trim()
      : (await db.select({ id: coachesTable.id }).from(coachesTable).limit(1))[0]?.id;

    if (!coachId) {
      const insertedCoach = await db
        .insert(coachesTable)
        .values({
          name: "Coach Iman",
          email: "coach.iman@salamjourney.local",
          bio: "Default coach created automatically for bookings.",
        })
        .returning({ id: coachesTable.id });

      coachId = insertedCoach[0]?.id;
    }

    if (!coachId) {
      return res.status(400).json({ error: "No coach available" });
    }

    // حفظ الحجز في قاعدة البيانات الأساسية للمشروع
    const insertedBookings = await db
      .insert(bookingsTable)
      .values({
        coachId,
        userId: parsed.userId ?? null,
        bookingKind: parsed.bookingKind,
        date: parsed.date,
        slot: parsed.slot,
        sessionType: parsed.sessionType,
        packageSessionsTotal: parsed.packageSessionsTotal,
        packageSessionsRemaining: parsed.packageSessionsRemaining,
        topic: parsed.topic,
        notes: parsed.notes,
        guestName: parsed.guestName,
        guestEmail: parsed.guestEmail,
        guestWhatsapp: parsed.guestWhatsapp,
        status: parsed.status,
      } as any)
      .returning();

    const currentBooking = insertedBookings[0];

    // جلب الـ Refresh Token المخزن للكوتش لتحديث التقويم
    const coachRecord = (await db.select().from(coachesTable).where(eq(coachesTable.id, coachId)).limit(1))[0];
    const coachRefreshToken = (coachRecord as any)?.googleRefreshToken || process.env.COACH_GOOGLE_REFRESH_TOKEN;

    if (coachRefreshToken && currentBooking) {
      // استدعاء الأتمتة في الخلفية بشكل آمن دون تعطيل الـ Response للعميل
      createGoogleCalendarEvent(currentBooking, coachRefreshToken).catch(err =>
        console.error("Background Calendar Error:", err)
      );
    }

    return res.status(201).json(mapBookingToFrontend(currentBooking));
  } catch (error) {
    return res.status(400).json({ error: "Invalid booking data" });
  }
});

// Update booking
router.put("/bookings/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const validated = insertBookingSchema.partial().parse(req.body);
    const booking = await db
      .update(bookingsTable)
      .set(validated)
      .where(eq(bookingsTable.id, id))
      .returning();

    if (!booking.length) {
      return res.status(404).json({ error: "Booking not found" });
    }
    return res.json(mapBookingToFrontend(booking[0]));
  } catch (error) {
    return res.status(400).json({ error: "Invalid booking data" });
  }
});

// Delete booking
router.delete("/bookings/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const booking = await db
      .delete(bookingsTable)
      .where(eq(bookingsTable.id, id))
      .returning();

    if (!booking.length) {
      return res.status(404).json({ error: "Booking not found" });
    }
    return res.json({ message: "Booking deleted" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete booking" });
  }
});

export default router;