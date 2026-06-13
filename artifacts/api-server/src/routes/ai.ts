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
التربية الواعية تقوم على: الهدوء، الحدود بالحب, فهم مشاعر الطفل، العناية بالأم أولاً.
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "Gemini API key is missing in .env" });
      return;
    }

    const knowledge = await getKnowledge();

    const systemPrompt = `أنتِ مساعدة ذكية لمنصة "رحلة سلام" للتربية الواعية.
مهمتكِ مساعدة الأمهات في فهم مشاكلهن التربوية وتوجيههن إلى الحل المناسب (جلسة فردية، دورة، أو منتج رقمي).

قواعد مهمة ومقدسة:
1. أجيبي فقط بناءً على المعلومات المقدمة أدناه - لا تخترعي معلومات غير موجودة.
2. إذا لم تجدي إجابة في المعلومات المتاحة، قولي بوضوح أنك ستوجهين السؤال للكوتش.
3. تحدثي بأسلوب دافئ وحنون يليق بأم تحتاج للدعم والاحتواء.
4. 🌟 وجهي الأمهات دائماً لاتخاذ خطوة عملية، وعند اقتراح صفحة، استخدمي روابط الـ Markdown التالية [اسم الزر أو الرابط](المسار) حرفياً ليتم تفعيلها كأزرار تفاعلية:
   - لحجز الجلسات والاستشارات الفردية استخدمي المسار: [حجز جلسة استشارية](/sessions)
   - لتصفح ورش العمل والدورات التربوية استخدمي المسار: [تصفح الدورات والورش](/courses)
   - لتنزيل الأدلة الرقمية والمنتجات المجانية استخدمي المسار: [تصفح المنتجات الرقمية](/products)
5. إذا كانت المعلومات المتاحة في قاعدة البيانات تحتوي على روابط خارجية (مثل روابط كتب أو ملفات PDF)، اذكرريها بصيغة الـ Markdown الافتراضية [اسم الرابط](الرابط) كما هي دون تعديل.
6. أجيبي باللغة التي تتحدث بها المستخدمة (عربي أو إنجليزي).
7. اجعلي إجاباتكِ مختصرة وعملية جداً (3-5 جمل كحد أقصى).

المعلومات المتاحة:
${knowledge}`;

    const geminiContents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("X-Accel-Buffering", "no");
    if (typeof (res as any).flushHeaders === "function") {
      (res as any).flushHeaders();
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:streamGenerateContent?alt=sse",
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
            maxOutputTokens: 1000,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok || !response.body) {
      const errText = !response.ok ? await response.text() : "Response body is null";
      res.write(`data: ${JSON.stringify({ error: `Gemini Error: ${errText}` })}\n\n`);
      res.end();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let backendBuffer = "";

    // دالة داخلية لمعالجة وتمرير السطور بانتظام
    const processLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) return;

      const jsonStart = trimmed.indexOf("{");
      if (jsonStart === -1) return;
      const cleanJsonStr = trimmed.substring(jsonStart);

      try {
        const parsed = JSON.parse(cleanJsonStr);
        const textToken = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textToken) {
          res.write(`data: ${JSON.stringify({ content: textToken })}\n\n`);
        }
      } catch {}
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      backendBuffer += decoder.decode(value, { stream: true });
      const lines = backendBuffer.split("\n");
      backendBuffer = lines.pop() || ""; // عزل السطر غير المكتمل مؤقتاً

      for (const line of lines) {
        processLine(line);
      }
    }

    // 🌟 خطوة الإنقاذ الحاسمة: معالجة بواقي البافر الأخيرة لو متبقي فيها داتا بعد انتهاء اللوب
    if (backendBuffer.trim()) {
      processLine(backendBuffer);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
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