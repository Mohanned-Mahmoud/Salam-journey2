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

    logger.info({ metadata }, "Payment succeeded for session");
    
    // Here we will handle fulfillment based on metadata (e.g. type: 'course', id: '123')
    if (metadata?.type === 'course') {
        // Handle course enrollment
        logger.info(`Enrolling user in course ${metadata.courseId}`);
    } else if (metadata?.type === 'booking') {
        // Handle booking confirmation
        logger.info(`Confirming booking ${metadata.bookingId}`);
    } else if (metadata?.type === 'product' && metadata?.productId && metadata?.userId) {
        // Handle digital product delivery
        logger.info(`Delivering product ${metadata.productId} to user ${metadata.userId}`);
        const { db, purchasedProductsTable } = await import("@workspace/db");
        await db.insert(purchasedProductsTable).values({
          productId: metadata.productId,
          userId: metadata.userId,
          paymentId: session.id
        });
    }
  }

  return res.json({ received: true });
});

export default router;
