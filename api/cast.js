import fs from "node:fs";
import path from "node:path";
import { normalizeAuthoredEdition } from "../src/lib/editionNormalize.js";
import { buildDailyFallbackCast, getTodayIsoDateKey } from "../src/lib/proceduralCast.js";
import {
  checkRateLimit,
  getClientIp,
  parsePositiveInt,
} from "../src/lib/serverRateLimit.js";

const CAST_PER_HOUR = () =>
  parsePositiveInt(process.env.RATE_LIMIT_CAST_PER_HOUR, 5);

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (process.env.RATE_LIMIT_DISABLED !== "true") {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`cast:${ip}`, CAST_PER_HOUR());
    if (!rl.allowed) {
      res.setHeader("Retry-After", String(rl.retryAfterSec));
      res.status(429).json({
        error: "Too many cast requests from this network. Try again later.",
        retryAfterSec: rl.retryAfterSec,
      });
      return;
    }
  }

  const dateKey = getTodayIsoDateKey();
  const editionPath = path.join(process.cwd(), "editions", `${dateKey}.json`);

  if (fs.existsSync(editionPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(editionPath, "utf8"));
      const norm = normalizeAuthoredEdition(raw, dateKey);
      if (norm) {
        res.status(200).json({ ...norm, source: "authored" });
        return;
      }
    } catch (err) {
      console.error("[api/cast] edition read failed", editionPath, err);
    }
  }

  const proc = buildDailyFallbackCast(dateKey);
  res.status(200).json({ ...proc, source: "api" });
}
