import { getGeminiApiKey } from "./gemini";

export async function createEmbedding(text: string, customApiKey?: string) {
  const apiKey = customApiKey || (await getGeminiApiKey());

  if (!apiKey) {
    throw new Error("مفتاح Gemini API غير مضبوط. يرجى إضافته في لوحة تحكم الأدمن.");
  }

  // Try text-embedding-004 first, fallback to gemini-embedding-001
  let response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: {
          parts: [{ text }],
        },
      }),
    }
  );

  if (!response.ok) {
    const fallbackResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: {
            parts: [{ text }],
          },
        }),
      }
    );

    if (fallbackResponse.ok) {
      response = fallbackResponse;
    } else {
      const errorText = await response.text();
      throw new Error(errorText);
    }
  }

  const data = (await response.json()) as any;

  return data.embedding.values as number[];
}