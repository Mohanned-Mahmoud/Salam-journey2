import { db, siteSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

let cachedApiKey: string | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 30000; // 30 seconds cache for performance

/**
 * Retrieve the active Gemini API key:
 * 1. Checks `site_settings` table for key 'gemini_api_key'
 * 2. Falls back to process.env.GEMINI_API_KEY
 */
export async function getGeminiApiKey(): Promise<string> {
  const now = Date.now();
  if (cachedApiKey !== null && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedApiKey;
  }

  try {
    const [row] = await db
      .select()
      .from(siteSettingsTable)
      .where(eq(siteSettingsTable.key, "gemini_api_key"))
      .limit(1);

    if (row && row.value && row.value.trim().length > 0) {
      cachedApiKey = row.value.trim();
      lastCacheTime = now;
      return cachedApiKey;
    }
  } catch (err) {
    console.error("Failed to query gemini_api_key from DB:", err);
  }

  cachedApiKey = (process.env.GEMINI_API_KEY || "").trim();
  lastCacheTime = now;
  return cachedApiKey;
}

export async function getGeminiApiKeySource(): Promise<"database" | "env" | "none"> {
  try {
    const [row] = await db
      .select()
      .from(siteSettingsTable)
      .where(eq(siteSettingsTable.key, "gemini_api_key"))
      .limit(1);

    if (row && row.value && row.value.trim().length > 0) {
      return "database";
    }
  } catch {}

  if ((process.env.GEMINI_API_KEY || "").trim().length > 0) {
    return "env";
  }

  return "none";
}

export function invalidateGeminiApiKeyCache(): void {
  cachedApiKey = null;
  lastCacheTime = 0;
}

/**
 * Masks an API key for safe display (e.g. AIzaSyB123...456 -> AIzaSy••••••••xYz9)
 */
export function maskApiKey(key: string): string {
  if (!key) return "";
  const trimmed = key.trim();
  if (trimmed.length <= 8) {
    return "••••••••" + trimmed.slice(-2);
  }
  const prefix = trimmed.slice(0, 6);
  const suffix = trimmed.slice(-4);
  return `${prefix}••••••••${suffix}`;
}

/**
 * Tests the Gemini API connection with a lightweight prompt.
 * If apiKeyToTest is passed, tests that specific key. Otherwise tests the currently saved key.
 */
export async function testGeminiApiKey(apiKeyToTest?: string): Promise<{
  success: boolean;
  latencyMs: number;
  message: string;
  error?: string;
  model: string;
}> {
  const key = apiKeyToTest ? apiKeyToTest.trim() : await getGeminiApiKey();

  if (!key) {
    return {
      success: false,
      latencyMs: 0,
      message: "لم يتم العثور على مفتاح API. يرجى إدخال المفتاح وحفظه أولاً.",
      model: "gemini-1.5-flash",
    };
  }

  const startTime = Date.now();
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
        key
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "ping" }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
      }
    );

    const latencyMs = Date.now() - startTime;

    if (response.ok) {
      return {
        success: true,
        latencyMs,
        message: "تم الاتصال بنجاح بـ Google Gemini! الذكاء الاصطناعي يعمل بكامل طاقته.",
        model: "gemini-1.5-flash",
      };
    }

    const errorBody = await response.text();
    let parsedMessage = errorBody;
    try {
      const parsed = JSON.parse(errorBody);
      parsedMessage = parsed.error?.message || errorBody;
    } catch {}

    let arabicReason = "فشل التحقق من المفتاح";
    if (response.status === 400 || parsedMessage.includes("API_KEY_INVALID")) {
      arabicReason = "مفتاح API غير صالح أو غير صحيح. يرجى التأكد من نسخه بالكامل من Google AI Studio.";
    } else if (response.status === 403 || parsedMessage.includes("PERMISSION_DENIED")) {
      arabicReason = "تم رفض الوصول: تأكد من تفعيل صلاحيات Gemini API لهذا المفتاح.";
    } else if (response.status === 429 || parsedMessage.includes("RESOURCE_EXHAUSTED")) {
      arabicReason = "تم تجاوز حد الطلبات المسموح به حالياً (Rate Limit).";
    }

    return {
      success: false,
      latencyMs,
      message: arabicReason,
      error: parsedMessage,
      model: "gemini-1.5-flash",
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      latencyMs,
      message: `تعذر الاتصال بخوادم Google: ${err.message || String(err)}`,
      error: String(err),
      model: "gemini-1.5-flash",
    };
  }
}
