import { buildSys } from "../lib/promptBuilder.js";

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

function stripTrailingCommas(jsonLike) {
  return jsonLike.replace(/,\s*([}\]])/g, "$1");
}

function tryParseJsonCandidates(raw) {
  const candidates = [raw, stripTrailingCommas(raw)];
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // keep trying
    }
  }
  return null;
}

function parseAiJson(rawText) {
  const cleaned = rawText.replace(/```json\n?|```/g, "").trim();
  const direct = tryParseJsonCandidates(cleaned);
  if (direct) return direct;

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const sliced = cleaned.slice(start, end + 1);
    const parsed = tryParseJsonCandidates(sliced);
    if (parsed) return parsed;
  }
  throw new Error("AI response was not valid JSON");
}

export async function fetchResponses({ occ, chars, mode, dmTarget, prompt, dates, weeksLeft, totalWeeks, turnStep }) {
  if (!API_KEY) {
    throw new Error("Missing VITE_ANTHROPIC_API_KEY for client-side fallback");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: buildSys(occ, chars, { mode, dates, weeksLeft, totalWeeks, turnStep }),
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  if (!data.content) {
    throw new Error("API error: " + (data.error?.message || "unknown"));
  }
  return parseAiJson(data.content[0].text || "");
}
