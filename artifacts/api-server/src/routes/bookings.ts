import { Router, type IRouter } from "express";
import { db, bookingsTable, coachesTable, insertBookingSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// Get all bookings
router.get("/bookings", async (req, res) => {
  try {
    const bookings = await db.select().from(bookingsTable);
    res.json(bookings);
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

    res.json(bookings);
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
    return res.json(booking[0]);
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

    const booking = await db
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

    return res.status(201).json(booking[0]);
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
    return res.json(booking[0]);
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
