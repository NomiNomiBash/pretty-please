/** min / max / target = total people at the event, including the player (organiser). */
export const OCCASIONS = [
  { id: "dinner", name: "Birthday Dinner", emoji: "🎂", venue: "Bao Borough Market", target: 8, min: 6, max: 10, note: "Table for 8. Won't seat fewer than 6. More than 10 and they split you up, which completely ruins the vibe." },
  { id: "brunch", name: "Bottomless Brunch", emoji: "🥂", venue: "HIDE, Piccadilly", target: 5, min: 4, max: 7, note: "Pay upfront per head. 4–7 people only. Every flake costs real money. This one is remarkably personal." },
  { id: "party", name: "House Warming", emoji: "🏠", venue: "Your flat, Zone 2 (freshly hoovered)", target: 12, min: 8, max: 20, note: "Need at least 8 for it to feel like a party. More than 20 and the neighbours get involved." },
  { id: "theatre", name: "National Theatre", emoji: "🎭", venue: "National Theatre, South Bank", target: 4, min: 4, max: 4, note: "Non-refundable. Non-transferable. Exactly 4 tickets. Every empty seat is £55 of extra elbow room." },
  { id: "roast", name: "Sunday Roast", emoji: "🍽️", venue: "The Eagle, Farringdon", target: 6, min: 4, max: 8, note: "Roasts stop at 5pm sharp. Fewer than 4 and you're that sad corner table. More than 8 and you're technically a stag do and they hate you." },
  { id: "karaoke", name: "Karaoke Booth", emoji: "🎤", venue: "Lucky Voice, Soho", target: 8, min: 6, max: 12, note: "Room holds 12 max — 6 minimum or it's awkward. Someone will sing Mr Brightside three times. It is fact." },
  { id: "comedy", name: "Comedy Night", emoji: "🎙️", venue: "Top Secret Comedy Club, Covent Garden", target: 6, min: 4, max: 10, note: "Two-drink minimum, zero dignity necessary. Fewer than 4 you're the obvious target. More than 10 and you're the show-stealers." },
];

/** Seven missions; rotation index = calendar day mod length (was five before the list grew). */
export const DAILY_MISSION_COUNT = OCCASIONS.length;

/**
 * @param {number} [dayOfMonth] 1–31; defaults to today (local). Uses `day % DAILY_MISSION_COUNT`.
 */
export function pickOccasionForCalendarDay(dayOfMonth = new Date().getDate()) {
  const d = Math.floor(Number(dayOfMonth));
  const day = Number.isFinite(d) && d >= 1 && d <= 31 ? d : new Date().getDate();
  return OCCASIONS[day % DAILY_MISSION_COUNT];
}
