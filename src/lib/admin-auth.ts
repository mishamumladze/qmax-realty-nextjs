/**
 * Admin authentication helpers — stateless HMAC-signed tokens.
 *
 * Token format: base64url(JSON payload {sub, exp}) + "." + base64url(HMAC-SHA256 signature)
 * - `exp` is epoch seconds, now + 7 days at signing time.
 *
 * IMPORTANT: This module uses ONLY the Web Crypto API (globalThis.crypto.subtle)
 * and Web encodings (btoa/atob) so it can be shared between Node.js route
 * handlers and Edge-runtime middleware/proxy files. Do NOT import node:crypto here.
 */

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Documented dev fallback secret. Set ADMIN_TOKEN_SECRET in production
 * (e.g. via environment variables) — this fallback exists so local dev
 * works out of the box.
 */
export const DEV_TOKEN_SECRET = "qmax-dev-token-secret-change-me-in-production";

/** Single administrator username. Override with ADMIN_USERNAME env var. */
export function getAdminUsername(): string {
  return process.env.ADMIN_USERNAME ?? "admin";
}

/** Single administrator password. Override with ADMIN_PASSWORD env var. */
export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "qmax-admin-2026";
}

/** HMAC signing secret. Override with ADMIN_TOKEN_SECRET env var. */
export function getTokenSecret(): string {
  return process.env.ADMIN_TOKEN_SECRET ?? DEV_TOKEN_SECRET;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getTokenSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

interface TokenPayload {
  sub: string;
  exp: number;
}

/** Sign a stateless token for the given admin username (valid for 7 days). */
export async function signToken(username: string): Promise<string> {
  const payload: TokenPayload = {
    sub: username,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };

  const payloadPart = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    await getHmacKey(),
    new TextEncoder().encode(payloadPart)
  );

  return `${payloadPart}.${toBase64Url(new Uint8Array(signature))}`;
}

/**
 * Verify a token's HMAC signature (constant-time-ish byte comparison) and
 * expiry. Returns true only for well-formed, untampered, unexpired tokens.
 */
export async function verifyToken(token: string): Promise<boolean> {
  if (typeof token !== "string") return false;

  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  const [payloadPart, signaturePart] = parts;

  // Signature check — compare recomputed HMAC against provided bytes.
  try {
    const expected = new Uint8Array(
      await globalThis.crypto.subtle.sign(
        "HMAC",
        await getHmacKey(),
        new TextEncoder().encode(payloadPart)
      )
    );
    let provided: Uint8Array;
    try {
      provided = fromBase64UrlToBytes(signaturePart);
    } catch {
      return false; // malformed base64url
    }
    if (expected.length !== provided.length) return false;

    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= (expected[i] ?? 0) ^ (provided[i] ?? 0);
    }
    if (diff !== 0) return false;
  } catch {
    return false;
  }

  // Expiry check.
  try {
    const json = atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as Partial<TokenPayload>;
    if (typeof payload.exp !== "number") return false;
    if (Math.floor(Date.now() / 1000) >= payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}

/** Exact string comparison of both credential fields against configured values. */
export function isValidCredentials(username: string, password: string): boolean {
  return username === getAdminUsername() && password === getAdminPassword();
}
