import { Router, type IRouter } from "express";
import { db, testimonialsTable, insertTestimonialSchema, type InsertTestimonial } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const DEFAULT_TESTIMONIALS: InsertTestimonial[] = [
  { nameAr: 'سارة العتيبي', roleAr: 'أم لطفلين', quoteAr: 'غيّرت طريقة تعاملي مع طفلي تماماً. المحتوى عملي ومن قلب أم تفهمنا.', rating: 5, status: 'active' },
  { nameAr: 'نورة الشهري', roleAr: 'أم جديدة', quoteAr: 'الجلسات الفردية كانت نقطة تحوّل. شعرت لأول مرة أن صوتي مسموع.', rating: 5, status: 'active' },
  { nameAr: 'مها القحطاني', roleAr: 'أم لثلاثة', quoteAr: 'محتوى راقٍ يجمع بين الجانب التربوي والروحي. أنصح به كل أم.', rating: 5, status: 'active' },
  { nameAr: 'ريم الدوسري', roleAr: 'أم عاملة', quoteAr: 'أحب أسلوب الكوتش إيمان، حنون ومرشد في نفس الوقت.', rating: 5, status: 'active' },
];

let seedTestimonialsPromise: Promise<void> | null = null;

async function ensureSeedTestimonials() {
  if (!seedTestimonialsPromise) {
    seedTestimonialsPromise = (async () => {
      const existing = await db.select().from(testimonialsTable);
      const existingQuotes = new Set(existing.map((item) => item.quoteAr));
      const missing = DEFAULT_TESTIMONIALS.filter((item) => !existingQuotes.has(item.quoteAr));

      if (missing.length > 0) {
        await db.insert(testimonialsTable).values(missing);
      }
    })();
  }

  return seedTestimonialsPromise;
}

router.get("/testimonials", async (_req, res) => {
  try {
    await ensureSeedTestimonials();
    const testimonials = await db.select().from(testimonialsTable);
    res.json(testimonials);
  } catch {
    res.status(500).json({ error: "Failed to fetch testimonials" });
  }
});

router.post("/testimonials", async (req, res) => {
  try {
    const validated = insertTestimonialSchema.parse(req.body);
    const testimonial = await db.insert(testimonialsTable).values(validated).returning();
    res.status(201).json(testimonial[0]);
  } catch {
    res.status(400).json({ error: "Invalid testimonial data" });
  }
});

router.put("/testimonials/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const validated = insertTestimonialSchema.partial().parse(req.body);
    const testimonial = await db.update(testimonialsTable).set(validated).where(eq(testimonialsTable.id, id)).returning();
    if (!testimonial.length) return res.status(404).json({ error: "Testimonial not found" });
    return res.json(testimonial[0]);
  } catch {
    return res.status(400).json({ error: "Invalid testimonial data" });
  }
});

router.delete("/testimonials/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const testimonial = await db.delete(testimonialsTable).where(eq(testimonialsTable.id, id)).returning();
    if (!testimonial.length) return res.status(404).json({ error: "Testimonial not found" });
    return res.json({ message: "Testimonial deleted" });
  } catch {
    return res.status(500).json({ error: "Failed to delete testimonial" });
  }
});

export default router;