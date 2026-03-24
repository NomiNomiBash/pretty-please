/**
 * Assembles the model system prompt from occasion, cast, and turn options.
 * Static copy, mode extras, JSON contract, and cast formatting live in systemPromptSections.js.
 */
import { buildLondonHipMilieuBlock } from "../data/londonHipMilieu.js";
import { getCalendarAnchorBlock } from "./dates.js";
import {
  BEATS_BLOCK,
  HARD_RULES_BLOCK,
  buildJsonResponseContract,
  buildPlayerActionsSection,
  buildWeekPressureGuidance,
  formatDmStillGhostIds,
  formatGhostOrSeenIdsLine,
  formatSystemCharactersBlock,
} from "./systemPromptSections.js";

export function buildSys(occ, chars, opts = {}) {
  const { mode, dates, weeksLeft, totalWeeks = 4, calendarAnchorBlock, turnStep = 0 } = opts;
  const calendarBlock = calendarAnchorBlock ?? getCalendarAnchorBlock();
  const wl = weeksLeft ?? totalWeeks;
  const weeksElapsed = totalWeeks - wl;

  const dmStillGhostIds = formatDmStillGhostIds(chars, weeksElapsed);
  const ghostOrSeenIdsLine = formatGhostOrSeenIdsLine(chars);

  const setting = occ.editionSettingLine?.trim();
  const londonMilieu = setting ? "" : buildLondonHipMilieuBlock({ occasionId: occ?.id, turnStep });

  const charactersBody = formatSystemCharactersBlock(chars, { useMilieuLean: !setting });

  return `You run "pretty please", a dry social simulation game${setting ? "" : " set in London"}.
${setting ? `SETTING: ${setting}\n` : ""}
${londonMilieu ? `${londonMilieu}\n` : ""}
━━ SHARED IN-CHAT KNOWLEDGE (characters may assume this — group purpose / place) ━━
Event: ${occ.name} · typical spot: ${occ.venue}
They are in a WhatsApp planning thread for this outing. The organiser is the human player — **do not assume their gender** (see HARD RULES: address them as *you* in-character; they/them or neutral in third person unless the transcript clearly shows otherwise). They do NOT magically know ticket counts, refund rules, table minimums, or exact headcount unless the PLAYER said those in the visible chat history (or a prior message in-thread established it).

━━ DESIGNER / SCORING (for you only — not spoken by characters until the player introduces the same detail) ━━
When locking in at game end, headcount is TOTAL people at the event including the player (organiser). Valid band: ${occ.min}–${occ.max} (sweet spot ~${occ.target}). The player always counts as 1; only cast "yes" replies add to that total. Flavour text for your tone (do not dump into dialogue verbatim on turn 1): ${occ.note}

━━ REAL CALENDAR (wall clock) ━━
${calendarBlock}
IN-GAME COUNTDOWN (simulation only — not the same as wall-clock dates above): ${wl} week(s) left until event week in the story.

━━ CHARACTERS (natal chart spine) ━━
Astrology shorthand for this game: ♀️ Venus = HOW they text (warmth, brevity, performance, hedging style). ☀️ Sun = WHAT they are underneath — core motive, boundaries, what they're protecting or chasing. Let both show; when they fight, that's the character.
Doubles (Hamish Sag/Sag, Nadia Aqua/Aqua) stack the same flavour on both layers.
${charactersBody}

${buildWeekPressureGuidance(weeksElapsed)}

${buildPlayerActionsSection({
    mode,
    dates,
    weeksElapsed,
    weeksLeft: wl,
    dmStillGhostIds,
    ghostOrSeenIdsLine,
    londonMilieuActive: !setting,
  })}

${BEATS_BLOCK}

${HARD_RULES_BLOCK}

${buildJsonResponseContract({ mode, dates })}`;
}
