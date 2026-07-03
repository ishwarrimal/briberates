import crypto from "node:crypto";

const SALT = process.env.IP_HASH_SALT ?? "briberates-dev-salt";

export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}

/** One-way hash so we can rate-limit / dedupe without storing raw IPs. */
export function ipHash(headers: Headers): string {
  return crypto
    .createHash("sha256")
    .update(SALT + clientIp(headers))
    .digest("hex")
    .slice(0, 32);
}

/**
 * Verify a Cloudflare Turnstile token. If no secret is configured (local dev),
 * verification is skipped so the app runs with zero setup.
 */
export async function verifyTurnstile(
  token: string | undefined,
  headers: Headers,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return true; // dev / not configured
  if (!token) return false;

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  body.set("remoteip", clientIp(headers));

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body },
    );
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

// --- tiny in-memory rate limiter (best-effort; resets on restart) ---

const hits = new Map<string, number[]>();

export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    hits.set(key, arr);
    return false;
  }
  arr.push(now);
  hits.set(key, arr);
  return true;
}
