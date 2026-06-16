import { Router } from "express";
import { createHash } from "crypto";
import { db, translationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const TRANSLATION_SYSTEM_PROMPT = `You are the professional translation and localization assistant for "Salam Journey", a premium platform dedicated to conscious parenting and motherhood.

Your role is to provide high-quality English translations for Arabic parenting content (courses, descriptions, and tips).

Rules:
1. Tone & Voice: Be empathetic, warm, professional, and non-judgmental. Speak directly to a mother seeking guidance and peace.
2. Context: Always apply the lens of conscious parenting. Use terms like "mindful connection", "empathetic guidance", "self-awareness", and "emotional regulation" where natural.
3. Accuracy: Keep the core parenting advice accurate, but adapt the wording to sound natural in English — not word-for-word.
4. Safety: Avoid harmful or harsh language. If the Arabic input contains outdated or harsh parenting advice, soften it to align with modern positive parenting standards while preserving the original intent.
5. Format: Return ONLY the translated English text. No introductions, no explanations, no quotes. Preserve any placeholders like {name} exactly as-is.
6. Length: Match the length and structure of the original text as closely as possible.`;

router.post("/translate", async (req, res) => {
  try {
    const { text } = req.body as { text?: string };

    if (!text || !text.trim()) {
      res.status(400).json({ error: "text is required" });
      return;
    }

    const trimmedText = text.trim();
    const hash = createHash("sha256").update(trimmedText).digest("hex");

    const cached = await db
      .select()
      .from(translationsTable)
      .where(eq(translationsTable.textHash, hash))
      .limit(1);

    if (cached.length > 0) {
      res.json({ translatedText: cached[0].translatedText, cached: true });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "Gemini API key is missing" });
      return;
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: trimmedText }] }],
          systemInstruction: {
            parts: [{ text: TRANSLATION_SYSTEM_PROMPT }],
          },
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.3,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      res.status(502).json({ error: `Translation API error: ${errText}` });
      return;
    }

    const data = (await response.json()) as any;
    const translatedText: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!translatedText) {
      res.status(502).json({ error: "Empty translation response" });
      return;
    }

    await db.insert(translationsTable).values({
      textHash: hash,
      sourceText: trimmedText,
      translatedText: translatedText.trim(),
    });

    res.json({ translatedText: translatedText.trim(), cached: false });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Translation failed" });
  }
});

export default router;
