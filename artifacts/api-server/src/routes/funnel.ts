import { Router, Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, funnelPageTable, funnelRegistrationsTable, usersTable } from "@workspace/db";
import jwt from "jsonwebtoken";

const router = Router();

// ممر الحماية للأدمن
async function isAdminAuthenticated(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) {
      res.status(401).json({ error: "No token provided" });
      return;
    }
    let decoded: any;
    try {
      const secret = process.env.JWT_SECRET || "secret";
      decoded = jwt.verify(token, secret);
    } catch {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }
    const userId = decoded.userId || decoded.id || decoded.sub;
    if (!userId) {
      res.status(401).json({ error: "Invalid token payload" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user || (user as any).role !== "admin") {
      res.status(403).json({ error: "Forbidden: admin only" });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

const DEFAULT_BLOCKS = [
  {
    id: "b1",
    type: "hero",
    data: {
      headline: "رحلة سلام للأمومة الواعية",
      subheadline: "برنامج تدريبي متكامل يساعدك على بناء علاقة هادئة وواعية مع طفلك",
      ctaText: "سجّلي الآن",
      ctaLink: "#cta",
      bgColor: "#7FA99B",
    },
  },
  {
    id: "b8",
    type: "cta",
    data: {
      headline: "جاهزة للانضمام؟",
      subheadline: "انضمي إلى أكثر من ٢٠٠٠ أم بدّلن طريقة تربيتهن",
      buttonText: "احجزي مقعدك الآن",
      buttonLink: "#",
      bgColor: "#7FA99B",
    },
  },
];

// جلب كل الصفحات (مفيد للأدمن لعرض القائمة)
router.get("/admin/funnel-pages", isAdminAuthenticated, async (_req, res) => {
  try {
    const pages = await db.select().from(funnelPageTable);
    res.json(pages);
  } catch {
    res.status(500).json({ error: "Failed to fetch funnel pages" });
  }
});

// جلب صفحة معينة بناءً على الـ slug (للعرض في الموقع)
router.get("/funnel-page/:slug", async (req, res) => {
  try {
    const slug = req.params.slug || "main";
    let [page] = await db.select().from(funnelPageTable).where(eq(funnelPageTable.slug, slug)).limit(1);
    
    // لو الصفحة الرئيسية مش موجودة ننشئها افتراضياً
    if (!page && slug === "main") {
      [page] = await db.insert(funnelPageTable).values({ title: "الصفحة الرئيسية", slug: "main", blocks: DEFAULT_BLOCKS }).returning();
    }

    if (!page) {
      res.status(404).json({ error: "Page not found" });
      return;
    }
    res.json(page);
  } catch {
    res.status(503).json({ error: "Failed to fetch funnel page" });
  }
});

// حفظ أو إنشاء صفحة تسويقية (للأدمن)
router.put("/admin/funnel-page", isAdminAuthenticated, async (req, res) => {
  try {
    const { id, title, slug, blocks } = req.body as { id?: string; title: string; slug: string; blocks: unknown[] };
    if (!Array.isArray(blocks)) {
      res.status(400).json({ error: "blocks must be an array" });
      return;
    }

    if (id) {
      // تعديل صفحة موجودة
      const [updated] = await db
        .update(funnelPageTable)
        .set({ title, slug, blocks, updatedAt: new Date() })
        .where(eq(funnelPageTable.id, id))
        .returning();
      res.json(updated);
    } else {
      // إنشاء صفحة جديدة تماماً
      const [created] = await db
        .insert(funnelPageTable)
        .values({ title, slug, blocks, updatedAt: new Date() })
        .returning();
      res.json(created);
    }
  } catch {
    res.status(503).json({ error: "Failed to save funnel page" });
  }
});

// حذف صفحة تسويقية (للأدمن)
router.delete("/admin/funnel-page/:id", isAdminAuthenticated, async (req, res) => {
  try {
    const pageId = req.params.id as string; // تحويل صريح لمنع خطأ الـ TypeScript
    await db.delete(funnelPageTable).where(eq(funnelPageTable.id, pageId));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete page" });
  }
});

// Endpoint جديد لتسجيل بيانات العملاء من الفورم التسويقي
router.post("/funnel/register", async (req, res) => {
  try {
    const { pageId, name, email, phone } = req.body;
    if (!pageId || !name || !email) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const [registration] = await db
      .insert(funnelRegistrationsTable)
      .values({ pageId, name, email, phone })
      .returning();
    res.json({ success: true, registration });
  } catch {
    res.status(500).json({ error: "Failed to register data" });
  }
});

export default router;