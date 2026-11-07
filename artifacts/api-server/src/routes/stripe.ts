import { Router } from "express";
import Stripe from "stripe";
import { logger } from "../lib/logger";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// In-memory set to guard against duplicate pixel firings across sessions
const trackedPixelSessions = new Set<string>();

router.post("/stripe/create-checkout-session", async (req, res): Promise<any> => {
  try {
    const { items, successUrl, cancelUrl, metadata } = req.body;

    logger.info({ items, metadata }, "Creating Stripe checkout session");

    if (!items || !items.length) {
      return res.status(400).json({ error: "Missing items" });
    }

    // Validate each item has a positive amount
    for (const item of items) {
      const amount = Number(item.amount);
      if (!amount || amount <= 0 || isNaN(amount)) {
        logger.error({ item }, "Invalid item amount");
        return res.status(400).json({ error: `Invalid amount for item: ${item.name}. Got: ${item.amount}` });
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: items.map((item: any) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            description: item.description || "",
          },
          unit_amount: Math.round(Number(item.amount) * 100), // Stripe expects amount in halalas
        },
        quantity: item.quantity || 1,
      })),
      success_url: successUrl || `${FRONTEND_URL}/payment-success`,
      cancel_url: cancelUrl || `${FRONTEND_URL}/payment-cancel`,
      metadata: metadata || {},
    });

    logger.info({ sessionId: session.id }, "Stripe checkout session created");
    return res.json({ url: session.url });
  } catch (error: any) {
    logger.error({ errorMessage: error.message, errorType: error.type, errorCode: error.code }, "Stripe error creating checkout session");
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint to securely verify a Stripe Checkout Session for the Thank You page.
 * Returns authoritative transaction details directly from Stripe to prevent client-side tampering.
 */
router.get("/stripe/verify-session/:sessionId", async (req, res): Promise<any> => {
  try {
    const { sessionId } = req.params;

    if (!sessionId || typeof sessionId !== "string" || !sessionId.trim().startsWith("cs_")) {
      return res.status(400).json({ error: "Invalid Stripe Checkout Session ID format" });
    }

    const cleanSessionId = sessionId.trim();

    // Retrieve session directly from Stripe with line items and payment intent expanded
    const session = await stripe.checkout.sessions.retrieve(cleanSessionId, {
      expand: ["line_items", "payment_intent"],
    });

    if (!session) {
      return res.status(404).json({ error: "Checkout session not found" });
    }

    const isPaid = session.payment_status === "paid";
    const amount = session.amount_total ? session.amount_total / 100 : 0;
    const currency = (session.currency || "USD").toUpperCase();
    const transactionId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || session.id;

    const items =
      session.line_items?.data?.map((li) => ({
        description: li.description || "",
        amount: li.amount_total ? li.amount_total / 100 : 0,
        currency: (li.currency || "USD").toUpperCase(),
        quantity: li.quantity || 1,
      })) || [];

    const alreadyTracked = trackedPixelSessions.has(cleanSessionId);

    logger.info(
      { sessionId: session.id, isPaid, amount, currency, status: session.status, alreadyTracked },
      "Stripe session verified for Thank You page"
    );

    return res.json({
      paid: isPaid,
      status: session.status,
      paymentStatus: session.payment_status,
      sessionId: session.id,
      transactionId,
      amount,
      currency,
      customerEmail: session.customer_details?.email || session.customer_email || null,
      customerName: session.customer_details?.name || null,
      items,
      alreadyTracked,
    });
  } catch (error: any) {
    logger.error({ error: error.message, sessionId: req.params.sessionId }, "Error retrieving Stripe session");
    return res.status(error.statusCode || 500).json({
      error: error.message || "Failed to retrieve checkout session from Stripe",
    });
  }
});

/**
 * Acknowledge that Meta Pixel Purchase event was fired for a session
 * to provide server-level deduplication across browser refreshes/revisits.
 */
router.post("/stripe/record-pixel-purchase/:sessionId", async (req, res): Promise<any> => {
  try {
    const { sessionId } = req.params;
    if (sessionId && sessionId.startsWith("cs_")) {
      trackedPixelSessions.add(sessionId.trim());
    }
    return res.json({ success: true, alreadyTracked: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

interface StripeProductPreview {
  slug: string;
  aliases: string[];
  paymentLinkId: string;
  paymentLinkUrl: string;
  productId: string;
  priceId: string;
  name: string;
  description: string | null;
  images: string[];
  price: number;
  currency: string;
  active: boolean;
}

const STRIPE_PAYMENT_LINKS_CONFIG = [
  {
    slug: "warm-homes",
    aliases: ["boyoot", "pay-1", "product-1", "prod_vv8wxcaq8tgrn7"],
    linkId: "plink_1UU8I4RwmR3yZTBekZGQdcig",
  },
  {
    slug: "reading-challenge",
    aliases: ["challenge", "pay-2", "product-2", "prod_v2a6xnrbbtbvzju"],
    linkId: "plink_1U2VubRwmR3yZTBexIEFdR4S",
  },
];

let cachedProductsPreview: { timestamp: number; data: StripeProductPreview[] } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

async function getStripeProductsPreview(forceRefresh = false): Promise<StripeProductPreview[]> {
  const now = Date.now();
  if (!forceRefresh && cachedProductsPreview && now - cachedProductsPreview.timestamp < CACHE_TTL_MS) {
    return cachedProductsPreview.data;
  }

  const results: StripeProductPreview[] = [];
  for (const item of STRIPE_PAYMENT_LINKS_CONFIG) {
    try {
      const link = await stripe.paymentLinks.retrieve(item.linkId);
      const lineItems = await stripe.paymentLinks.listLineItems(item.linkId);
      const firstItem = lineItems.data[0];
      if (!firstItem || !firstItem.price) continue;

      const price = await stripe.prices.retrieve(firstItem.price.id);
      const productId = typeof price.product === "string" ? price.product : price.product.id;
      const product = await stripe.products.retrieve(productId);

      results.push({
        slug: item.slug,
        aliases: item.aliases,
        paymentLinkId: item.linkId,
        paymentLinkUrl: link.url,
        productId: product.id,
        priceId: price.id,
        name: product.name,
        description: product.description || null,
        images: product.images || [],
        price: price.unit_amount ? price.unit_amount / 100 : 0,
        currency: (price.currency || "USD").toUpperCase(),
        active: product.active,
      });
    } catch (err: any) {
      logger.error({ err: err.message, linkId: item.linkId }, "Failed to retrieve product preview from Stripe");
    }
  }

  cachedProductsPreview = { timestamp: now, data: results };
  return results;
}

/**
 * Retrieve dynamic product preview information directly from Stripe.
 * Never hardcodes product data; uses Stripe as the single source of truth.
 */
router.get("/stripe/products-preview", async (req, res): Promise<any> => {
  try {
    const refresh = req.query.refresh === "true";
    const products = await getStripeProductsPreview(refresh);
    return res.json({ products });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error fetching Stripe products preview");
    return res.status(500).json({ error: "Failed to retrieve products from Stripe" });
  }
});

/**
 * Retrieve a specific product preview by slug, alias, or productId.
 */
router.get("/stripe/products-preview/:slug", async (req, res): Promise<any> => {
  try {
    const slug = (req.params.slug || "").toLowerCase().trim();
    const products = await getStripeProductsPreview();
    const found = products.find(
      (p) =>
        p.slug.toLowerCase() === slug ||
        p.productId.toLowerCase() === slug ||
        p.aliases.some((a) => a.toLowerCase() === slug)
    );

    if (!found) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json({ product: found });
  } catch (error: any) {
    logger.error({ error: error.message, slug: req.params.slug }, "Error fetching Stripe product preview");
    return res.status(500).json({ error: "Failed to retrieve product from Stripe" });
  }
});

export default router;
