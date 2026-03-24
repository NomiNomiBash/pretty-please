export const CHARACTERS = [
  { id: "priya", chart: "☀️♋ ♀️♌", lastSeen: "today at 09:23", personality: "☀️ Cancer · ♀️ Leo: warm Sun, theatrical Venus — 'I'm SO in!' is Venus in Leo performing; the hedge is Cancer." },
  { id: "tom", chart: "☀️♏ ♀️♑", lastSeen: "yesterday at 23:47", personality: "☀️ Scorpio · ♀️ Capricorn: withholding Sun, minimal Venus; 'pencil me in' is full Venus in Capricorn." },
  { id: "saskia", chart: "☀️♑ ♀️♍", lastSeen: "3 days ago", personality: "☀️ Cap · ♀️ Virgo: double earth — 'I'll try my best' is Virgo Venus hedging through precision." },
  { id: "marcus", chart: "☀️♑ ♀️♉", lastSeen: "online", personality: "☀️ Cap · ♀️ Taurus: double earth, warm — Venus in Taurus shows up sensibly; only person whose Venus matches the behaviour." },
  { id: "jade", chart: "☀️♎ ♀️♊", lastSeen: "today at 14:02", personality: "☀️ Libra · ♀️ Gemini: indecisive Sun, airy Venus — questions instead of answers; 'what's the vibe' is Gemini deflection as engagement." },
  { id: "ollie", chart: "☀️♊ ♀️♈", lastSeen: "online", personality: "☀️ Gemini · ♀️ Aries: instant yes, zero filter; triple-booking is Gemini, the YES!!! is Aries Venus." },
  { id: "bex", chart: "☀️♉ ♀️♓", lastSeen: "today at 11:30", personality: "☀️ Taurus · ♀️ Pisces: means it fully, structurally can't execute — 'on my way!' felt in the moment; Pisces Venus lives in intention." },
  { id: "hamish", chart: "☀️♐ ♀️♐", lastSeen: "5 days ago", personality: "☀️ Sag · ♀️ Sag: double Sag — freedom all the way down; 'aye' isn't cold, he just doesn't need more words." },
  { id: "zara", chart: "☀️♈ ♀️♏", lastSeen: "today at 12:45", personality: "☀️ Aries · ♀️ Scorpio: territorial Sun, intense Venus — zone loyalty is real feeling, not a bit." },
  { id: "theo", chart: "☀️♏ ♀️♋", lastSeen: "2 days ago", personality: "☀️ Scorpio · ♀️ Cancer: private Sun, protective Venus — Ellie is the domestic fortress / boundary." },
  { id: "nadia", chart: "☀️♒ ♀️♒", lastSeen: "today at 08:02", personality: "☀️ Aqua · ♀️ Aqua: double Aquarius — friendly remove; wellness is genuinely how she connects." },
  { id: "remi", chart: "☀️♍ ♀️♎", lastSeen: "online", personality: "☀️ Virgo · ♀️ Libra: organises to please everyone; ghosts when delivery pressure spikes." },
  { id: "callum", chart: "☀️♓ ♀️♌", lastSeen: "3 days ago", personality: "☀️ Pisces · ♀️ Leo: absent Sun, big Venus — rare messages are warm and huge; performance and shoot both real." },
  { id: "ayo", chart: "☀️♌ ♀️♐", lastSeen: "today at 16:30", personality: "☀️ Leo · ♀️ Sag: expansive + freedom — plus-ones are generous possibility, not chaos for its own sake." },
];

/** Archetypes eligible to be this game's sole "DM ghost" (exactly one per run). */
export const DM_GHOST_ELIGIBLE_IDS = new Set(["tom", "saskia", "hamish", "callum"]);

function hashString(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Picks exactly one character in `characters` to carry ignoresDm for this game.
 * Others get ignoresDm: false. If no eligible id is in the cast, everyone is false.
 */
export function assignSingleDmGhost(characters, seedKey) {
  const eligible = characters.filter((c) => DM_GHOST_ELIGIBLE_IDS.has(c.id));
  if (eligible.length === 0) {
    return characters.map((c) => ({ ...c, ignoresDm: false }));
  }
  const idx = hashString(`${seedKey}:dm-ghost`) % eligible.length;
  const pickedId = eligible[idx].id;
  return characters.map((c) => ({ ...c, ignoresDm: c.id === pickedId }));
}

/** In-game weeks that must elapse before the DM ghost answers DMs (tuned for 4-week runs). */
export const DM_IGNORE_UNTIL_WEEKS_ELAPSED = 2;

export function characterGhostingDm(dmTargetId, weeksLeft, totalWeeks, castChars) {
  const c = castChars?.find((x) => x.id === dmTargetId);
  if (!c?.ignoresDm) return false;
  const wl = weeksLeft ?? totalWeeks;
  const weeksElapsed = totalWeeks - wl;
  return weeksElapsed < DM_IGNORE_UNTIL_WEEKS_ELAPSED;
}
