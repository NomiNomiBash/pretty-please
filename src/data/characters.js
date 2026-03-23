export const CHARACTERS = [
  { id: "priya", lastSeen: "today at 09:23", personality: "Always says 'I'm SO in!' then immediately asks five clarifying questions and says she needs to 'check with Deepak'. The eternal enthusiastic hedger — technically never actually RSVPs." },
  { id: "tom", lastSeen: "yesterday at 23:47", personality: "Blue-ticks everything instantly, replies 72 hours later. Works in tech, always 'heads down on something'. Uses 'pencil me in' as a binding legal commitment." },
  { id: "saskia", lastSeen: "3 days ago", personality: "Investment banker who has been 'absolutely slammed at work' since 2019. Never confirmed plans more than 48 hours in advance. Preferred unit of commitment: 'I'll try my best'." },
  { id: "marcus", lastSeen: "online", personality: "Needs three months' notice minimum. Keeps a physical diary. Replies promptly and sensibly, which feels deeply suspicious. Will actually show up — a statistical anomaly in this group." },
  { id: "jade", lastSeen: "today at 14:02", personality: "Asks 'what's the vibe though?' before committing to anything. Attendance entirely contingent on who else is going. Experiences FOMO and JOMO simultaneously, somehow." },
  { id: "ollie", lastSeen: "online", personality: "Says YES to everything. Triple-booked every weekend since 2022. His yes is statistically worth 0.4 of a normal yes. Heart of gold, absolute zero diary management." },
  { id: "bex", lastSeen: "today at 11:30", personality: "Confirms enthusiastically then arrives 45 minutes late. Texts 'on my way!' approximately one hour after the thing starts. Her yes is genuine. Her ETA is aspirational." },
  { id: "hamish", lastSeen: "5 days ago", personality: "Claims to be based in London. Is somehow in Edinburgh this week, and last week, and the week before. Worst response rate in the group. Replies 'aye' when he does reply. Occasionally just appears." },
  { id: "zara", lastSeen: "today at 12:45", personality: "Moved to Peckham 8 months ago and now treats anywhere north of the river like a distant foreign country requiring a visa and overnight bag. Responds with genuine grief to Zone 1 locations." },
  { id: "theo", lastSeen: "2 days ago", personality: "Replies for himself but always needs to 'check with Ellie' before committing. Ellie is never available. Nobody in the group has ever met Ellie. Theo seems fine about this." },
  { id: "nadia", lastSeen: "today at 08:02", personality: "Permanently in a wellness era. Sound baths, sober months, 'protecting her mornings', cold water therapy she won't stop mentioning. Has been in November since approximately 2021." },
  { id: "remi", lastSeen: "online", personality: "Hyper-organiser energy for everyone else's plans — suggests the venue, the time, the playlist, the dietary restrictions spreadsheet — then quietly pulls out the day before. Every time." },
  { id: "callum", lastSeen: "3 days ago", personality: "Works in TV production. Always in a shoot. Replies in voice notes that nobody listens to. Will absolutely come when the shoot wraps. The shoot never wraps. Has been in this shoot since 2023." },
  { id: "ayo", lastSeen: "today at 16:30", personality: "The connector. Knows literally everyone, beloved by all, will try to bring four people nobody else has met. Her yes means either five people showing up or complete radio silence. High variance, high reward." },
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

/** In-game weeks that must elapse before the DM ghost answers DMs. */
export const DM_IGNORE_UNTIL_WEEKS_ELAPSED = 3;

export function characterGhostingDm(dmTargetId, weeksLeft, totalWeeks, castChars) {
  const c = castChars?.find((x) => x.id === dmTargetId);
  if (!c?.ignoresDm) return false;
  const wl = weeksLeft ?? totalWeeks;
  const weeksElapsed = totalWeeks - wl;
  return weeksElapsed < DM_IGNORE_UNTIL_WEEKS_ELAPSED;
}
