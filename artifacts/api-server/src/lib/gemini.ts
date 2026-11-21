import { db, siteSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

let cachedApiKey: string | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 30000;

let cachedActiveModel: string | null = null;
let lastModelDiscoveryTime = 0;
const MODEL_CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour cache

export const FALLBACK_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash",
  "gemini-pro",
];

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
  cachedActiveModel = null;
  lastModelDiscoveryTime = 0;
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
 * Dynamically queries the Google AI Models API to find the optimal active Flash model for this key.
 */
export async function getActiveGeminiModel(apiKey: string): Promise<string> {
  const now = Date.now();
  if (cachedActiveModel && now - lastModelDiscoveryTime < MODEL_CACHE_TTL_MS) {
    return cachedActiveModel;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
    );

    if (response.ok) {
      const data = (await response.json()) as { models?: Array<{ name: string; supportedGenerationMethods?: string[] }> };
      const models = data.models || [];

      const contentModels = models
        .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m) => m.name.replace(/^models\//, ""));

      if (contentModels.length > 0) {
        const priorityPatterns = [
          /2\.5-flash/i,
          /2\.0-flash/i,
          /flash-latest/i,
          /1\.5-flash-latest/i,
          /1\.5-flash/i,
          /flash/i,
          /pro/i,
        ];

        for (const pattern of priorityPatterns) {
          const matched = contentModels.find((name) => pattern.test(name));
          if (matched) {
            cachedActiveModel = matched;
            lastModelDiscoveryTime = now;
            return matched;
          }
        }

        cachedActiveModel = contentModels[0];
        lastModelDiscoveryTime = now;
        return cachedActiveModel;
      }
    }
  } catch (err) {
    console.warn("Failed to auto-discover Gemini models, using default:", err);
  }

  return FALLBACK_MODELS[0];
}

/**
 * Tests connection with Google Gemini API by:
 * 1. Querying supported models list for this key
 * 2. Testing generateContent with the best available model
 * 3. Falling back across supported generations if one is deprecated
 */
export async function testGeminiApiKey(apiKeyToTest?: string): Promise<{
  success: boolean;
  latencyMs: number;
  message: string;
  error?: string;
  model: string;
  availableModels?: string[];
}> {
  const key = apiKeyToTest ? apiKeyToTest.trim() : await getGeminiApiKey();

  if (!key) {
    return {
      success: false,
      latencyMs: 0,
      message: "لم يتم العثور على مفتاح API. يرجى إدخال المفتاح وحفظه أولاً.",
      model: "none",
    };
  }

  let preferredModel = FALLBACK_MODELS[0];
  let availableModelsList: string[] = [];

  // Step 1: Discover models available to this specific key
  try {
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`
    );

    if (listRes.ok) {
      const listData = (await listRes.json()) as any;
      const models = listData.models || [];
      availableModelsList = models
        .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m: any) => m.name.replace(/^models\//, ""));

      if (availableModelsList.length > 0) {
        const priorityPatterns = [
          /2\.5-flash/i,
          /2\.0-flash/i,
          /flash-latest/i,
          /1\.5-flash-latest/i,
          /1\.5-flash/i,
          /flash/i,
          /pro/i,
        ];

        for (const pat of priorityPatterns) {
          const match = availableModelsList.find((m) => pat.test(m));
          if (match) {
            preferredModel = match;
            break;
          }
        }
      }
    }
  } catch {}

  const startTime = Date.now();

  // Step 2: Try preferred model, then remaining fallbacks if needed
  const candidateModels = [
    preferredModel,
    ...FALLBACK_MODELS.filter((m) => m !== preferredModel),
  ];

  let lastErrorText = "";
  let lastStatus = 0;

  for (const modelCandidate of candidateModels) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelCandidate}:generateContent?key=${encodeURIComponent(
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
        cachedActiveModel = modelCandidate;
        lastModelDiscoveryTime = Date.now();

        return {
          success: true,
          latencyMs,
          message: `تم الاتصال بنجاح بـ Google Gemini! النموذج النشط: ${modelCandidate}`,
          model: modelCandidate,
          availableModels: availableModelsList.slice(0, 6),
        };
      }

      lastStatus = response.status;
      lastErrorText = await response.text();

      // If invalid key error, stop trying other models
      if (lastStatus === 400 && lastErrorText.includes("API_KEY_INVALID")) {
        break;
      }
    } catch (err: any) {
      lastErrorText = String(err);
    }
  }

  const latencyMs = Date.now() - startTime;
  let parsedMessage = lastErrorText;
  try {
    const parsed = JSON.parse(lastErrorText);
    parsedMessage = parsed.error?.message || lastErrorText;
  } catch {}

  let arabicReason = "فشل التحقق من المفتاح";
  if (lastStatus === 400 && parsedMessage.includes("API_KEY_INVALID")) {
    arabicReason = "مفتاح API غير صالح أو غير صحيح. تأكد من نسخه بالكامل من Google AI Studio.";
  } else if (lastStatus === 403 || parsedMessage.includes("PERMISSION_DENIED")) {
    arabicReason = "تم رفض الوصول (403): تأكد من تفعيل صلاحيات Gemini API لهذا المفتاح.";
  } else if (lastStatus === 429 || parsedMessage.includes("RESOURCE_EXHAUSTED")) {
    arabicReason = "تم تجاوز حد الطلبات المسموح به حالياً (Rate Limit).";
  } else if (lastStatus === 404) {
    arabicReason = "الموديل غير متاح لهذا المفتاح، تأكد من إنشاء المفتاح من Google AI Studio.";
  }

  return {
    success: false,
    latencyMs,
    message: arabicReason,
    error: parsedMessage,
    model: preferredModel,
    availableModels: availableModelsList,
  };
}
