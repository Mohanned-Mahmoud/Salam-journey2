import { Router, Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, funnelPageTable, usersTable } from "@workspace/db";
import jwt from "jsonwebtoken";

const router = Router();

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
    id: "b2",
    type: "countdown",
    data: {
      title: "ينتهي العرض خلال",
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      subtitle: "لا تفوّتي الفرصة",
    },
  },
  {
    id: "b3",
    type: "stats",
    data: {
      items: [
        { number: "+2000", label: "أم استفادت" },
        { number: "98%", label: "معدل الرضا" },
        { number: "+50", label: "جلسة تعليمية" },
      ],
    },
  },
  {
    id: "b4",
    type: "qualifier",
    data: {
      title: "هذا البرنامج مناسب لكِ إذا...",
      items: [
        "تشعرين بالإرهاق في التعامل مع أطفالك",
        "تريدين التوقف عن الصراخ والغضب",
        "تبحثين عن أدوات عملية للتربية الواعية",
        "تحتاجين إلى دعم من أم تفهمك وتشاركك تجربتها",
      ],
    },
  },
  {
    id: "b5",
    type: "bio",
    data: {
      name: "الكوتش إيمان",
      title: "مختصة في التربية الواعية",
      bio: "كوتش معتمدة في التربية الواعية مع خبرة أكثر من ٧ سنوات في مساعدة الأمهات على بناء علاقات أكثر هدوءاً وانسجاماً مع أطفالهن. ساعدت أكثر من ٢٠٠٠ أم في تحويل طريقة تعاملهن مع أطفالهن.",
      imageUrl: "",
    },
  },
  {
    id: "b6",
    type: "testimonials",
    data: {
      title: "ماذا قالت الأمهات؟",
      items: [
        { name: "سارة العتيبي", role: "أم لطفلين", quote: "غيّرت طريقة تعاملي مع طفلي تماماً. المحتوى عملي ومن قلب أم تفهمنا." },
        { name: "نورة الشهري", role: "أم جديدة", quote: "الجلسات كانت نقطة تحوّل. شعرت لأول مرة أن صوتي مسموع." },
        { name: "مها القحطاني", role: "أم لثلاثة", quote: "محتوى راقٍ يجمع بين الجانب التربوي والروحي. أنصح به كل أم." },
      ],
    },
  },
  {
    id: "b7",
    type: "faq",
    data: {
      title: "أسئلة شائعة",
      items: [
        { question: "متى يبدأ البرنامج؟", answer: "يبدأ البرنامج فور تسجيلك ويمكنك الوصول إليه في أي وقت." },
        { question: "هل البرنامج مسجّل أم مباشر؟", answer: "البرنامج يشمل محاضرات مسجّلة وجلسات مباشرة أسبوعية." },
        { question: "كيف أتواصل مع الكوتش؟", answer: "عبر مجموعة الدعم الخاصة بالبرنامج والجلسات المباشرة الأسبوعية." },
      ],
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

async function getOrCreateFunnelPage() {
  const rows = await db.select().from(funnelPageTable).limit(1);
  if (rows.length > 0) return rows[0];
  const [created] = await db
    .insert(funnelPageTable)
    .values({ blocks: DEFAULT_BLOCKS })
    .returning();
  return created;
}

router.get("/funnel-page", async (_req, res) => {
  try {
    const page = await getOrCreateFunnelPage();
    res.json(page);
  } catch {
    res.status(503).json({ error: "Failed to fetch funnel page" });
  }
});

router.put("/admin/funnel-page", isAdminAuthenticated, async (req, res) => {
  try {
    const { blocks } = req.body as { blocks: unknown[] };
    if (!Array.isArray(blocks)) {
      res.status(400).json({ error: "blocks must be an array" });
      return;
    }
    const existing = await db.select().from(funnelPageTable).limit(1);
    if (existing.length === 0) {
      const [created] = await db
        .insert(funnelPageTable)
        .values({ blocks, updatedAt: new Date() })
        .returning();
      res.json(created);
    } else {
      const [updated] = await db
        .update(funnelPageTable)
        .set({ blocks, updatedAt: new Date() })
        .where(eq(funnelPageTable.id, existing[0].id))
        .returning();
      res.json(updated);
    }
  } catch {
    res.status(503).json({ error: "Failed to save funnel page" });
  }
});

export default router;
