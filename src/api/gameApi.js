import { fetchResponses } from "./anthropic.js";
import { OCCASIONS } from "../data/occasions.js";
import { buildCastForOccasion } from "../hooks/useCast.js";

const USE_API_ROUTES = !import.meta.env.DEV || import.meta.env.VITE_USE_API_ROUTES === "true";

function pickTodayOccasion() {
  const day = new Date().getDate();
  return OCCASIONS[day % OCCASIONS.length];
}

export async function getTodayCast() {
  if (!USE_API_ROUTES) {
    const occasion = pickTodayOccasion();
    return {
      date: new Date().toISOString().slice(0, 10),
      occasion,
      characters: buildCastForOccasion(occasion),
      source: "local-fallback",
    };
  }
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

export async function sendTurn({ occ, chars, mode, dmTarget, prompt, dates, weeksLeft, totalWeeks }) {
  if (!USE_API_ROUTES) {
    return fetchResponses({ occ, chars, mode, dmTarget, prompt, dates, weeksLeft, totalWeeks });
  }
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch("/api/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occ, chars, mode, dmTarget, prompt, dates, weeksLeft, totalWeeks }),
      });
      if (res.ok) return await res.json();
      if (attempt === 1) throw new Error(`turn endpoint failed: ${res.status}`);
      await new Promise((r) => setTimeout(r, 250));
    }
  } catch (apiErr) {
    try {
      return await fetchResponses({ occ, chars, mode, dmTarget, prompt, dates, weeksLeft, totalWeeks });
    } catch (fallbackErr) {
      throw new Error(`Turn failed (${apiErr?.message || "api"} / ${fallbackErr?.message || "fallback"})`);
    }
  }
}

export async function postResult(payload) {
  if (!USE_API_ROUTES) {
    return { ok: true, source: "local-fallback" };
  }
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

export async function fetchPlaceSuggestions(input) {
  const q = String(input || "").trim();
  if (!q) return [];
  try {
    if (!USE_API_ROUTES) throw new Error("api routes disabled in dev");
    const res = await fetch(`/api/places?input=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error(`places endpoint failed: ${res.status}`);
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error("places endpoint returned non-JSON");
    }
    const data = await res.json();
    return Array.isArray(data.predictions) ? data.predictions : [];
  } catch {
    const key = import.meta.env.VITE_GEOAPIFY_API_KEY;
    if (!key) return [];
    try {
      const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
      url.searchParams.set("text", q);
      url.searchParams.set("apiKey", key);
      url.searchParams.set("filter", "countrycode:gb");
      url.searchParams.set("type", "amenity");
      url.searchParams.set("limit", "5");
      const res = await fetch(url.toString());
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data?.features)
        ? data.features
            .slice(0, 5)
            .map((f) => ({
              description: f?.properties?.formatted || f?.properties?.address_line1 || "",
              placeId: f?.properties?.place_id || f?.properties?.datasource?.raw?.osm_id || "",
            }))
            .filter((p) => p.description)
        : [];
    } catch {
      return [];
    }
  }
}
