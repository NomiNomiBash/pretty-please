/**
 * Fixed-window per-key counter for serverless (best-effort).
 * Under heavy scale, different instances each keep their own map, so effective
 * limits can be looser than configured — still blocks obvious single-IP abuse.
 */

const HOUR_MS = 60 * 60 * 1000;

/** @type {Map<string, { count: number, resetAt: number }>} */
const buckets = new Map();

function pruneIfHuge(now) {
  if (buckets.size <= 15000) return;
  for (const [k, v] of buckets) {
    if (now > v.resetAt) buckets.delete(k);
  }
}

/**
 * @param {string} key unique per limiter + client (e.g. "turn:203.0.113.1")
 * @param {number} limit max events per window
 * @param {number} windowMs
 * @returns {{ allowed: true } | { allowed: false, retryAfterSec: number }}
 */
export function checkRateLimit(key, limit, windowMs = HOUR_MS) {
  const now = Date.now();
  pruneIfHuge(now);

  let b = buckets.get(key);
  if (!b || now > b.resetAt) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }

  if (b.count >= limit) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)),
    };
  }

  b.count += 1;
  return { allowed: true };
}

/**
 * Client IP for Vercel / proxies.
 * @param {import('http').IncomingMessage} req
 */
export function getClientIp(req) {
  const h = req.headers;
  const xff = h["x-forwarded-for"];
  if (typeof xff === "string") {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  if (Array.isArray(xff) && xff[0]) {
    const first = String(xff[0]).split(",")[0]?.trim();
    if (first) return first;
  }
  const vercel = h["x-vercel-forwarded-for"];
  if (typeof vercel === "string" && vercel.trim()) return vercel.split(",")[0].trim();
  if (typeof h["x-real-ip"] === "string" && h["x-real-ip"].trim()) return h["x-real-ip"].trim();
  const ra = req.socket?.remoteAddress;
  return ra && String(ra).trim() ? String(ra).trim() : "unknown";
}

export function parsePositiveInt(envVal, fallback) {
  const n = parseInt(String(envVal || ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
