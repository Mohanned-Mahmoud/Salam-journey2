const API_BASE = "/api";

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

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

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