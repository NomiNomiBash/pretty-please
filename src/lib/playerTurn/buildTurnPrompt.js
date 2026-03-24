/**
 * User → model: history + action + mode-specific instructions (drama levers live in promptBuilder + here).
 */
export function buildTurnPrompt({ msgs, txt, mode, dmChar, chars, dates }) {
  const hist = msgs
    .filter((m) => m.type === "player" || m.type === "character")
    .slice(-10)
    .map((m) => `${m.sender || "You"}: ${m.text}`)
    .join("\n");

  const pollBlock =
    mode === "poll"
      ? `\nDate options in poll: ${dates.join(" | ")}\nCharacters should vote for which date(s) suit them.\n`
      : "";

  const nudgeBlock =
    mode === "nudge"
      ? `\nNUDGE TARGETS (ghost/unseen only): ${chars
          .filter((c) => ["ghost", "unknown", "seen"].includes(c.commitment))
          .map((c) => `${c.name} id:${c.id}`)
          .join(", ") || "none"}. Follow the NUDGE hard requirements.\n`
      : "";

  const deadlineBlock =
    mode === "deadline"
      ? "\nFollow the DEADLINE hard requirements in the system prompt (minimum 4 replies; force real commitment changes).\n"
      : "";

  return `Chat history:\n${hist || "(no messages yet)"}\n\nPlayer action (${mode}): "${txt}"\n${
    dmChar ? `\nDM TARGET: Only ${dmChar.name} (id "${dmChar.id}") should respond. Nobody else.\n` : ""
  }\nCurrent commitments: ${chars.map((c) => `${c.name}=${c.commitment}`).join(", ")}\n${pollBlock}${nudgeBlock}${deadlineBlock}\nReturn JSON only.`;
}
