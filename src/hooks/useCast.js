import { useEffect, useState } from "react";
import { CHARACTERS } from "../data/characters.js";
import {
  assignIdentities,
  assignIdentitiesSeeded,
  pickGroupForOccasion,
  pickGroupForOccasionSeeded,
} from "../data/namePool.js";
import { getTodayCast } from "../api/gameApi.js";
import { pickOccasionForCalendarDay } from "../data/occasions.js";

export function buildCastForOccasion(occasion) {
  const group = pickGroupForOccasion(CHARACTERS, occasion);
  return assignIdentities(group).map((c) => ({ ...c, commitment: "unknown", lastMsg: null }));
}

function getTodayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function pickDailyOccasion(dateKey) {
  const day = parseInt(dateKey.slice(-2), 10);
  return pickOccasionForCalendarDay(day);
}

export function buildDailyFallbackCast(dateKey = getTodayDateKey()) {
  const occasion = pickDailyOccasion(dateKey);
  const group = pickGroupForOccasionSeeded(CHARACTERS, occasion, dateKey);
  const characters = assignIdentitiesSeeded(group, dateKey).map((c) => ({
    ...c,
    commitment: "unknown",
    lastMsg: null,
  }));
  return { date: dateKey, occasion, characters, source: "local-fallback-seeded" };
}

export function useCast() {
  const [castData, setCastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getTodayCast();
        if (alive) setCastData(data);
      } catch (e) {
        if (alive) {
          setError(e);
          setCastData(buildDailyFallbackCast());
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return { castData, loading, error };
}
