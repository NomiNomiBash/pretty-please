const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toIsoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getUpcomingDates({ weeksAway = 0 } = {}) {
  const opts = [];
  const today = new Date();
  const startOffsetDays = Math.max(0, weeksAway) * 7;
  for (let i = 1 + startOffsetDays; opts.length < 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() === 5 || d.getDay() === 6 || d.getDay() === 0) {
      opts.push(`${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`);
    }
  }
  return opts;
}

export function getUpcomingDateInputs({ weeksAway = 0 } = {}) {
  const opts = [];
  const today = new Date();
  const startOffsetDays = Math.max(0, weeksAway) * 7;
  for (let i = 1 + startOffsetDays; opts.length < 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() === 5 || d.getDay() === 6 || d.getDay() === 0) {
      opts.push(toIsoDate(d));
    }
  }
  return opts;
}

export function formatIsoDateLabel(isoDate) {
  if (!isoDate) return "";
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function formatDateLong(d) {
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Injected into the model system prompt so relative player phrases ("in four weeks")
 * map to one consistent wall calendar instead of hallucinated day-of-month numbers.
 */
export function getCalendarAnchorBlock() {
  const today = new Date();
  const isoToday = toIsoDate(today);
  const offsets = [7, 14, 21, 28];
  const lines = offsets.map((days) => {
    const d = new Date(today);
    d.setDate(today.getDate() + days);
    return `  • +${days} days → ${formatDateLong(d)}`;
  });
  return `Today (device local): ${formatDateLong(today)} (ISO ${isoToday})
Approximate forward anchors (use these when the player is vague — stay consistent across characters in the same turn):
${lines.join("\n")}
If the player names an exact date, use that. Otherwise do not invent a random "the 14th" / conflicting weekdays — either pick ONE anchor from above that matches their intent or stay vague ("that weekend").`;
}
