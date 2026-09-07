/**
 * Cal.com Webhook handler
 * Receives BOOKING_CANCELLED and BOOKING_RESCHEDULED events from Cal.com
 * and keeps our local DB in sync.
 *
 * Setup:
 *   Cal.com → Settings → Developer → Webhooks → Add Webhook
 *   URL: https://[your-domain]/api/cal-webhook
 *   Events: BOOKING_CREATED, BOOKING_CANCELLED, BOOKING_RESCHEDULED
 *   Secret: set as CAL_WEBHOOK_SECRET in .env
 */

import { createHmac } from "crypto";
import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { bookingsTable, db } from "@workspace/db";

const router: IRouter = Router();

function verifySignature(
  rawBody: string,
  signature: string | undefined,
  secret: string,
): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  // Cal.com sends "sha256=<hex>"
  const provided = signature.startsWith("sha256=")
    ? signature.slice(7)
    : signature;
  return expected === provided;
}

router.post(
  "/cal-webhook",
  // We need raw body for signature verification
  (req, res, next) => next(),
  async (req, res): Promise<void> => {
    const secret = process.env.CAL_WEBHOOK_SECRET;

    // Verify webhook signature if a secret is configured
    if (secret) {
      const rawBody =
        typeof req.body === "string"
          ? req.body
          : JSON.stringify(req.body);
      const signature = req.headers["x-cal-signature-256"] as string | undefined;

      if (!verifySignature(rawBody, signature, secret)) {
        res.status(401).json({ error: "Invalid webhook signature." });
        return;
      }
    }

    const payload = req.body as Record<string, any>;
    const triggerEvent: string = payload?.triggerEvent ?? "";
    const calBookingUid: string =
      payload?.payload?.uid ?? payload?.uid ?? "";

    req.log?.info({ triggerEvent, calBookingUid }, "Cal.com webhook received");

    if (!calBookingUid) {
      res.status(200).json({ ok: true, skipped: "no uid" });
      return;
    }

    try {
      if (triggerEvent === "BOOKING_CANCELLED") {
        await db
          .update(bookingsTable)
          .set({ status: "cancelled" })
          .where(eq(bookingsTable.calBookingId, calBookingUid));

        req.log?.info({ calBookingUid }, "Booking cancelled via Cal.com webhook");
      } else if (triggerEvent === "BOOKING_RESCHEDULED") {
        // Cal.com sends new start time in payload.payload.startTime (ISO string)
        const startTime: string = payload?.payload?.startTime ?? "";
        if (startTime) {
          const dt = new Date(startTime);
          const newDate = dt.toISOString().slice(0, 10); // YYYY-MM-DD
          const newTime = `${String(dt.getUTCHours()).padStart(2, "0")}:${String(dt.getUTCMinutes()).padStart(2, "0")}`;

          await db
            .update(bookingsTable)
            .set({ date: newDate, slot: newTime })
            .where(eq(bookingsTable.calBookingId, calBookingUid));

          req.log?.info({ calBookingUid, newDate, newTime }, "Booking rescheduled via Cal.com webhook");
        }
      }
      // BOOKING_CREATED — no action needed (we create local booking ourselves)
    } catch (err) {
      req.log?.error({ err }, "Cal.com webhook DB update failed");
      res.status(500).json({ error: "Internal error processing webhook." });
      return;
    }

    res.status(200).json({ ok: true });
  },
);

export default router;
