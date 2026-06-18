import { Router } from "express";
import { db, aiKnowledgeTable } from "@workspace/db";
import { createEmbedding } from "../lib/embeddings";
import { sql } from "drizzle-orm"; // تم إضافة sql لعمل استعلام الـ Vector

const router = Router();

// هذه المعلومات الأساسية للمنصة والتي يجب أن تظل ثابتة دائماً ليعرفها البوت
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
التربية الواعية تقوم على: الهدوء، الحدود بالحب, فهم مشاعر الطفل، العناية بالأم أولاً.
`;

// دالة الـ RAG الجديدة لجلب النصوص المتعلقة بسؤال المستخدم فقط
async function getRelevantKnowledge(userQuery: string): Promise<string> {
  try {
    if (!userQuery) return "";

    // 1. توليد الـ Embedding الخاص بسؤال المستخدم الحالي
    const queryEmbedding = await createEmbedding(userQuery);
    const embeddingString = `[${queryEmbedding.join(",")}]`;

    // 2. البحث في الداتابيز عن أقرب 3 نصوص باستخدام Cosine Distance (<=>)
    const rows = await db
      .select({
        title: aiKnowledgeTable.title,
        content: aiKnowledgeTable.content,
      })
      .from(aiKnowledgeTable)
      .orderBy(sql`${aiKnowledgeTable.embedding} <=> ${embeddingString}`) // حساب التشابه الجيبي
      .limit(3); // جلب أفضل 3 نتائج متعلقة بالسؤال فقط

    if (rows.length === 0) return "";

    // 3. دمج النتائج المسترجعة وتنسيقها
    return rows.map((r) => `## ${r.title}\n${r.content}`).join("\n\n");
  } catch (error) {
    console.error("RAG Error, returning empty dynamic knowledge:", error);
    return "";
  }
}

router.post("/ai/chat", async (req, res) => {
  try {
    const { messages } = req.body as { messages: { role: string; content: string }[] };
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "messages array required" });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "Gemini API key is missing" });
      return;
    }

    // استخراج آخر رسالة أرسلتها الأم (المستخدم) للبحث بها في الـ RAG
    const userMessages = messages.filter((m) => m.role === "user");
    const lastUserMessage = userMessages[userMessages.length - 1]?.content || "";

    // جلب المعرفة الديناميكية المرتبطة بالسؤال فقط
    const dynamicKnowledge = await getRelevantKnowledge(lastUserMessage);

    // دمج معلومات المنصة الثابتة مع المقالات/المعلومات المسترجعة من الـ RAG
    const fullKnowledge = `${DEFAULT_KNOWLEDGE}\n\n${dynamicKnowledge}`;

    console.log("Knowledge Length:", fullKnowledge.length);

    const systemPrompt = `أنتِ مساعدة ذكية لمنصة "رحلة سلام" للتربية الواعية.

مهمتكِ مساعدة الأمهات في فهم مشاكلهن التربوية وتوجيههن إلى الحل المناسب (جلسة فردية، دورة، أو منتج رقمي).

قواعد مهمة ومقدسة:

1. أجيبي فقط بناءً على المعلومات الموجودة في "المعلومات المتاحة" أدناه.
2. لا تخترعي أي معلومة غير موجودة في قاعدة المعرفة.
3. إذا لم تجدي إجابة واضحة في المعلومات المتاحة فقولي:
   "لا أملك معلومات كافية حالياً وسأقوم بتوجيه سؤالكِ للكوتش المختص."

4. تحدثي دائماً بأسلوب دافئ وحنون ومطمئن.

5. اجعلي الإجابات مختصرة وعملية قدر الإمكان (3-7 جمل غالباً).

6. إذا كانت المعلومات المتاحة تحتوي على:
   - روابط مواقع
   - روابط فيديوهات
   - روابط كتب
   - ملفات PDF
   - ملفات قابلة للتحميل
   - أي رابط خارجي

   فيجب إظهار الرابط داخل الإجابة وعدم تجاهله.

7. عند ذكر أي رابط استخدمي صيغة Markdown التالية فقط:
   [اسم الرابط](الرابط)

8. لا تحذفي أي رابط موجود في المعلومات المتاحة إذا كان مرتبطاً بالإجابة.

9. إذا كان السؤال متعلقاً بمقال أو منشور أو فيديو موجود في قاعدة المعرفة، قومي بتلخيص المعلومة ثم أضيفي الرابط الأصلي في نهاية الإجابة.

10. عند اقتراح خدمات المنصة استخدمي الروابط التالية حرفياً:

   - [حجز جلسة استشارية](/sessions)
   - [تصفح الدورات والورش](/courses)
   - [تصفح المنتجات الرقمية](/products)

11. إذا كانت المستخدمة تتحدث العربية فأجيبي بالعربية.
12. إذا كانت المستخدمة تتحدث الإنجليزية فأجيبي بالإنجليزية.

المعلومات المتاحة:

${fullKnowledge}`;

    const geminiContents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: geminiContents,
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          generationConfig: {
            maxOutputTokens: 4096,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.log("============== GEMINI ERROR ==============");
      console.log(errText);
      console.log("=========================================");
      res.status(502).json({ error: `Gemini error: ${errText}` });
      return;
    }

    const data = (await response.json()) as any;

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text || "")
        .join("")
        .trim() ?? "";

    console.log("Reply Length:", reply.length);

    if (!reply) {
      console.error("Gemini Response:", JSON.stringify(data, null, 2));
      res.status(502).json({ error: "Empty response from Gemini" });
      return;
    }

    res.json({ reply });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "AI chat failed" });
  }
});

// --- بقية المسارات للأدمن تظل مستقرة ---
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
      return res.status(400).json({ error: "title and content required" });
    }

    const embedding = await createEmbedding(`${title}\n\n${content}`);

    const [row] = await db
      .insert(aiKnowledgeTable)
      .values({
        title,
        content,
        embedding: `[${embedding.join(",")}]`,
      } as any)
      .returning();

    return res.json(row);
  } catch (err: any) {
    console.error("========== CREATE KNOWLEDGE ERROR ==========");
    console.error(err);
    console.error("============================================");
    return res.status(500).json({ error: err?.message || String(err) });
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