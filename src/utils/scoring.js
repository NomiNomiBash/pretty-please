/**
 * How hard each occasion is to organise.
 * Tight slot (theatre: 0 slack) → 1.8× friction. Generous (party: 12 slack) → 1.0×.
 * Used to scale both week-advance flake rates and lock-in resolution.
 */
export function occasionFrictionMultiplier(occ) {
  const slack = (occ?.max ?? 0) - (occ?.min ?? 0);
  return Math.max(1.0, 1.0 + (1 - Math.min(1, slack / 10)) * 0.8);
}

/**
 * When the player locks in, people who were "maybe" finally commit or don't.
 * Only `maybe` rows change; everything else is left as-is for scoring.
 * Tighter occasions (low slack) suppress the yes-probability at the last minute.
 */
export function resolveCommitmentsAtLockIn(chars, occ) {
  const mult = occasionFrictionMultiplier(occ);
  // yes: 0.38 on easy occasions, down toward 0.21 on tight ones
  const yesChance = Math.max(0.21, 0.38 / mult);
  // no band stays wide so "stays maybe" is rarer but yes is harder
  const noBand = Math.min(0.6, 0.38);
  return chars.map((c) => {
    if (c.commitment !== "maybe") return c;
    const r = Math.random();
    if (r < yesChance) return { ...c, commitment: "yes" };
    if (r < yesChance + noBand) return { ...c, commitment: "no" };
    return { ...c, commitment: "maybe" };
  });
}

export function buildResult({ occ, confirmed, steps, personalBest }) {
  const count = confirmed.length;
  const { min, max, target } = occ;

  if (count < min) {
    return {
      result: {
        type: "loss",
        title: count === 0 ? "💀 Zero. Not One Person." : "💀 Not Enough",
        message:
          count === 0
            ? "Absolute radio silence. You eat the full cost alone and pretend it never happened."
            : `Only ${count} said yes — needed at least ${min}. You text everyone 'no worries! next time!' and stare at the ceiling.`,
        score: Math.round((count / min) * 40),
        attendees:
          count === 0
            ? []
            : confirmed.map((c) => ({ name: c.name, avatar: c.avatar ?? "🧑" })),
      },
      isNewBest: false,
      nextBest: personalBest,
    };
  }

  if (count > max) {
    return {
      result: {
        type: "loss",
        title: "😬 Too Many People",
        message: `${count} said yes. You only had room for ${max}. Hamish brings someone uninvited. Someone brings a dog. The vibe is irrevocably off.`,
        score: Math.round((max / count) * 60),
        attendees: confirmed.map((c) => ({ name: c.name, avatar: c.avatar ?? "🧑" })),
      },
      isNewBest: false,
      nextBest: personalBest,
    };
  }

  const efficiency =
    steps <= 8
      ? "Suspiciously efficient."
      : steps <= 15
      ? "Not bad at all."
      : steps <= 25
      ? "You got there. Eventually."
      : "What an absolute ordeal. But you did it.";
  const isNewBest = personalBest === null || steps < personalBest;

  return {
    result: {
      type: "win",
      title: "🎉 It's Happening",
      message: `${count}/${target} confirmed. The ${occ.name} is ON. Took ${steps} steps. ${efficiency}`,
      score: Math.max(10, Math.min(100, 100 - steps * 2 + (count === target ? 20 : 0))),
      attendees: confirmed.map((c) => ({ name: c.name, avatar: c.avatar ?? "🧑" })),
      isNewBest,
    },
    isNewBest,
    nextBest: isNewBest ? steps : personalBest,
  };
}
