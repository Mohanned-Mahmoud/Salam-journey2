const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "/api";
const DEV_FALLBACK_API_BASE = "http://localhost:3100/api";
const REQUEST_TIMEOUT_MS = 12000;

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const token = window.localStorage.getItem("auth_token");
    const expiresAt = window.localStorage.getItem("auth_token_expires");
    
    // Check if token exists and hasn't expired
    if (token && expiresAt) {
      const expirationTime = parseInt(expiresAt, 10);
      if (expirationTime > Date.now()) {
        return token;
      }
    }
    
    // Clear expired token
    window.localStorage.removeItem("auth_token");
    window.localStorage.removeItem("auth_token_expires");
    return null;
  } catch {
    return null;
  }
}

function buildApiUrl(base: string, path: string): string {
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function canUseDevFallback(): boolean {
  if (!import.meta.env.DEV) return false;
  if (typeof window === "undefined") return false;
  if (API_BASE !== "/api") return false;
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

function shouldRetryWithFallbackStatus(status: number): boolean {
  return status === 404 || status === 502 || status === 503 || status === 504;
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> ?? {}),
  };

  // Add JWT token if available
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const primaryUrl = buildApiUrl(API_BASE, path);
  const fallbackUrl = buildApiUrl(DEV_FALLBACK_API_BASE, path);
  const requestInit: RequestInit = {
    ...init,
    headers,
  };

  let response: Response;
  try {
    response = await fetchWithTimeout(primaryUrl, requestInit);
  } catch (error) {
    if (!canUseDevFallback()) {
      throw error;
    }
    response = await fetchWithTimeout(fallbackUrl, requestInit);
  }

  if (!response.ok && canUseDevFallback() && shouldRetryWithFallbackStatus(response.status)) {
    response = await fetchWithTimeout(fallbackUrl, requestInit);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error?: unknown }).error ?? `Request failed (${response.status})`)
        : `Request failed (${response.status})`;
    throw new ApiError(response.status, message, payload);
  }

  return payload as T;
}