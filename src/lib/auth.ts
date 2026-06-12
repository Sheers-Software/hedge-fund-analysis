// ── Auth primitives (client-side validation MVP) ─────────────────────
// Email/password hygiene for the account system. Passwords are run through
// PBKDF2 (Web Crypto) with a per-user salt before being stored — never kept
// in plaintext.
//
// ⚠️ HONESTY NOTE: this is a *client-side* auth model (credentials live in
// localStorage). PBKDF2 here prevents plaintext-at-rest and demonstrates the
// right pattern, but it is NOT a substitute for server-side auth — anything in
// the browser is reachable by the user / XSS. The production step is a managed
// auth provider (Supabase / Clerk / Auth.js) with server sessions + a Stripe
// webhook to reconcile real subscriptions. The store API below is shaped so
// that swap is mostly a drop-in.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PBKDF2_ITERATIONS = 100_000;

export function validateEmail(email: string): string | null {
  const e = email.trim().toLowerCase();
  if (!e) return "Enter your email address.";
  if (!EMAIL_RE.test(e)) return "Enter a valid email address.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Choose a password.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
    return "Password needs at least one letter and one number.";
  return null;
}

// ── hex helpers ──────────────────────────────────────────────────────
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

function getCrypto(): Crypto {
  // Browser only — these methods are invoked from client event handlers.
  if (typeof crypto === "undefined" || !crypto.subtle)
    throw new Error("Web Crypto unavailable in this environment.");
  return crypto;
}

export interface PasswordHash {
  hash: string;
  salt: string;
}

export async function hashPassword(password: string, saltHex?: string): Promise<PasswordHash> {
  const c = getCrypto();
  const enc = new TextEncoder();
  const salt = saltHex ? hexToBytes(saltHex) : c.getRandomValues(new Uint8Array(16));
  const keyMaterial = await c.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await c.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return { hash: bytesToHex(new Uint8Array(bits)), salt: bytesToHex(salt) };
}

// Constant-time-ish comparison so we don't leak via early-exit timing.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyPassword(password: string, hash: string, saltHex: string): Promise<boolean> {
  const { hash: candidate } = await hashPassword(password, saltHex);
  return safeEqual(candidate, hash);
}

/** Six-digit numeric verification code (simulated email verification). */
export function genVerificationCode(): string {
  const c = getCrypto();
  const n = c.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return String(n).padStart(6, "0");
}
