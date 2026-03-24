/** Per playthrough key so prompts / milieu sampling differ on replay (same calendar day). */

export function newSessionVarietyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function hashStringToUint(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Fallback openers when archetype id unknown — plain, short. */
const BOOTSTRAP_OPENERS_GENERIC = [
  "So what's the plan?",
  "When works for people?",
  "Ok — what are we thinking?",
  "Right, we're all here. When?",
];

/**
 * First on-screen bubble — light fingerprint, mostly plain WhatsApp.
 * @type {Record<string, string[]>}
 */
const HOOK_OPENERS_BY_ID = {
  priya: [
    "ok so when are we thinking?",
    "hii when roughly are people free?",
    "omg ok we're doing this — what dates?",
    "tbh I need someone to name a weekend",
  ],
  tom: [
    "chat's live. what's the ask.",
    "ok. what's actually happening.",
    "so what's the plan.",
    "need a when.",
  ],
  saskia: [
    "Ok — happy to help once there's something to pin down.",
    "We're all here. I'll need dates before I can pencil anything.",
    "Could someone suggest a weekend?",
    "What are people thinking timing-wise?",
  ],
  marcus: [
    "Thread's open. When are we aiming for?",
    "Good. Rough date range?",
    "Everyone's in. What week works?",
    "I'll need a timeframe — what suits people?",
  ],
  jade: [
    "Ok what's the vibe — chill or full chaos",
    "So what kind of thing is this actually",
    "Before I say yes what's the mood lol",
    "When works? also what's the energy",
  ],
  ollie: [
    "ok I'm in — when is it",
    "yes let's go — someone say a date",
    "finally a live chat — when we thinking",
    "I'm free most weekends just tell me when",
  ],
  bex: [
    "ok I'm here",
    "hi — when though",
    "wait so when is it",
    "ok this is happening right",
  ],
  hamish: [
    "aye we're on. what's the crack then.",
    "chat works. need a when.",
    "right — someone's gotta say a day.",
    "ok so when then.",
  ],
  zara: [
    "Ok where roughly are we talking",
    "Is this central or am I trekking",
    "When works — also how far is it",
    "Someone say a date and a rough area",
  ],
  theo: [
    "In. Need to check with Ellie before I commit.",
    "I'll run it past Ellie — what week are we looking at?",
    "Ok. What's Ellie's side look like timing-wise — rough window?",
    "Hi — need to square with Ellie. When are people thinking?",
  ],
  nadia: [
    "Hey — when are people thinking?",
    "I'm in. Rough window?",
    "Ok. Weekend or weekday vibe?",
    "Present. Someone propose a date?",
  ],
  remi: [
    "Hi all — once there's a date I can help herd.",
    "Ok — can someone throw out a weekend?",
    "Happy to coordinate — what dates are we looking at?",
    "Everyone in? What works for people?",
  ],
  callum: [
    "Hey — what's the window?",
    "Ok I'm here. When roughly?",
    "Sorry if I'm slow — dates?",
    "What's the plan timing-wise?",
  ],
  ayo: [
    "I'm in — might bring a +1 ok?",
    "Ok what's the plan",
    "When works for people",
    "I'm pretty flexible — someone say when",
  ],
};

/**
 * @param {Array<{ id?: string }>} cast
 * @param {string} sessionKey
 */
export function pickBootstrapSpeaker(cast, sessionKey) {
  if (!cast?.length) return null;
  const h = hashStringToUint(`${sessionKey}:speaker`);
  return cast[h % cast.length];
}

/**
 * @param {string} sessionKey
 * @param {string} [speakerId]
 */
export function pickBootstrapOpener(sessionKey, speakerId) {
  const pool =
    speakerId && HOOK_OPENERS_BY_ID[speakerId]
      ? HOOK_OPENERS_BY_ID[speakerId]
      : BOOTSTRAP_OPENERS_GENERIC;
  const h = hashStringToUint(`${sessionKey}:opener:${speakerId || "generic"}`);
  return pool[h % pool.length];
}
