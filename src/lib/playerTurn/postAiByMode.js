/**
 * After the model returns: mode-specific mechanical drama (group dynamics).
 * Extend this file when you add a new player action — wire a handler in `POST_RESPONSE_DRAMA` or `AFTER_AI_SCHEDULERS`.
 */
import { appendSystemMsgsOnce, runSetCharsTransitionOnce } from "../reactStrictModeDedupe.js";

/** Runs once we have `ai` but before character messages are streamed (e.g. deadline tracking). */
export function scheduleAfterAi(mode, { chars, weeksLeft, setDeadlineWeek, setDeadlineTargetIds }) {
  if (mode !== "deadline") return;
  const dlTargets = chars.filter((c) => ["ghost", "unknown", "seen"].includes(c.commitment));
  setDeadlineWeek(weeksLeft);
  setDeadlineTargetIds(dlTargets.map((c) => c.id));
}

/**
 * Runs after all character bubbles for this turn are applied.
 * @param {{ setChars: Function, setMsgs: Function, turnStep: number }} ctx — turnStep dedupes Strict Mode double updates
 */
export function runPostResponseDrama(mode, { setChars, setMsgs, turnStep }) {
  const runner = POST_RESPONSE_DRAMA[mode];
  if (runner) runner({ setChars, setMsgs, turnStep });
}

const POST_RESPONSE_DRAMA = {
  nudge: runNudgeRecoveryDrama,
  deadline: runDeadlinePressureDrama,
  /** Stubs — add light system lines, commitment nudges, rivalries, etc. */
  message: () => {},
  pin: () => {},
  poll: () => {},
  dm: () => {},
};

function runNudgeRecoveryDrama({ setChars, setMsgs, turnStep }) {
  const step = turnStep ?? 0;
  runSetCharsTransitionOnce(`nudge-${step}`, setChars, (prev) => {
    const ghosts = prev.filter((c) => c.commitment === "ghost");
    const pick = ghosts.slice(0, 2);
    const idSet = new Set(pick.map((c) => c.id));
    const names = [];
    const next = prev.map((c) => {
      if (!idSet.has(c.id)) return c;
      if (Math.random() < 0.78) {
        names.push(c.name);
        return { ...c, commitment: "maybe" };
      }
      return c;
    });
    const msgId = `nudge-surface-${step}`;
    return {
      nextChars: next,
      enqueue:
        names.length > 0
          ? () =>
              appendSystemMsgsOnce(setMsgs, msgId, [
                {
                  id: msgId,
                  type: "system",
                  text: `🔔 ${names.join(" & ")} surfaced after the nudge.`,
                },
              ])
          : undefined,
    };
  });
}

function runDeadlinePressureDrama({ setChars, setMsgs, turnStep }) {
  const step = turnStep ?? 0;
  const msgId = `deadline-shook-${step}`;
  runSetCharsTransitionOnce(`deadline-${step}`, setChars, (prev) => {
    const next = prev.map((c) => {
      const u = Math.random();
      if (c.commitment === "maybe") {
        if (u < 0.42) return { ...c, commitment: "yes" };
        if (u < 0.68) return { ...c, commitment: "no" };
        return c;
      }
      if (c.commitment === "unknown") {
        if (u < 0.36) return { ...c, commitment: "maybe" };
        if (u < 0.52) return { ...c, commitment: "yes" };
        return c;
      }
      if (c.commitment === "seen") {
        if (u < 0.44) return { ...c, commitment: "maybe" };
        if (u < 0.58) return { ...c, commitment: "yes" };
        return c;
      }
      return c;
    });
    return {
      nextChars: next,
      enqueue: () =>
        appendSystemMsgsOnce(setMsgs, msgId, [
          {
            id: msgId,
            type: "system",
            text: "⏰ The deadline shook loose a few actual answers.",
          },
        ]),
    };
  });
}

/** Nudge / deadline are one-shot tools — reset UI mode after success. */
export function finalizeDisposableAction(mode, { setNudgeUsed, setDeadlineUsed, setMode }) {
  if (mode === "nudge") {
    setNudgeUsed(true);
    setMode("message");
  }
  if (mode === "deadline") {
    setDeadlineUsed(true);
    setMode("message");
  }
}
