import { CHARACTERS } from "../data/characters.js";
import {
  assignIdentities,
  assignIdentitiesSeeded,
  pickGroupForOccasion,
  pickGroupForOccasionSeeded,
} from "../data/namePool.js";
import { pickOccasionForCalendarDay } from "../data/occasions.js";

/** ISO date key (UTC), used for edition files and seeded procedural casts. */
export function getTodayIsoDateKey() {
  return new Date().toISOString().slice(0, 10);
}

export function buildCastForOccasion(occasion) {
  const group = pickGroupForOccasion(CHARACTERS, occasion);
  return assignIdentities(group).map((c) => ({ ...c, commitment: "unknown", lastMsg: null }));
}

function pickDailyOccasionFromDateKey(dateKey) {
  const day = parseInt(dateKey.slice(-2), 10);
  return pickOccasionForCalendarDay(day);
}

/** Same roster for a given calendar day for everyone (seeded); no DB. */
export function buildDailyFallbackCast(dateKey = getTodayIsoDateKey()) {
  const occasion = pickDailyOccasionFromDateKey(dateKey);
  const group = pickGroupForOccasionSeeded(CHARACTERS, occasion, dateKey);
  const characters = assignIdentitiesSeeded(group, dateKey).map((c) => ({
    ...c,
    commitment: "unknown",
    lastMsg: null,
  }));
  return { date: dateKey, occasion, characters, source: "local-fallback-seeded" };
}
