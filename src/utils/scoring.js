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
            : `Only ${count} confirmed. Needed at least ${min}. You text everyone 'no worries! next time!' and stare at the ceiling.`,
        score: Math.round((count / min) * 40),
        attendees: [],
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
        attendees: confirmed.map((c) => c.name),
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
      attendees: confirmed.map((c) => c.name),
      isNewBest,
    },
    isNewBest,
    nextBest: isNewBest ? steps : personalBest,
  };
}
