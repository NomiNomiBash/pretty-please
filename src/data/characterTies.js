/**
 * Preferred inner-circle ids per archetype (personality-shaped).
 * Used to seed who tends to @ whom — actual picks are filtered to who's in this game's cast.
 */
export const TIE_PREFERENCES = {
  priya: ["bex", "ollie", "jade", "marcus"],
  tom: ["hamish", "marcus", "callum"],
  saskia: ["remi", "marcus", "tom"],
  marcus: ["priya", "remi", "tom"],
  jade: ["bex", "zara", "nadia"],
  ollie: ["bex", "callum", "ayo"],
  bex: ["priya", "jade", "ollie"],
  hamish: ["callum", "tom", "ollie"],
  zara: ["jade", "marcus", "bex"],
  theo: ["marcus", "tom", "bex"],
  nadia: ["jade", "remi", "priya"],
  remi: ["marcus", "callum", "saskia"],
  callum: ["ollie", "hamish", "remi"],
  ayo: ["bex", "ollie", "priya"],
};

function hashString(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {Array<{ id: string, name: string }>} characters
 * @param {string} seedKey
 * @param {Array<{ closeWith?: string[] }> | null} rawRows optional edition overrides per row (same order as characters)
 * @returns {Array<Record<string, unknown> & { closeWith: { id: string, name: string }[] }>}
 */
export function attachCloseTies(characters, seedKey, rawRows = null) {
  if (!characters?.length) return characters;

  const byId = Object.fromEntries(characters.map((c) => [c.id, c]));
  const idSet = new Set(characters.map((c) => c.id));

  return characters.map((c, idx) => {
    if (Array.isArray(c.closeWith) && c.closeWith.length > 0 && c.closeWith.every((x) => x && x.id && x.name)) {
      return c;
    }

    const rawClose = rawRows?.[idx]?.closeWith;
    if (Array.isArray(rawClose) && rawClose.length > 0) {
      const ids = rawClose
        .map((x) => String(x).trim())
        .filter((id) => id && id !== c.id && idSet.has(id));
      if (ids.length > 0) {
        return {
          ...c,
          closeWith: ids.slice(0, 2).map((id) => ({ id, name: byId[id].name })),
        };
      }
    }

    const prefs = TIE_PREFERENCES[c.id] ?? [];
    let picks = prefs.filter((id) => id !== c.id && idSet.has(id)).slice(0, 2);

    if (picks.length < 2) {
      const pool = characters.map((x) => x.id).filter((id) => id !== c.id && !picks.includes(id));
      const rand = mulberry32(hashString(`${seedKey}:ties:${c.id}`));
      const a = [...pool];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      for (const id of a) {
        if (picks.length >= 2) break;
        picks.push(id);
      }
    }

    return {
      ...c,
      closeWith: picks.slice(0, 2).map((id) => ({ id, name: byId[id].name })),
    };
  });
}
