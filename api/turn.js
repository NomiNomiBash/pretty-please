import { buildSys } from "../src/lib/promptBuilder.js";

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Missing ANTHROPIC_API_KEY" });
    return;
  }

  try {
    const { occ, chars, mode, prompt, dates, weeksLeft, totalWeeks } = parseBody(req);
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: buildSys(occ, chars, { mode, dates, weeksLeft, totalWeeks }),
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await upstream.json();
    if (!data.content?.[0]?.text) {
      res.status(502).json({ error: data.error?.message || "Anthropic response malformed" });
      return;
    }

    const raw = data.content[0].text.replace(/```json\n?|```/g, "").trim();
    const parsed = JSON.parse(raw);
    res.status(200).json({ ...parsed, from_cache: false });
  } catch (e) {
    res.status(500).json({ error: e?.message || "turn failed" });
  }
}
