import { OCCASIONS } from "../src/data/occasions.js";
import { CHARACTERS } from "../src/data/characters.js";
import { assignIdentities, pickGroupForOccasion } from "../src/data/namePool.js";

function pickTodayOccasion() {
  const day = new Date().getDate();
  return OCCASIONS[day % OCCASIONS.length];
}

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const occasion = pickTodayOccasion();
  const group = pickGroupForOccasion(CHARACTERS, occasion);
  const characters = assignIdentities(group).map((c) => ({ ...c, commitment: "unknown", lastMsg: null }));

  res.status(200).json({
    date: new Date().toISOString().slice(0, 10),
    occasion,
    characters,
    source: "api",
  });
}
