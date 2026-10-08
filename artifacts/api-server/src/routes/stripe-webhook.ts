import { Router } from "express";
import Stripe from "stripe";
import { logger } from "../lib/logger";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

router.post("/", async (req, res): Promise<any> => {
  const sig = req.headers["stripe-signature"];

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    logger.warn("Missing stripe signature or webhook secret");
    return res.status(400).send("Webhook Error: Missing secret or signature");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    logger.error({ err }, "Stripe webhook signature verification failed");
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  logger.info({ type: event.type }, "Received Stripe Webhook");

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    logger.info({ metadata, sessionId: session.id }, "Payment succeeded - processing fulfillment");

    try {
      if (metadata?.type === "course" && metadata?.courseId && metadata?.userId) {
        // Enroll user in course
        const { db, enrollmentsTable } = await import("@workspace/db");
        await db
          .insert(enrollmentsTable)
          .values({
            userId: metadata.userId,
            courseId: metadata.courseId,
          })
          .onConflictDoNothing(); // Don't fail if already enrolled
        logger.info({ userId: metadata.userId, courseId: metadata.courseId }, "User enrolled in course after payment");

      } else if (metadata?.type === "product" && metadata?.productId && metadata?.userId) {
        // Deliver digital product
        const { db, purchasedProductsTable } = await import("@workspace/db");
        await db
          .insert(purchasedProductsTable)
          .values({
            productId: metadata.productId,
            userId: metadata.userId,
            paymentId: session.id,
          })
          .onConflictDoNothing();
        logger.info({ userId: metadata.userId, productId: metadata.productId }, "Product delivered after payment");

      } else if (metadata?.type === "booking") {
        const { db, bookingsTable } = await import("@workspace/db");
        await db
          .insert(bookingsTable)
          .values({
            userId: metadata.userId === "guest" ? null : metadata.userId,
            bookingKind: (metadata.bookingKind as any) || "single",
            date: metadata.date,
            slot: metadata.slot,
            sessionType: metadata.sessionType,
            packageSessionsTotal: metadata.packageSessionsTotal ? parseInt(metadata.packageSessionsTotal) : null,
            packageSessionsRemaining: metadata.packageSessionsTotal ? parseInt(metadata.packageSessionsTotal) : null,
            topic: metadata.topic || null,
            notes: metadata.notes || null,
            guestName: metadata.name || null,
            guestEmail: metadata.email || null,
            guestWhatsapp: metadata.whatsapp || null,
            status: "confirmed"
          });
        logger.info({ date: metadata.date, slot: metadata.slot }, "Booking payment confirmed and saved to DB");
      } else {
        logger.warn({ metadata }, "Unknown payment type or missing metadata");
      }
    } catch (fulfillmentError: any) {
      logger.error({ fulfillmentError: fulfillmentError.message, metadata }, "Fulfillment error after payment");
      // Still return 200 so Stripe doesn't retry - fulfillment errors are logged and monitored
    }
  }

  return res.json({ received: true });
});

export default router;
