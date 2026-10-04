import { Router } from "express";
import Stripe from "stripe";
import { logger } from "../lib/logger";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

router.post("/stripe/create-checkout-session", async (req, res): Promise<any> => {
  try {
    const { items, successUrl, cancelUrl, metadata } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: "Missing items" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: items.map((item: any) => ({
        price_data: {
          currency: "sar",
          product_data: {
            name: item.name,
            description: item.description,
          },
          unit_amount: Math.round(item.amount * 100), // Stripe expects amount in cents/halalas
        },
        quantity: item.quantity || 1,
      })),
      success_url: successUrl || `${FRONTEND_URL}/payment-success`,
      cancel_url: cancelUrl || `${FRONTEND_URL}/payment-cancel`,
      metadata: metadata || {},
    });

    return res.json({ url: session.url });
  } catch (error: any) {
    logger.error({ error }, "Error creating checkout session");
    return res.status(500).json({ error: error.message });
  }
});

export default router;
