/**
 * After the model returns: mode-specific mechanical drama (group dynamics).
 * Extend this file when you add a new player action — wire a handler in `POST_RESPONSE_DRAMA` or `AFTER_AI_SCHEDULERS`.
 */

/** Runs once we have `ai` but before character messages are streamed (e.g. deadline tracking). */
export function scheduleAfterAi(mode, { chars, weeksLeft, setDeadlineWeek, setDeadlineTargetIds }) {
  if (mode !== "deadline") return;
  const dlTargets = chars.filter((c) => ["ghost", "unknown", "seen"].includes(c.commitment));
  setDeadlineWeek(weeksLeft);
  setDeadlineTargetIds(dlTargets.map((c) => c.id));
}

/** Runs after all character bubbles for this turn are applied. */
export function runPostResponseDrama(mode, { setChars, setMsgs }) {
  const runner = POST_RESPONSE_DRAMA[mode];
  if (runner) runner({ setChars, setMsgs });
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

function runNudgeRecoveryDrama({ setChars, setMsgs }) {
  setChars((prev) => {
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
    if (names.length) {
      queueMicrotask(() =>
        setMsgs((m) => [
          ...m,
          {
            id: `nudgefx${Date.now()}`,
            type: "system",
            text: `🔔 ${names.join(" & ")} surfaced after the nudge.`,
          },
        ])
      );
    }
    return next;
  });
}

function runDeadlinePressureDrama({ setChars, setMsgs }) {
  setChars((prev) =>
    prev.map((c) => {
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
    })
  );
  setMsgs((p) => [
    ...p,
    {
      id: `deadlinefx${Date.now()}`,
      type: "system",
      text: "⏰ The deadline shook loose a few actual answers.",
    },
  ]);
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
