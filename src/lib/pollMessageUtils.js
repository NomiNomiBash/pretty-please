/**
 * Poll bubbles store votes as { [dateLabel: string]: string[] } (display names).
 */

/** @param {Array<{ isPoll?: boolean, votes?: Record<string, string[]> }>} msgs */
export function getLatestPollOptionStrings(msgs) {
  if (!Array.isArray(msgs)) return [];
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    if (m?.isPoll && m.votes && typeof m.votes === "object") {
      return Object.keys(m.votes);
    }
  }
  return [];
}

/**
 * @param {Array<{ isPoll?: boolean, votes?: Record<string, string[]> }>} msgs
 * @param {string} characterName
 * @param {{ allDates?: boolean, dateKeys?: string[] }} opts
 */
export function removeCharacterFromPollVotes(msgs, characterName, opts = {}) {
  if (!characterName || !Array.isArray(msgs)) return msgs;
  const { allDates = false, dateKeys = [] } = opts;
  return msgs.map((m) => {
    if (!m.isPoll || !m.votes || typeof m.votes !== "object") return m;
    const v = { ...m.votes };
    let changed = false;
    const keys = allDates ? Object.keys(v) : dateKeys.filter((d) => Object.prototype.hasOwnProperty.call(v, d));
    for (const d of keys) {
      const arr = v[d];
      if (!Array.isArray(arr)) continue;
      const next = arr.filter((n) => n !== characterName);
      if (next.length !== arr.length) changed = true;
      v[d] = next;
    }
    return changed ? { ...m, votes: v } : m;
  });
}
