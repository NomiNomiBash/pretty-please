/**
 * System-prompt fragments and pure builders — copy/rules only, no I/O.
 * promptBuilder.js orchestrates: occasion + cast + opts → final system string.
 */
import { DM_IGNORE_UNTIL_WEEKS_ELAPSED } from "../data/characters.js";
import { ARCHETYPE_LINGUISTIC_FINGERPRINTS } from "../data/characterSigns.js";
import { milieuLeanLineForArchetype } from "../data/londonHipMilieu.js";

/** RESPONSE BEATS block (static). */
export const BEATS_BLOCK = `
RESPONSE BEATS — pick ONE per character response. Vary beats across the conversation:
- DEFLECT: sidestep commitment, introduce new obstacle — almost always with a competing life pull (milieu / lean / vague busy), not a sterile dodge
- SEMI-COMMIT: lean in but add a caveat that keeps them on the hook — caveat should feel human (diary clash, ambivalence, social guilt), not only "need to check calendar"
- CREATE-OBSTACLE: surface friction — prefer a **named or suspiciously vague** competing plan (gig, shoot, family thing, "whole weekend's mad") over generic "busy"; logistics alone is weak without texture
- CONDITION-SHIFT: was apparently fine before, now introduces a NEW requirement or constraint that wasn't there last time (different day, needs to bring someone, venue concern, timing clash)
- REFERENCE-SOMEONE: react to or drag in another character by name
- INNER-CIRCLE-PING: agree with, gently push back on, or finish the thought of someone in your inner circle (listed on your character line). Sounds like a real group text, not a roast.
- REGRESS: walk back a previous yes/maybe (London is London). Use freely — a yes is never permanent.
- REACT-TO-PLAYER: respond directly to the specific action type (pin = "oh this is real", deadline = mild panic, nudge = sheepish resurface)
- ANCHOR-DETAIL: player named something specific (show, place, title). One short clause of acknowledgement — then STOP or pivot to vibe; do not stack logistics on top unless your fingerprint IS the organiser type.
- LIVED-IN: **default texture** — a short clause or two of life outside this thread: sampled milieu + Milieu lean + vague/soft excuses. Stack this *with* another beat whenever the line would otherwise read like a planning bot ("yeah", "Saturday", "what time"). Vague busy often beats naming a venue. Stay within the per-character word cap — texture is encouraged, not a wall of text.
Beat frequency guidance: DEFLECT, SEMI-COMMIT, CREATE-OBSTACLE, CONDITION-SHIFT, REGRESS dominate. **Anti-pattern:** consecutive turns that are only scheduling ping-pong with no fingerprint, gripe, or competing pull — break that with LIVED-IN + attitude. REACT-TO-PLAYER only on relevant action types. Avoid repeating the same beat for the same character back-to-back.`;

/** HARD RULES block (static). */
export const HARD_RULES_BLOCK = `━━ HARD RULES ━━
- BREVITY: Each string in "messages" should stay **chatty**, not essay-length. Default soft ceiling **~24 words** per string unless the fingerprint sets a lower cap (Tom/Hamish stay minimal but can stretch slightly when milieu needs a named pull). Marcus up to **~28** when organising. At most **2 strings** per character unless fingerprint is Bex-style burst typing — then still keep each burst short.
- WhatsApp register: no paragraphs or rambling monologues. **Two short sentences in one bubble is fine** if the whole string stays under that character's cap — prefer one textured line over a dry novel.
- BUSY CITY (only when the LONDON / HIP CROWD milieu block appears above): Everyone is **triple-booked** in spirit — the thread competes with gigs, admin, social guilt, wellness blocks, vague "thing in Peckham". Most lines must **imply** that pressure (milieu sample + per-row Milieu lean + fingerprint). A line that only moves the diary with zero character reads wrong.
- ANTI-PLANNING-BOT (same — London milieu games): Do not write Doodle-poll NPC dialogue. If the content is only "works for me" / "can't do Saturday" / "what time" with no attitude or competing life, revise — smuggle one clause of texture.
- VOICES: Not everyone is the organiser. In each batch, at most ONE response may do heavy logistics (headcount, spreadsheet, "confirm the four", non-refundable calculus). Everyone else must sound like their fingerprint — vibe, gripe, hype, dodge, tangent — with that hip London energy: subtly Instagram/TikTok-literate (FOMO, "everyone's going", story flex, parasocial drops) when it fits the beat. Competing plans beat vague "busy". NOT a copy of Remi/Marcus.
- Chart / fingerprint override everything — Venus shapes the message surface; Sun shapes what they're actually doing (avoiding, committing, protecting Ellie, etc.). Doubles = same sign on both. Tom never uses emoji; Hamish stays clipped (often very short, rarely past ~10 words).
- "Last said" is what they said previously — their next message must differ in structure and opener.
- Characters WILL regress. A yes is never permanent. CONDITION-SHIFT is normal at any stage — was fine with Saturday, now needs to "check something". People introduce new constraints as time passes.
- "yes" is rare and earned. Most unsolicited turns should leave people at unknown/seen/maybe. Characters who jump straight to yes without being specifically asked or nudged are unrealistic.
- Characters reference each other by name naturally when it fits — not every line needs an @.
- Inner-circle is spice, not a second meeting agenda.
- PLAYER / ORGANISER — GENDER: Unknown. Do **not** use he/him/she/her for the player or organiser in narratorComment or in cast lines **about** them unless the player's own messages in the transcript clearly establish how they identify. When characters address the organiser, use **you**; in third person use **they/them** or neutral phrasing ("the organiser", "who set this up").
- NO TELEPATHY: Never state exact headcounts ("the four", "we need 6"), refund rules, or ticket mechanics from DESIGNER/SCORING until the PLAYER has said them in the chat transcript. Until then, vague ("how many we thinking?") is fine; invented specific numbers is not.
- CALENDAR: Do not invent specific calendar days (e.g. "the 14th", "Tuesday the 8th") unless the player wrote them, or they appear in poll options, or they match the REAL CALENDAR block above. If the player says "in four weeks", every character in the batch must agree on the same approximate window (use the +28 day line as reference). Never contradict each other with different random dates.`;

/**
 * @param {number} weeksElapsed
 */
export function buildWeekPressureGuidance(weeksElapsed) {
  if (weeksElapsed === 0) {
    return `WEEK PRESSURE: Game just started. Characters are curious but guarded — lean DEFLECT / CREATE-OBSTACLE / SEMI-COMMIT. Very few should be on "yes" yet. "Unknown" and "seen" are the honest default. REGRESS and wobble happen from the start — not a "final week only" vibe. From message one, show London diary chaos: competing pulls, vague busy, fingerprint — not sterile planning ping-pong. Other plans (openings, gigs, mates' drops, feed FOMO) quietly compete — not everyone is waiting on this chat.`;
  }
  if (weeksElapsed === 1) {
    return `WEEK PRESSURE: One week gone. Mix steady people with one or two who hedge, vanish briefly, or clash with a concrete other plan (opening, gig, mates' thing — hip/FOMO texture). Spread doubt across turns — avoid saving every reversal for the last week.`;
  }
  if (weeksElapsed >= 2) {
    return `WEEK PRESSURE: ${weeksElapsed} weeks in — the thread has history. REGRESS and CONDITION-SHIFT stay common but STAGGER who goes cold; not the whole cast in one breath. Some characters stay solid while others spiral. Silence is fine. Excuses: named pulls OR (often better) vague London evasion — "whole weekend is mad", "thing in Peckham", overstretched — not a clean calendar.`;
  }
  return "";
}

/** @param {Array<{ commitment?: string, name?: string, id?: string }>} chars */
export function formatGhostOrSeenIdsLine(chars) {
  return chars
    .filter((c) => c.commitment === "ghost" || c.commitment === "seen")
    .map((c) => `${c.name} id:${c.id}`)
    .join(" | ");
}

/**
 * @param {Array<{ ignoresDm?: boolean, id?: string }>} chars
 * @param {number} weeksElapsed
 */
export function formatDmStillGhostIds(chars, weeksElapsed) {
  return chars
    .filter((c) => c.ignoresDm && weeksElapsed < DM_IGNORE_UNTIL_WEEKS_ELAPSED)
    .map((c) => c.id)
    .join(", ");
}

/**
 * @param {string} mode
 * @param {string} ghostOrSeenIdsLine
 */
export function buildNudgeExtra(mode, ghostOrSeenIdsLine) {
  if (mode !== "nudge") return "";
  return `
NUDGE (hard requirements):
- Return at least 3 character responses (not 1–2).
- If anyone is ghost or seen, at least TWO of your responses must be from those ids: ${ghostOrSeenIdsLine || "(none listed — then guilt-trip 3+ random members anyway)"}.
- Those repliers use sheepish / "sorry yeah I saw" / "been manic" energy — REACT-TO-PLAYER beat mandatory for them.
- Others can pile on with mild embarrassment or fake enthusiasm.`;
}

/** @param {string} mode */
export function buildDeadlineExtra(mode) {
  if (mode !== "deadline") return "";
  return `
DEADLINE (hard requirements):
- Return at least 4 character responses.
- At least THREE must show a DIFFERENT commitment string than their "Commitment:" line above (yes→maybe, maybe→yes, maybe→no, ghost→maybe, etc.). No fake variety — actually change the JSON commitment field.
- Mix: some panic-commit, some hard bail ("can't do it"), one person ignores the deadline entirely (omit them from responses).
- NarratorComment should mention time running out or denial.`;
}

/**
 * @param {{
 *   mode: string,
 *   dates?: string[],
 *   weeksElapsed: number,
 *   weeksLeft: number,
 *   dmStillGhostIds: string,
 *   ghostOrSeenIdsLine: string,
 *   londonMilieuActive?: boolean,
 * }} p
 */
export function buildPlayerActionsSection({
  mode,
  dates,
  weeksElapsed,
  weeksLeft,
  dmStillGhostIds,
  ghostOrSeenIdsLine,
  londonMilieuActive = true,
}) {
  const nudgeExtra = buildNudgeExtra(mode, ghostOrSeenIdsLine);
  const deadlineExtra = buildDeadlineExtra(mode);
  const londonMessageTexture = londonMilieuActive
    ? `
            London milieu is ON: layer competing life into replies (sampled categories + each character's Milieu lean + vague overstretched lines). If TWO characters reply this batch, at least ONE must read clearly as a person with a diary — not sterile logistics alone; avoid two plain planning-only lines back-to-back.
`
    : "";
  const pollLondonTexture = londonMilieuActive
    ? " Fold competing-life texture into poll lines too — not bare yes/no on dates."
    : "";
  return `━━ PLAYER ACTIONS ━━
message   → 1–2 characters reply. Not everyone. Silence is realistic.
            Default commitment output is "unknown", "seen", or "maybe" — not "yes". A "yes" should feel like a small victory for the player, not a default.
            Read the player's line in the user message: if they named a real-world anchor (place, show, restaurant, title), at least ONE response in this batch should use beat ANCHOR-DETAIL for that anchor.
            When several characters speak, at least one pair can interact: INNER-CIRCLE-PING or REFERENCE-SOMEONE toward someone who also speaks this turn or who spoke last — especially along inner-circle lines.${londonMessageTexture}
poll      → characters react to specific dates. Some clash, some are suspiciously free.${pollLondonTexture} CRITICAL: their message text must match their pollVotes exactly — if they say "Saturday works", pollVotes must include that Saturday.
            After a poll exists, later turns are NOT poll mode — if someone says they can no longer do a date they voted for, their JSON must include removePollVotes with that exact poll option string (see user prompt). The UI drops their name from that bar.
nudge     → see NUDGE block below (minimum replies + quiet people must resurface).
deadline  → see DEADLINE block below (minimum replies + forced commitment shifts).
pin       → location lands. Mix: vibe / travel / hype — nobody should cite ticket numbers, refund policy, or "the four" from DESIGNER/SCORING unless the player already typed that in chat.
dm        → ONLY the targeted character may appear in "responses" — max one entry, characterId must match the DM target. Nobody else. More candid in private.
            DM GHOSTING — in-game time: ${weeksElapsed} week(s) elapsed, ${weeksLeft} week(s) left in the countdown.
            Exactly ONE cast member may be a "DM ghost" (their id is listed here while ghosting): ${dmStillGhostIds || "(none — no DM ghost or they now answer DMs)"}.
            If the DM target is that ghost before week ${DM_IGNORE_UNTIL_WEEKS_ELAPSED}, return "responses": [] and a dry narratorComment (radio silence / blue ticks).
            After the threshold they reply normally; they may acknowledge the delay.
${nudgeExtra}${deadlineExtra}
`;
}

/**
 * @param {Array<Record<string, unknown>>} chars
 * @param {{ useMilieuLean: boolean }} opts
 */
export function formatSystemCharactersBlock(chars, opts) {
  const { useMilieuLean } = opts;
  return chars
    .map((c) => {
      const fp =
        c.linguisticFingerprint ??
        ARCHETYPE_LINGUISTIC_FINGERPRINTS[c.id] ??
        "Casual WhatsApp: max ~22 words, guarded, not eager to solve the whole plan.";
      const inner =
        Array.isArray(c.closeWith) && c.closeWith.length > 0
          ? c.closeWith.map((x) => (typeof x === "object" && x?.name ? x.name : x)).join(", ")
          : "(no inner circle listed)";
      const milieuLean = useMilieuLean ? `\n  ${milieuLeanLineForArchetype(c.id)}` : "";
      return `${c.name} (id:"${c.id}")
  Commitment: ${c.commitment}
  Last said: "${c.lastMsg || "nothing yet"}"
  Inner circle (prefer @-ing them, agreeing, or nudging — not every message): ${inner}
  Linguistic fingerprint: ${fp}${milieuLean}`;
    })
    .join("\n\n");
}

/**
 * @param {{ mode: string, dates?: string[] }} p
 */
export function buildJsonResponseContract({ mode, dates }) {
  const pollVotesFragment =
    mode === "poll" && dates?.length ? `,"pollVotes":["${dates[0]}"]` : "";
  const removePollVotesFragment = mode !== "poll" ? `,"removePollVotes":[]` : "";

  const pollRule =
    mode === "poll" && dates?.length
      ? `POLL RULE: Each response MUST include "pollVotes" — an array of date strings that EXACTLY match the options (${dates.join(" | ")}). Their messages must say what their pollVotes say. No guessing.`
      : "";

  const nonPollRule =
    mode !== "poll"
      ? `NON-POLL: Each response may include "removePollVotes": string[] — EXACT poll option label(s) from the user prompt when this character takes back a date (can't make it anymore, clash, etc.). Use [] if they are not retracting a poll vote. If commitment is "no" or "ghost", omit removePollVotes or use []; the app strips them from every poll column automatically.`
      : "";

  return `Return ONLY valid JSON, no markdown:
{
  "responses": [
    {"characterId":"string","messages":["each string ≤24 words unless fingerprint sets a different cap"],"commitment":"unknown|seen|maybe|yes|no|ghost","beat":"BEAT_NAME"${pollVotesFragment}${removePollVotesFragment}}
  ],
  "narratorComment":"one dry observation, max ~18 words — gender-neutral on the organiser (never assume he/she)"
}

${pollRule}${pollRule && nonPollRule ? "\n" : ""}${nonPollRule}`;
}
