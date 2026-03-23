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
