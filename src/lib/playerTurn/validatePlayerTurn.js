const NO_TEXT_MODES = ["poll", "nudge", "deadline"];

/**
 * Gate before a turn is committed. Each mode can add its own rules in one place.
 */
export function validatePlayerTurn({
  loading,
  occ,
  mode,
  input,
  nudgeUsed,
  deadlineUsed,
  chars,
}) {
  if (loading || !occ) return { ok: false };
  if (!NO_TEXT_MODES.includes(mode) && !String(input).trim() && mode !== "pin") {
    return { ok: false };
  }
  if (mode === "nudge") {
    if (nudgeUsed) return { ok: false };
    const targets = chars.filter((c) => ["ghost", "unknown", "seen"].includes(c.commitment));
    if (targets.length === 0) return { ok: false };
  }
  if (mode === "deadline" && deadlineUsed) return { ok: false };
  return { ok: true };
}
