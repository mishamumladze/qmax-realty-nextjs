// Throwaway round-trip verification for src/lib/admin-auth.ts logic.
// tsx/ts-node are NOT available in this project, so this script REPLICATES the
// exact verifyToken algorithm inline in plain JS (Node >= 18 has Web Crypto,
// atob/btoa globals — same primitives the Edge runtime provides).
// It proves: the token issued by POST /api/admin/credentials passes verification,
// while tampered / expired / garbage tokens are rejected.
import { readFileSync } from "node:fs";

const DEV_SECRET = "qmax-dev-token-secret-change-me-in-production"; // same as DEV_TOKEN_SECRET fallback
const enc = new TextEncoder();

function b64urlToBytes(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function hmacSign(payloadPart) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(DEV_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(payloadPart)));
}

function constantTimeEq(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// Mirror of verifyToken() in src/lib/admin-auth.ts
async function verifyToken(token) {
  if (typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  const [payloadPart, signaturePart] = parts;

  let expected, provided;
  try {
    expected = await hmacSign(payloadPart);
    provided = b64urlToBytes(signaturePart);
  } catch {
    return false;
  }
  if (!constantTimeEq(expected, provided)) return false;

  try {
    const json = atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json);
    if (typeof payload.exp !== "number") return false;
    if (Math.floor(Date.now() / 1000) >= payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}

// Mirror of signToken() — used ONLY here to craft an expired-token fixture.
async function craftToken(sub, exp) {
  const payloadPart = Buffer.from(JSON.stringify({ sub, exp })).toString("base64url");
  const sig = await hmacSign(payloadPart);
  return `${payloadPart}.${Buffer.from(sig).toString("base64url")}`;
}

function mask(t) {
  return typeof t === "string" && t.length > 14 ? `${t.slice(0, 10)}...<masked>` : String(t);
}

let failures = 0;
async function check(name, actual, expected) {
  const pass = actual === expected;
  if (!pass) failures++;
  console.log(`${pass ? "PASS" : "FAIL"} | ${name} | verifyToken=${actual} expected=${expected}`);
}

const token = readFileSync(new URL("./tmp-token.txt", import.meta.url), "utf8").trim();
console.log(`Loaded live-server token: ${mask(token)} (length ${token.length})`);

// 1. Untampered token from the real 200 response must verify.
await check("valid token from live server", await verifyToken(token), true);

// 2. Tampered signature (flip last base64url char).
const badSigTail = token.slice(-1);
const flippedSig = token.slice(0, -1) + (badSigTail === "A" ? "B" : "A");
await check("tampered signature rejected", await verifyToken(flippedSig), false);

// 3. Tampered payload (sub changed to attacker, original signature kept).
const [p, s] = token.split(".");
const hackedPayload = Buffer.from(
  JSON.stringify({ sub: "hacker", exp: Math.floor(Date.now() / 1000) + 3600 })
).toString("base64url");
await check(
  "tampered payload (sub=hacker) rejected",
  await verifyToken(`${hackedPayload}.${s}`),
  false
);

// 4. Correctly signed but EXPIRED token must be rejected by expiry check.
const expired = await craftToken("admin", Math.floor(Date.now() / 1000) - 10);
await check("expired token rejected", await verifyToken(expired), false);

// 5. Garbage input.
await check("garbage string rejected", await verifyToken("not-a-token"), false);

console.log(
  failures === 0
    ? "ROUNDTRIP RESULT: ALL CHECKS PASSED"
    : `ROUNDTRIP RESULT: ${failures} CHECK(S) FAILED`
);
process.exit(failures === 0 ? 0 : 1);
