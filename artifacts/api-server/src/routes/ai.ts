import { Router } from "express";
import { db, aiKnowledgeTable } from "@workspace/db";

const router = Router();

const DEFAULT_KNOWLEDGE = `
# رحلة سلام - معلومات المساعد الذكي

## من نحن
رحلة سلام منصة تخصصية للتربية الواعية، تقدم جلسات فردية ودورات ومنتجات رقمية للأمهات.

## الجلسات الفردية
- جلسة فردية مع الكوتش: استشارة شخصية لمشكلتك التربوية
- باقة 4 جلسات: للمتابعة العميقة والتحول الحقيقي
- الحجز عبر صفحة الجلسات في الموقع

## الدورات المتاحة
1. وأصبحتُ أُمّاً هادئة - 4 أسابيع - 299 ريال: لتعلّم التعامل مع الغضب وبناء علاقة هادئة
2. حدود واضحة بحب - 3 أسابيع - 249 ريال: كيف تضعين حدوداً لأطفالك دون فقدان الدفء
3. ورشة نوبات الغضب - 90 دقيقة - 99 ريال: لفهم نوبات الغضب والتعامل معها
4. ورشة الأم تستحق - 60 دقيقة - 79 ريال: عن العناية بالذات والوقت الخاص للأم
5. دليل الأم الواعية - مجاناً: دليل تمهيدي لمبادئ التربية الواعية
6. الأم الجديدة - مجاناً: محاضرة للأمهات في الأشهر الأولى

## المنتجات الرقمية
- مفكّرة الروتين الصباحي - 39 ريال
- بطاقات المشاعر للأطفال (30 بطاقة) - 49 ريال
- دليل الأم الهادئة (PDF 24 صفحة) - 29 ريال
- قائمة العناية بالأم - مجاناً
- ورق عمل للأطفال (4-9 سنوات) - 35 ريال
- بطاقات تأكيدات للأم - مجاناً

## مبادئنا
التربية الواعية تقوم على: الهدوء، الحدود بالحب، فهم مشاعر الطفل، العناية بالأم أولاً.
`;

async function getKnowledge(): Promise<string> {
  try {
    const rows = await db.select().from(aiKnowledgeTable).orderBy(aiKnowledgeTable.updatedAt);
    if (rows.length === 0) return DEFAULT_KNOWLEDGE;
    return rows.map((r) => `## ${r.title}\n${r.content}`).join("\n\n");
  } catch {
    return DEFAULT_KNOWLEDGE;
  }
}

router.post("/ai/chat", async (req, res) => {
  try {
    const { messages } = req.body as { messages: { role: string; content: string }[] };
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "messages array required" });
      return;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "AI not configured" });
      return;
    }

    const knowledge = await getKnowledge();

    const systemPrompt = `أنتِ مساعدة ذكية لمنصة "رحلة سلام" للتربية الواعية.
مهمتكِ مساعدة الأمهات في فهم مشاكلهن التربوية وتوجيههن إلى الحل المناسب (جلسة فردية، دورة، أو منتج رقمي).

قواعد مهمة:
1. أجيبي فقط بناءً على المعلومات المقدمة أدناه - لا تخترعي معلومات غير موجودة.
2. إذا لم تجدي إجابة في المعلومات المتاحة، قولي بوضوح أنك ستوجهين السؤال للكوتش.
3. تحدثي بأسلوب دافئ وحنون يليق بأم تحتاج للدعم.
4. اقترحي دائماً الخطوة التالية المناسبة (حجز جلسة، شراء دورة، تحميل منتج).
5. أجيبي باللغة التي تتحدث بها المستخدمة (عربي أو إنجليزي).
6. اجعلي إجاباتكِ مختصرة وعملية (3-5 جمل كحد أقصى).

المعلومات المتاحة:
${knowledge}`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 500,
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-10),
        ],
      }),
    });

    if (!response.ok || !response.body) {
      const err = await response.text();
      res.write(`data: ${JSON.stringify({ error: err })}\n\n`);
      res.end();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === "[DONE]") {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          continue;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
        } catch {}
      }
    }

    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

router.get("/ai/knowledge", async (_req, res) => {
  try {
    const rows = await db.select().from(aiKnowledgeTable).orderBy(aiKnowledgeTable.updatedAt);
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch knowledge" });
  }
});

router.post("/ai/knowledge", async (req, res) => {
  try {
    const { title, content } = req.body as { title: string; content: string };
    if (!title || !content) {
      res.status(400).json({ error: "title and content required" });
      return;
    }
    const [row] = await db.insert(aiKnowledgeTable).values({ title, content }).returning();
    res.json(row);
  } catch {
    res.status(500).json({ error: "Failed to create knowledge entry" });
  }
});

router.put("/ai/knowledge/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body as { title: string; content: string };
    const { eq } = await import("drizzle-orm");
    const [row] = await db
      .update(aiKnowledgeTable)
      .set({ title, content, updatedAt: new Date() })
      .where(eq(aiKnowledgeTable.id, id))
      .returning();
    res.json(row);
  } catch {
    res.status(500).json({ error: "Failed to update knowledge entry" });
  }
});

router.delete("/ai/knowledge/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { eq } = await import("drizzle-orm");
    await db.delete(aiKnowledgeTable).where(eq(aiKnowledgeTable.id, id));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete knowledge entry" });
  }
});

export default router;
