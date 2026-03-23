import { fetchResponses } from "./anthropic.js";
import { OCCASIONS } from "../data/occasions.js";
import { buildCastForOccasion } from "../hooks/useCast.js";

function pickTodayOccasion() {
  const day = new Date().getDate();
  return OCCASIONS[day % OCCASIONS.length];
}

export async function getTodayCast() {
  try {
    const res = await fetch("/api/cast");
    if (!res.ok) throw new Error(`cast endpoint failed: ${res.status}`);
    return await res.json();
  } catch {
    const occasion = pickTodayOccasion();
    return {
      date: new Date().toISOString().slice(0, 10),
      occasion,
      characters: buildCastForOccasion(occasion),
      source: "local-fallback",
    };
  }
}

export async function sendTurn({ occ, chars, mode, dmTarget, prompt, dates }) {
  try {
    const res = await fetch("/api/turn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ occ, chars, mode, dmTarget, prompt, dates }),
    });
    if (!res.ok) throw new Error(`turn endpoint failed: ${res.status}`);
    return await res.json();
  } catch {
    return fetchResponses({ occ, chars, mode, dmTarget, prompt, dates });
  }
}

export async function postResult(payload) {
  try {
    const res = await fetch("/api/result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`result endpoint failed: ${res.status}`);
    return await res.json();
  } catch {
    return { ok: true, source: "local-fallback" };
  }
}
