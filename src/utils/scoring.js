/**
 * Headcount bands (min / max / target on occasions) are TOTAL people at the event,
 * including the player (organiser). NPC firm yeses = total − 1.
 */
export function totalHeadcountIncludingPlayer(npcYesCount) {
  return (npcYesCount ?? 0) + 1;
}

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
/** For "too many people" flavour copy — real cast names, not a fixed NPC. */
function pickChaosBlameNames(confirmed) {
  if (!confirmed?.length) {
    return { plusOne: "Someone", dogWalker: "Someone" };
  }
  const preferPlusOne = ["ayo", "ollie", "hamish", "zara"];
  const plusOneChar =
    confirmed.find((c) => preferPlusOne.includes(c.id)) ?? confirmed[0];
  const dogChar =
    confirmed.find((c) => c.id !== plusOneChar.id) ?? plusOneChar;
  return { plusOne: plusOneChar.name, dogWalker: dogChar.name };
}

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
  const npcYes = confirmed.length;
  const total = totalHeadcountIncludingPlayer(npcYes);
  const { min, max, target } = occ;

  const youChip = { name: "You", avatar: "👤" };
  const npcAttendees = confirmed.map((c) => ({ name: c.name, avatar: c.avatar ?? "🧑" }));
  const attendeesWithYou = [youChip, ...npcAttendees];

  if (total < min) {
    return {
      result: {
        type: "loss",
        title: npcYes === 0 ? "💀 Zero. Not One Person." : "💀 Not Enough",
        message:
          npcYes === 0
            ? "Absolute radio silence. You eat the full cost alone and pretend it never happened."
            : `Only ${npcYes} in the chat said yes — ${total} people including you, but you need at least ${min} total. You text everyone 'no worries! next time!' and stare at the ceiling.`,
        score: Math.round((total / min) * 40),
        attendees: npcYes === 0 ? [youChip] : attendeesWithYou,
      },
      isNewBest: false,
      nextBest: personalBest,
    };
  }

  if (total > max) {
    const { plusOne, dogWalker } = pickChaosBlameNames(confirmed);
    const dogLine =
      plusOne === dogWalker
        ? "Someone brings a dog."
        : `${dogWalker} brings a dog.`;
    return {
      result: {
        type: "loss",
        title: "😬 Too Many People",
        message: `${total} people including you — max was ${max}. ${plusOne} brings someone uninvited. ${dogLine} The vibe is irrevocably off.`,
        score: Math.round((max / total) * 60),
        attendees: attendeesWithYou,
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
      message: `${total}/${target} people locked in (including you). The ${occ.name} is ON. Took ${steps} steps. ${efficiency}`,
      score: Math.max(10, Math.min(100, 100 - steps * 2 + (total === target ? 20 : 0))),
      attendees: attendeesWithYou,
      isNewBest,
    },
    isNewBest,
    nextBest: isNewBest ? steps : personalBest,
  };
}
