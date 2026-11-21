import { Router } from "express";
import { db, paymentOrdersTable, siteSettingsTable, purchasedProductsTable, enrollmentsTable, bookingsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

// Cache live exchange rate for 15 minutes
let cachedRate: { rate: number; timestamp: number; provider: string } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Multi-source resilient live exchange rate fetcher (USD -> EGP)
 * Automatically queries authoritative international currency providers.
 */
async function fetchFromLiveApis(): Promise<{ rate: number; provider: string } | null> {
  // Source 1: Open Exchange Rates free API (Real-time global forex)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data: any = await res.json();
      if (data && data.rates && typeof data.rates.EGP === "number" && data.rates.EGP > 0) {
        const rate = Number(data.rates.EGP.toFixed(2));
        return { rate, provider: "Open Exchange Rates (Global Forex)" };
      }
    }
  } catch (err) {
    logger.warn({ err }, "Live exchange rate source 1 failed");
  }

  // Source 2: ExchangeRate-API v4 (Direct financial feed)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD", { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data: any = await res.json();
      if (data && data.rates && typeof data.rates.EGP === "number" && data.rates.EGP > 0) {
        const rate = Number(data.rates.EGP.toFixed(2));
        return { rate, provider: "ExchangeRate API Feed" };
      }
    }
  } catch (err) {
    logger.warn({ err }, "Live exchange rate source 2 failed");
  }

  // Source 3: CDN-based currency index
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json", { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data: any = await res.json();
      if (data && data.usd && typeof data.usd.egp === "number" && data.usd.egp > 0) {
        const rate = Number(data.usd.egp.toFixed(2));
        return { rate, provider: "Global Currency CDN Index" };
      }
    }
  } catch (err) {
    logger.warn({ err }, "Live exchange rate source 3 failed");
  }

  return null;
}

async function getLiveUsdToEgpRate(forceRefresh = false): Promise<{ rate: number; isLive: boolean; provider: string; updatedAt: string }> {
  const now = Date.now();
  if (!forceRefresh && cachedRate && now - cachedRate.timestamp < CACHE_TTL_MS) {
    return {
      rate: cachedRate.rate,
      isLive: true,
      provider: cachedRate.provider,
      updatedAt: new Date(cachedRate.timestamp).toISOString(),
    };
  }

  // Query live financial APIs
  const liveResult = await fetchFromLiveApis();
  if (liveResult) {
    cachedRate = {
      rate: liveResult.rate,
      timestamp: now,
      provider: liveResult.provider,
    };
    logger.info({ rate: liveResult.rate, provider: liveResult.provider }, "Live USD to EGP rate updated automatically");

    // Also persist in site_settings so database always has the latest live rate
    try {
      await db
        .insert(siteSettingsTable)
        .values({ key: "usd_to_egp_rate", value: String(liveResult.rate) })
        .onConflictDoUpdate({
          target: siteSettingsTable.key,
          set: { value: String(liveResult.rate), updatedAt: new Date() },
        });
    } catch (e) {
      // Non-blocking
    }

    return {
      rate: liveResult.rate,
      isLive: true,
      provider: liveResult.provider,
      updatedAt: new Date(now).toISOString(),
    };
  }

  // Fallback to database setting or default
  try {
    const setting = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "usd_to_egp_rate")).limit(1);
    if (setting.length > 0 && setting[0].value) {
      const fallbackRate = parseFloat(setting[0].value);
      if (!isNaN(fallbackRate) && fallbackRate > 0) {
        return {
          rate: fallbackRate,
          isLive: false,
          provider: "قاعدة البيانات المحفوظة",
          updatedAt: setting[0].updatedAt ? setting[0].updatedAt.toISOString() : new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    logger.warn({ err }, "Failed to read fallback rate from database");
  }

  return {
    rate: 53.8,
    isLive: false,
    provider: "القيمة الاحتياطية",
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Public endpoint: Get InstaPay config and guaranteed live exchange rate
 */
router.get("/orders/config", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true";
    const settings = await db.select().from(siteSettingsTable);
    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

    const liveRateInfo = await getLiveUsdToEgpRate(forceRefresh);

    const config = {
      instapayUsername: settingsMap.get("instapay_username") || "salamjourney@instapay",
      instapayPhone: settingsMap.get("instapay_phone") || settingsMap.get("whatsapp_number") || "01015473623",
      instapayLink: settingsMap.get("instapay_link") || "https://ipn.eg",
      whatsappNumber: settingsMap.get("whatsapp_number") || "+201015473623",
      usdToEgpRate: liveRateInfo.rate,
      isLiveRate: liveRateInfo.isLive,
      rateProvider: liveRateInfo.provider,
      rateUpdatedAt: liveRateInfo.updatedAt,
    };

    res.json(config);
  } catch (error: any) {
    logger.error({ error }, "Error fetching orders config");
    res.status(500).json({ error: error.message || "Failed to load orders config" });
  }
});

/**
 * Admin endpoint: Update InstaPay settings & exchange rate
 */
router.put("/admin/orders/config", async (req, res): Promise<any> => {
  try {
    const { instapayUsername, instapayPhone, instapayLink, usdToEgpRate } = req.body;

    const updates: { key: string; value: string }[] = [];
    if (instapayUsername !== undefined) {
      updates.push({ key: "instapay_username", value: String(instapayUsername) });
    }
    if (instapayPhone !== undefined) {
      updates.push({ key: "instapay_phone", value: String(instapayPhone) });
    }
    if (instapayLink !== undefined) {
      updates.push({ key: "instapay_link", value: String(instapayLink) });
    }
    if (usdToEgpRate !== undefined && !isNaN(parseFloat(usdToEgpRate))) {
      updates.push({ key: "usd_to_egp_rate", value: String(usdToEgpRate) });
      cachedLiveRate = {
        rate: parseFloat(usdToEgpRate),
        fetchedAt: Date.now(),
        provider: "تم التعيين يدوياً من الإدارة",
      };
    }

    for (const item of updates) {
      await db
        .insert(siteSettingsTable)
        .values({ key: item.key, value: item.value, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: siteSettingsTable.key,
          set: { value: item.value, updatedAt: new Date() },
        });
    }

    res.json({ success: true, message: "تم حفظ إعدادات انستا باي بنجاح" });
  } catch (error: any) {
    logger.error({ error }, "Error updating orders config");
    res.status(500).json({ error: error.message || "Failed to update orders config" });
  }
});

/**
 * Public endpoint: Submit an InstaPay order
 */
router.post("/orders/instapay", async (req, res): Promise<any> => {
  try {
    const {
      userId,
      customerName,
      customerEmail,
      customerPhone,
      itemType,
      itemId,
      itemTitle,
      amountUsd,
    } = req.body;

    if (!customerName || !customerEmail || !itemType || !itemId || !itemTitle || amountUsd === undefined) {
      return res.status(400).json({ error: "Missing required order information" });
    }

    const rateInfo = await getLiveUsdToEgpRate(false);
    const liveRate = rateInfo.rate;
    const usd = Number(amountUsd);
    const egp = Math.round(usd * liveRate * 100) / 100;

    // If userId was provided, verify user exists (or resolve by email)
    let resolvedUserId: string | null = userId || null;
    if (!resolvedUserId && customerEmail) {
      const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, customerEmail.toLowerCase().trim())).limit(1);
      if (existingUser.length > 0) {
        resolvedUserId = existingUser[0].id;
      }
    }

    const [order] = await db
      .insert(paymentOrdersTable)
      .values({
        userId: resolvedUserId,
        customerName: customerName.trim(),
        customerEmail: customerEmail.toLowerCase().trim(),
        customerPhone: customerPhone ? customerPhone.trim() : null,
        itemType,
        itemId: String(itemId),
        itemTitle: itemTitle.trim(),
        amountUsd: String(usd.toFixed(2)),
        amountEgp: String(egp.toFixed(2)),
        exchangeRate: String(liveRate.toFixed(2)),
        paymentMethod: "instapay",
        status: "pending_verification",
      })
      .returning();

    logger.info({ orderId: order.id, customerEmail, itemTitle }, "InstaPay order created");

    // Fetch site WhatsApp number for pre-filled chat
    const waSetting = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "whatsapp_number")).limit(1);
    const rawWaNumber = waSetting[0]?.value || "+201015473623";
    const cleanWaNumber = rawWaNumber.replace(/[^0-9]/g, "");

    // Prepare WhatsApp message
    const waMessage = `السلام عليكم ورحمة الله،\nلقد قمت بتحويل مبلغ ${order.amountEgp} ج.م عبر انستا باي لتأكيد طلب الشراء.\n\nتفاصيل الطلب:\n- رقم الطلب: ${order.id.slice(0, 8)}\n- العنصر: ${order.itemTitle}\n- المبلغ: ${order.amountEgp} ج.م ($${order.amountUsd})\n- الاسم: ${order.customerName}\n- البريد: ${order.customerEmail}\n\nمرفق لسيادتكم إثبات التحويل للتأكيد 🌿`;

    const whatsappUrl = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(waMessage)}`;

    res.json({
      success: true,
      order,
      whatsappUrl,
      whatsappMessage: waMessage,
    });
  } catch (error: any) {
    logger.error({ error }, "Error creating InstaPay order");
    res.status(500).json({ error: error.message || "Failed to create order" });
  }
});

/**
 * Admin endpoint: List orders
 */
router.get("/orders", async (req, res): Promise<any> => {
  try {
    const { status } = req.query;

    let query = db.select().from(paymentOrdersTable);
    if (status && typeof status === "string") {
      query = query.where(eq(paymentOrdersTable.status, status)) as any;
    }

    const orders = await query.orderBy(desc(paymentOrdersTable.createdAt));
    res.json(orders);
  } catch (error: any) {
    logger.error({ error }, "Error fetching orders list");
    res.status(500).json({ error: error.message || "Failed to fetch orders" });
  }
});

/**
 * Admin endpoint: Update order status (Approve / Reject)
 */
router.patch("/orders/:id/status", async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const { status, adminNotes, approvedBy } = req.body;

    if (!["approved", "rejected", "pending_verification", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const existing = await db.select().from(paymentOrdersTable).where(eq(paymentOrdersTable.id, id)).limit(1);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = existing[0];

    const updates: any = {
      status,
      adminNotes: adminNotes !== undefined ? adminNotes : order.adminNotes,
      updatedAt: new Date(),
    };

    if (status === "approved") {
      updates.approvedAt = new Date();
      updates.approvedBy = approvedBy || "Admin";

      // Auto-fulfill item
      let targetUserId = order.userId;

      // If order has no userId, try finding user by email
      if (!targetUserId && order.customerEmail) {
        const found = await db.select().from(usersTable).where(eq(usersTable.email, order.customerEmail.toLowerCase().trim())).limit(1);
        if (found.length > 0) {
          targetUserId = found[0].id;
          updates.userId = targetUserId;
        }
      }

      if (targetUserId) {
        if (order.itemType === "product") {
          await db
            .insert(purchasedProductsTable)
            .values({
              userId: targetUserId,
              productId: order.itemId,
              paymentId: `instapay_${order.id}`,
            })
            .onConflictDoNothing();
          logger.info({ userId: targetUserId, productId: order.itemId }, "Product unlocked for user upon InstaPay approval");
        } else if (order.itemType === "course") {
          await db
            .insert(enrollmentsTable)
            .values({
              userId: targetUserId,
              courseId: order.itemId,
            })
            .onConflictDoNothing();
          logger.info({ userId: targetUserId, courseId: order.itemId }, "User enrolled in course upon InstaPay approval");
        }
      } else {
        logger.warn({ orderId: order.id, email: order.customerEmail }, "Order approved but user ID not found. User needs to register with matching email.");
      }

      if (order.itemType === "booking") {
        await db
          .update(bookingsTable)
          .set({ status: "confirmed" })
          .where(eq(bookingsTable.id, order.itemId));
        logger.info({ bookingId: order.itemId }, "Booking confirmed upon InstaPay approval");
      }
    }

    const [updatedOrder] = await db
      .update(paymentOrdersTable)
      .set(updates)
      .where(eq(paymentOrdersTable.id, id))
      .returning();

    res.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    logger.error({ error }, "Error updating order status");
    res.status(500).json({ error: error.message || "Failed to update order status" });
  }
});

export default router;
