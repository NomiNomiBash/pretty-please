import { buildSys } from "../lib/promptBuilder.js";

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

export async function fetchResponses({ occ, chars, mode, dmTarget, prompt, dates }) {
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
      system: buildSys(occ, chars),
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  if (!data.content) {
    throw new Error("API error: " + (data.error?.message || "unknown"));
  }
  const raw = data.content[0].text.replace(/```json\n?|```/g, "").trim();
  return JSON.parse(raw);
}
