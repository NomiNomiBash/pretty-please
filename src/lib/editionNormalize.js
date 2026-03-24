function isNonEmptyString(x) {
  return typeof x === "string" && x.trim().length > 0;
}

/**
 * Validates and normalizes an authored daily edition (from JSON).
 * Optional per-character `linguisticFingerprint` overrides promptBuilder defaults.
 */
export function normalizeAuthoredEdition(raw, dateKey) {
  if (!raw || typeof raw !== "object") return null;
  const occ = raw.occasion;
  if (!occ || typeof occ !== "object") return null;
  const requiredOcc = ["id", "name", "emoji", "venue", "note"];
  for (const k of requiredOcc) {
    if (!isNonEmptyString(occ[k])) return null;
  }
  for (const k of ["target", "min", "max"]) {
    const n = occ[k];
    if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return null;
  }
  if (!Array.isArray(raw.characters) || raw.characters.length < 2) return null;

  const characters = raw.characters.map((c, i) => {
    if (!c || typeof c !== "object") return null;
    if (!isNonEmptyString(c.id) || !isNonEmptyString(c.name) || !isNonEmptyString(c.avatar)) return null;
    const personality = isNonEmptyString(c.personality) ? c.personality.trim() : "";
    const row = {
      id: c.id.trim(),
      name: c.name.trim(),
      avatar: c.avatar.trim(),
      lastSeen: isNonEmptyString(c.lastSeen) ? c.lastSeen.trim() : "recently",
      personality,
      commitment: "unknown",
      lastMsg: null,
      ignoresDm: false,
    };
    if (isNonEmptyString(c.linguisticFingerprint)) {
      row.linguisticFingerprint = c.linguisticFingerprint.trim();
    }
    return row;
  });

  if (characters.some((c) => c == null)) return null;

  const occasion = {
    id: occ.id.trim(),
    name: occ.name.trim(),
    emoji: occ.emoji.trim(),
    venue: occ.venue.trim(),
    target: occ.target,
    min: occ.min,
    max: occ.max,
    note: occ.note.trim(),
  };
  if (isNonEmptyString(raw.settingLine)) {
    occasion.editionSettingLine = raw.settingLine.trim();
  }

  const out = {
    date: dateKey,
    occasion,
    characters,
  };
  if (isNonEmptyString(raw.theme)) out.theme = raw.theme.trim();
  return out;
}
