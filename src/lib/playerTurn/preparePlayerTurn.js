import { formatIsoDateLabel, getUpcomingDateInputs, getUpcomingDates } from "../dates.js";
import { TOTAL_WEEKS } from "./gameConstants.js";

/**
 * Turn each UI mode into the player-visible message + model-facing action text.
 * Add new modes here; keep drama reactions in postAiByMode.js.
 *
 * @param {{
 *   mode: string,
 *   occ: { name: string, venue: string, note: string },
 *   input: string,
 *   pollDates: string[],
 *   weeksLeft: number | null,
 *   chars: Array<{ id: string, name: string, commitment: string }>,
 *   dmTarget: string | null,
 * }} p
 */
export function preparePlayerTurn({ mode, occ, input, pollDates, weeksLeft, chars, dmTarget }) {
  const pollWeeksAway = Math.max(0, weeksLeft ?? TOTAL_WEEKS);
  const fallbackDates = getUpcomingDates({ weeksAway: pollWeeksAway });
  const pickedDates = Array.from(
    new Set(pollDates.map((iso) => formatIsoDateLabel(iso)).filter(Boolean))
  );
  const dates = pickedDates.length > 0 ? pickedDates : fallbackDates;
  const pollId = `p${Date.now()}`;
  const pinLocation = mode === "pin" ? String(input).trim() || occ.venue : "";

  let txt = "";
  /** @type {Record<string, unknown>} */
  let pm = {};

  if (mode === "pin") {
    txt = `📍 ${occ.name} · ${pinLocation} · ${occ.note}`;
    pm = { id: Date.now(), type: "player", text: `📍 ${pinLocation}`, action: "pin" };
  } else if (mode === "poll") {
    txt = `📅 Date poll for ${occ.name} — which weekend works?\n${dates.map((d, i) => `${i + 1}. ${d}`).join("\n")}`;
    pm = {
      id: Date.now(),
      type: "player",
      text: "Which date works for everyone?",
      action: "poll",
      isPoll: true,
      pollId,
      votes: Object.fromEntries(dates.map((d) => [d, []])),
    };
  } else if (mode === "nudge") {
    const targets = chars.filter((c) => ["ghost", "unknown", "seen"].includes(c.commitment));
    const names = targets.map((c) => c.name).join(", ");
    txt = `🔔 Hey — just checking in. ${names ? `${names}, any thoughts?` : "Anyone?"}`;
    pm = { id: Date.now(), type: "player", text: "🔔 Checking in on everyone...", action: "nudge" };
  } else if (mode === "deadline") {
    txt = `⏰ Need answers by end of this week — if I don't hear back I'll assume you're out.`;
    pm = {
      id: Date.now(),
      type: "player",
      text: "⏰ Answer by end of this week or I'm releasing your spot.",
      action: "deadline",
    };
  } else if (mode === "dm") {
    txt = String(input).trim();
    const ch = chars.find((c) => c.id === dmTarget);
    pm = { id: Date.now(), type: "player", text: txt, action: "dm", dmTarget: ch?.name || "" };
  } else {
    txt = String(input).trim();
    pm = { id: Date.now(), type: "player", text: txt, action: mode };
  }

  const resetDates = getUpcomingDateInputs({ weeksAway: pollWeeksAway });

  return {
    txt,
    playerMsg: pm,
    pollId,
    dates,
    pollDatesReset: mode === "poll" ? [resetDates[0] || "", resetDates[1] || "", resetDates[2] || ""] : null,
  };
}
