import { useEffect, useState } from "react";
import { CHARACTERS } from "../data/characters.js";
import { assignIdentities, pickGroupForOccasion } from "../data/namePool.js";
import { getTodayCast } from "../api/gameApi.js";
import { OCCASIONS } from "../data/occasions.js";

export function buildCastForOccasion(occasion) {
  const group = pickGroupForOccasion(CHARACTERS, occasion);
  return assignIdentities(group).map((c) => ({ ...c, commitment: "unknown", lastMsg: null }));
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
          const occasion = OCCASIONS[0];
          setCastData({
            date: new Date().toISOString().slice(0, 10),
            occasion,
            characters: buildCastForOccasion(occasion),
            source: "local-fallback",
          });
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
