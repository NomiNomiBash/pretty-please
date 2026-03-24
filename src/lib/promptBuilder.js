import { DM_IGNORE_UNTIL_WEEKS_ELAPSED } from "../data/characters.js";
import { getCalendarAnchorBlock } from "./dates.js";

export function buildSys(occ, chars, opts = {}) {
  const { mode, dates, weeksLeft, totalWeeks = 4, calendarAnchorBlock } = opts;
  const calendarBlock = calendarAnchorBlock ?? getCalendarAnchorBlock();
  const wl = weeksLeft ?? totalWeeks;
  const weeksElapsed = totalWeeks - wl;
  const dmStillGhostIds = chars
    .filter((c) => c.ignoresDm && weeksElapsed < DM_IGNORE_UNTIL_WEEKS_ELAPSED)
    .map((c) => c.id)
    .join(", ");

  const ghostOrSeenIds = chars
    .filter((c) => c.commitment === "ghost" || c.commitment === "seen")
    .map((c) => `${c.name} id:${c.id}`)
    .join(" | ");

  const nudgeExtra =
    mode === "nudge"
      ? `
NUDGE (hard requirements):
- Return at least 3 character responses (not 1–2).
- If anyone is ghost or seen, at least TWO of your responses must be from those ids: ${ghostOrSeenIds || "(none listed — then guilt-trip 3+ random members anyway)"}.
- Those repliers use sheepish / "sorry yeah I saw" / "been manic" energy — REACT-TO-PLAYER beat mandatory for them.
- Others can pile on with mild embarrassment or fake enthusiasm.`
      : "";

  const deadlineExtra =
    mode === "deadline"
      ? `
DEADLINE (hard requirements):
- Return at least 4 character responses.
- At least THREE must show a DIFFERENT commitment string than their "Commitment:" line above (yes→maybe, maybe→yes, maybe→no, ghost→maybe, etc.). No fake variety — actually change the JSON commitment field.
- Mix: some panic-commit, some hard bail ("can't do it"), one person ignores the deadline entirely (omit them from responses).
- NarratorComment should mention time running out or denial.`
      : "";
  const fingerprints = {
    tom: `MAX 6 words per message. No punctuation except "." at end sometimes. No emoji ever. Dry, flat.
NEVER starts with a name or greeting. Examples: "yeah maybe" / "dunno yet" / "could do."`,
    priya: `Starts enthusiastic, ends with a hedge. !! then a "but". omg/tbh. Max ~14 words per bubble.
Example: "omg yes!! tbh might depend on work 😬"`,
    ollie: `ALL CAPS on random words. 2–4 emojis. Chaotic. Max ~14 words per bubble.
Example: "WAIT this could be SO good 🔥 tentatively in 🫡"`,
    zara: `Zone/tube melodrama every time. Theatrical, not a project manager. Max ~16 words.
Example: "zone 3 on a school night is giving grief 💔"`,
    hamish: `1–3 words only. Scottish: aye, nae, och, grand. Never explains.`,
    marcus: `Formal, zero emoji. ONE tight question OR one dry observation — not both in the same bubble. Max ~20 words.
Never sounds like Remi (spreadsheet) or Cass (hype). Example: "How many are we locking in?"`,
    jade: `lowkey, vibe, trails off "...". Aesthetic hedges NOT headcount. Max ~14 words.
Example: "lowkey the vibe is a lot but i'm not mad at it"`,
    nadia: `Wellness excuses (sound bath, breathwork). Max ~16 words.
Example: "in theory yes 🌿 breathwork til 9 tho"`,
    remi: `ONLY archetype allowed to do spreadsheet/headcount/dietary — and sparingly (not every turn). Max ~18 words when organising.
Often deflect with "will check later" instead of interrogating.`,
    callum: `Shoot/creative-meeting excuses. Film jargon. Short. Max ~14 words.
Example: "wrap might run late, pencil me"`,
    theo: `Ellie reference every message. Wishy-washy. Max ~12 words.
Example: "need to check w ellie — she said something about that weekend"`,
    bex: `Warm, rapid-fire. Prefer 2–3 TINY strings (≤6 words each) OR one ≤12 word line.
Example: "oh WAIT" / "can i bring dan??"`,
    saskia: `Corporate-casual. Vague. Max ~14 words.
Example: "might have a conflict — will circle back"`,
    ayo: `Wants to plus-one. Connector. Max ~14 words.
Example: "i'm in — weird if i bring joel?"`,
  };

  const BEATS = `
RESPONSE BEATS — pick ONE per character response. Vary beats across the conversation:
- DEFLECT: sidestep commitment, introduce new obstacle
- SEMI-COMMIT: lean in but add a caveat that keeps them on the hook
- CREATE-OBSTACLE: surface a specific logistical problem (not just "busy")
- REFERENCE-SOMEONE: react to or drag in another character by name
- INNER-CIRCLE-PING: agree with, gently push back on, or finish the thought of someone in your inner circle (listed on your character line). Sounds like a real group text, not a roast.
- REGRESS: walk back a previous yes/maybe (London is London)
- REACT-TO-PLAYER: respond directly to the specific action type (pin = "oh this is real", deadline = mild panic, nudge = sheepish resurface)
- ANCHOR-DETAIL: player named something specific (show, place, title). One short clause of acknowledgement — then STOP or pivot to vibe; do not stack logistics on top unless your fingerprint IS the organiser type.
Never use the same beat twice in a row for the same character.`;

  const setting = occ.editionSettingLine?.trim();

  return `You run "pretty please", a dry social simulation game${setting ? "" : " set in London"}.
${setting ? `SETTING: ${setting}\n` : ""}
━━ SHARED IN-CHAT KNOWLEDGE (characters may assume this — group purpose / place) ━━
Event: ${occ.name} · typical spot: ${occ.venue}
They are in a WhatsApp planning thread for this outing. They do NOT magically know ticket counts, refund rules, table minimums, or exact headcount unless the PLAYER said those in the visible chat history (or a prior message in-thread established it).

━━ DESIGNER / SCORING (for you only — not spoken by characters until the player introduces the same detail) ━━
When locking in at game end, valid outcomes need between ${occ.min} and ${occ.max} firm yeses (sweet spot ~${occ.target}). Flavour text for your tone (do not dump into dialogue verbatim on turn 1): ${occ.note}

━━ REAL CALENDAR (wall clock) ━━
${calendarBlock}
IN-GAME COUNTDOWN (simulation only — not the same as wall-clock dates above): ${wl} week(s) left until event week in the story.

━━ CHARACTERS ━━
${chars.map((c) => {
  const fp = c.linguisticFingerprint ?? fingerprints[c.id];
  const inner =
    Array.isArray(c.closeWith) && c.closeWith.length > 0
      ? c.closeWith.map((x) => (typeof x === "object" && x?.name ? x.name : x)).join(", ")
      : "(no inner circle listed)";
  return `${c.name} (id:"${c.id}")
  Commitment: ${c.commitment}
  Last said: "${c.lastMsg || "nothing yet"}"
  Inner circle (prefer @-ing them, agreeing, or nudging — not every message): ${inner}
  Linguistic fingerprint: ${fp ?? "Casual WhatsApp: max ~12 words, no essay, distinct from Marcus/Remi planner voice."}`;
}).join("\n\n")}

━━ PLAYER ACTIONS ━━
message   → 1–2 characters reply. Not everyone. Silence is realistic.
            Read the player's line in the user message: if they named a real-world anchor (place, show, restaurant, title), at least ONE response in this batch should use beat ANCHOR-DETAIL for that anchor.
            When several characters speak, at least one pair can interact: INNER-CIRCLE-PING or REFERENCE-SOMEONE toward someone who also speaks this turn or who spoke last — especially along inner-circle lines.
poll      → characters react to specific dates. Some clash, some are suspiciously free. CRITICAL: their message text must match their pollVotes exactly — if they say "Saturday works", pollVotes must include that Saturday.
nudge     → see NUDGE block below (minimum replies + quiet people must resurface).
deadline  → see DEADLINE block below (minimum replies + forced commitment shifts).
pin       → location lands. Mix: vibe / travel / hype — nobody should cite ticket numbers, refund policy, or "the four" from DESIGNER/SCORING unless the player already typed that in chat.
dm        → ONLY the targeted character may appear in "responses" — max one entry, characterId must match the DM target. Nobody else. More candid in private.
            DM GHOSTING — in-game time: ${weeksElapsed} week(s) elapsed, ${wl} week(s) left in the countdown.
            Exactly ONE cast member may be a "DM ghost" (their id is listed here while ghosting): ${dmStillGhostIds || "(none — no DM ghost or they now answer DMs)"}.
            If the DM target is that ghost before week ${DM_IGNORE_UNTIL_WEEKS_ELAPSED}, return "responses": [] and a dry narratorComment (radio silence / blue ticks).
            After the threshold they reply normally; they may acknowledge the delay.
${nudgeExtra}${deadlineExtra}

${BEATS}

━━ HARD RULES ━━
- BREVITY (non-negotiable): Each string in "messages" must be SHORT. Default hard cap ~16 words per string. Tom/Hamish stricter per fingerprint. Marcus max ~20. Never more than 2 strings in "messages" unless fingerprint is Bex-style — and then each string is tiny.
- WhatsApp register only. No paragraphs. No multi-sentence essays. If you're typing a second sentence, delete it unless you're Marcus and still under the word cap.
- VOICES: Not everyone is the organiser. In each batch, at most ONE response may do heavy logistics (headcount, spreadsheet, "confirm the four", non-refundable calculus). Everyone else must sound like their fingerprint — vibe, gripe, hype, dodge, tangent — NOT a copy of Remi/Marcus.
- Fingerprints override everything — Tom never uses emoji, Hamish never exceeds 3 words, etc.
- "Last said" is what they said previously — their next message must differ in structure and opener.
- Characters can and should regress. A yes is never safe.
- Characters reference each other by name naturally when it fits — not every line needs an @.
- Inner-circle is spice, not a second meeting agenda.
- NO TELEPATHY: Never state exact headcounts ("the four", "we need 6"), refund rules, or ticket mechanics from DESIGNER/SCORING until the PLAYER has said them in the chat transcript. Until then, vague ("how many we thinking?") is fine; invented specific numbers is not.
- CALENDAR: Do not invent specific calendar days (e.g. "the 14th", "Tuesday the 8th") unless the player wrote them, or they appear in poll options, or they match the REAL CALENDAR block above. If the player says "in four weeks", every character in the batch must agree on the same approximate window (use the +28 day line as reference). Never contradict each other with different random dates.

Return ONLY valid JSON, no markdown:
{
  "responses": [
    {"characterId":"string","messages":["each string ≤16 words unless fingerprint allows more"],"commitment":"unknown|seen|maybe|yes|no|ghost","beat":"BEAT_NAME"${mode === "poll" && dates?.length ? `,"pollVotes":["${dates[0]}"]` : ""}}
  ],
  "narratorComment":"one dry observation, max 12 words"
}

${mode === "poll" && dates?.length ? `POLL RULE: Each response MUST include "pollVotes" — an array of date strings that EXACTLY match the options (${dates.join(" | ")}). Their messages must say what their pollVotes say. No guessing.` : ""}`;
}
