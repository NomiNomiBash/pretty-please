import { useEffect, useState } from "react";
import { getTodayCast } from "../api/gameApi.js";
import { buildDailyFallbackCast, getTodayIsoDateKey } from "../lib/proceduralCast.js";

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
          setCastData(buildDailyFallbackCast(getTodayIsoDateKey()));
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
