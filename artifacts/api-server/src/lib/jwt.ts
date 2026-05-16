import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d"; // 7 days

interface TokenPayload {
  sub: string; // subject (user ID)
  iat?: number; // issued at
  exp?: number; // expiration time
}

/**
 * Creates an access token with the given payload.
 * @param payload The payload to encode in the token
 * @returns A signed JWT token
 */
export function createAccessToken(payload: TokenPayload): string {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds

  const tokenPayload: TokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
  };

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(tokenPayload));

  const signature = generateSignature(`${headerEncoded}.${payloadEncoded}`, JWT_SECRET);

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

/**
 * Verifies and decodes a JWT token.
 * @param token The token to verify
 * @returns The decoded payload if valid, null otherwise
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const [headerEncoded, payloadEncoded, signatureProvided] = parts;

    // Verify signature
    const expectedSignature = generateSignature(`${headerEncoded}.${payloadEncoded}`, JWT_SECRET);
    if (signatureProvided !== expectedSignature) {
      return null;
    }

    // Decode payload
    const payload = JSON.parse(base64UrlDecode(payloadEncoded)) as TokenPayload;

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Base64 URL encode a string
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Base64 URL decode a string
 */
function base64UrlDecode(str: string): string {
  let input = str.replace(/-/g, "+").replace(/_/g, "/");
  while (input.length % 4) {
    input += "=";
  }
  return Buffer.from(input, "base64").toString();
}

/**
 * Generate HMAC SHA-256 signature
 */
function generateSignature(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}
