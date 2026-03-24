import { useEffect, useState } from "react";
import { pickOccasionForCalendarDay } from "../data/occasions.js";
import { getGroupSizeForOccasion } from "../data/namePool.js";

// ─── Font style helper ───────────────────────────────────────────────────────

const bitcount = (weight = 400) => ({
  fontFamily: '"Bitcount Grid Double Ink", system-ui',
  fontOpticalSizing: "auto",
  fontWeight: weight,
  fontStyle: "normal",
  fontVariationSettings: '"slnt" 0, "CRSV" 0.5, "ELSH" 0, "ELXP" 0, "SZP1" 0, "SZP2" 0, "XPN1" 0, "XPN2" 0, "YPN1" 0, "YPN2" 0',
});

const nunito = (weight = 400) => ({
  fontFamily: '"Nunito", sans-serif',
  fontOpticalSizing: "auto",
  fontWeight: weight,
  fontStyle: "normal",
});

// ─── Doodle SVGs ────────────────────────────────────────────────────────────

const Squiggle = ({ color = "#FFB830", style = {} }) => (
  <svg width="48" height="12" viewBox="0 0 48 12" fill="none" style={style}>
    <path d="M2 6 Q8 1 14 6 Q20 11 26 6 Q32 1 38 6 Q44 11 46 6"
      stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

const Star = ({ color = "#FFB830", size = 16, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style}>
    <path d="M8 1 L9.5 6 L14.5 6 L10.5 9 L12 14 L8 11 L4 14 L5.5 9 L1.5 6 L6.5 6 Z"
      stroke={color} strokeWidth="1.2" fill="none" strokeLinejoin="round" />
  </svg>
);

const Scribble = ({ color = "#25D366", style = {} }) => (
  <svg width="60" height="18" viewBox="0 0 60 18" fill="none" style={style}>
    <path d="M3 9 Q10 3 18 9 Q26 15 34 9 Q42 3 50 9 Q55 13 58 9"
      stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.35" />
    <path d="M3 12 Q10 6 18 12 Q26 18 34 12 Q42 6 50 12 Q55 16 58 12"
      stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.2" />
  </svg>
);

// Loose hand-drawn circle for annotating a number
const CircleAnnotation = ({ color = "#25D366", style = {} }) => (
  <svg width="52" height="40" viewBox="0 0 52 40" fill="none" style={{ pointerEvents:"none", ...style }}>
    <path d="M26 3 C38 1 50 8 50 18 C50 30 40 38 26 38 C12 38 2 30 2 18 C2 8 14 2 26 3 Z"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.55"
      strokeDasharray="3 2" />
  </svg>
);

// Cross / plus mark — scattered decoration
const Cross = ({ color = "#c0b8ae", size = 10, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" fill="none" style={style}>
    <path d="M5 1 L5 9 M1 5 L9 5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

// Small curved underline for the occasion name
const NameUnderline = ({ color = "#FFB830", style = {} }) => (
  <svg width="80" height="8" viewBox="0 0 80 8" fill="none" style={style}>
    <path d="M2 5 Q20 2 40 5 Q60 8 78 4"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.6" />
  </svg>
);

// Dog-ear fold for sticky note corner
const DogEar = ({ style = {} }) => (
  <div style={{
    position: "absolute", bottom: 0, right: 0, width: 20, height: 20,
    background: "linear-gradient(225deg, #e8e0d0 50%, #FFFDF5 50%)",
    borderTop: "1px solid rgba(0,0,0,0.06)",
    borderLeft: "1px solid rgba(0,0,0,0.06)",
    ...style
  }} />
);

const WashiTape = ({ color = "#FFD6D6", label = "", style = {} }) => (
  <div style={{
    background: color, opacity: 0.75, padding: "4px 20px",
    transform: "rotate(-1.5deg)", display: "inline-block",
    ...nunito(700), fontSize: 13, color: "#5a3a3a",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)", letterSpacing: "0.5px",
    ...style
  }}>{label}</div>
);

const DoodleCheckbox = ({ checked = false, color = "#25D366" }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
    <rect x="1.5" y="1.5" width="15" height="15" rx="3" stroke={checked ? color : "#8696A0"}
      strokeWidth="1.5" fill={checked ? color + "22" : "none"} />
    {checked && <path d="M5 9 L8 12 L13 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
  </svg>
);

const HolePunch = ({ style = {} }) => (
  <div style={{
    width: 18, height: 18, borderRadius: "50%",
    background: "rgba(0,0,0,0.12)", border: "1.5px solid rgba(0,0,0,0.08)",
    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.15)",
    ...style
  }} />
);

// ─── Highlight component ─────────────────────────────────────────────────────

const Highlight = ({ children, color = "#FFF176", rotate = "-0.5deg" }) => (
  <span style={{ position: "relative", display: "inline" }}>
    <span style={{
      position: "absolute", inset: "-2px -4px", background: color,
      transform: `rotate(${rotate})`, borderRadius: 3, opacity: 0.6, zIndex: 0
    }} />
    <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
  </span>
);

// ─── Main component ──────────────────────────────────────────────────────────

const HOW_CLOCK = { e: "🗓️", k: "Calendar", v: "4 weeks total — 4 steps per week" };

const HOW_GROUPS = [
  {
    hint: "what you'll use most",
    items: [{ e: "💬", k: "Message", v: "talk to the whole group" }],
  },
  {
    hint: "poll, place, slide into DMs",
    items: [
      { e: "📅", k: "Poll", v: "pick dates together" },
      { e: "📍", k: "Pin", v: "drop a venue" },
      { e: "🤫", k: "DM", v: "message one person privately" },
    ],
  },
  {
    hint: "one tap per game — use them wisely",
    items: [
      { e: "🔔", k: "Nudge", v: "poke who have gone quiet" },
      { e: "⏰", k: "Deadline", v: "end-of-week ultimatum" },
    ],
  },
];

const HOW_LOCK = { e: "🔒", k: "Lock in", v: "when you think you've got them all" };

/** Flat rows (clock → tools → lock) for simple `.map` layouts. */
const HOW_IT_WORKS = [HOW_CLOCK, ...HOW_GROUPS.flatMap((g) => g.items), HOW_LOCK];

function HowRow({ e, k, v }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, whiteSpace: "nowrap" }}>
      <span style={{ fontSize: 12, flexShrink: 0, width: 16 }}>{e}</span>
      <span className="mansalva" style={{ color: "#2a2a2a", fontSize: 14, flexShrink: 0, minWidth: 72 }}>{k}</span>
      <span style={{ color: "#7a6f64", fontSize: 11, ...nunito(400), overflow: "hidden", textOverflow: "ellipsis" }}>{v}</span>
    </div>
  );
}

const STAT_COLORS = ["#25D366", "#FFB830", "#8696A0"];

export function IntroScreen({ onStart, occasionOverride = null }) {
  const [occ, setOcc] = useState(
    () => occasionOverride || pickOccasionForCalendarDay()
  );
  useEffect(() => {
    if (occasionOverride) setOcc(occasionOverride);
  }, [occasionOverride]);

  return (
    <div style={{
      height: "100%", overflowY: "auto",
      background: "#F5F0E8",
      backgroundImage: `
        linear-gradient(to bottom, #F5F0E8 0, #F5F0E8 68px, transparent 68px),
        repeating-linear-gradient(transparent, transparent 31px, rgba(100,120,200,0.08) 31px, rgba(100,120,200,0.08) 32px)
      `,
      backgroundPosition: "0 0, 0 36px",
      fontFamily: "'Nunito', sans-serif",
      padding: "0 0 48px",
      position: "relative",
    }}>

      {/* Margin line */}
      <div style={{
        position: "fixed", left: 52, top: 0, bottom: 0,
        width: 1.5, background: "rgba(255,120,120,0.3)", pointerEvents: "none", zIndex: 0
      }} />

      {/* Hole punches — left edge */}
      <div style={{ position: "fixed", left: 18, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "space-evenly", alignItems: "center", pointerEvents: "none", zIndex: 2 }}>
        <HolePunch />
        <HolePunch />
        <HolePunch />
      </div>

      <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 24px 0 68px", position: "relative", zIndex: 1 }}>

        {/* ── Title ── */}
        <div style={{ textAlign: "left", marginBottom: 32, marginTop: 72, position: "relative" }}>
          <Star color="#FFB830" size={10} style={{ position: "absolute", top: 4, right: 24, opacity: 0.5 }} />
          <Star color="#25D366" size={8} style={{ position: "absolute", top: 18, right: 8, opacity: 0.35 }} />
          <Cross color="#c0b8ae" size={9} style={{ position: "absolute", top: 0, right: 48, opacity: 0.4 }} />
          <Cross color="#FFB830" size={7} style={{ position: "absolute", top: 30, right: 20, opacity: 0.3 }} />

          {/* London edition badge — top right above title */}
          <div style={{
            position: "absolute", top: -36, right: 0,
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#e8e0d0", borderRadius: 4,
            padding: "3px 10px 3px 8px",
            transform: "rotate(-0.5deg)",
            border: "1px solid rgba(0,0,0,0.08)",
          }}>
            <span style={{ fontSize: 14 }}>🇬🇧</span>
            <span style={{ ...bitcount(400), color: "#8b6914", fontSize: 14, letterSpacing: "2px", textTransform: "uppercase" }}>
              london edition
            </span>
          </div>

          <div style={{ position: "relative", display: "inline-block" }}>
            <Scribble color="#25D366" style={{ position: "absolute", bottom: -6, left: 0 }} />
            <h1 className="mansalva" style={{
              color: "#1a1a1a", fontSize: 52, lineHeight: 1, margin: 0,
              position: "relative", letterSpacing: "0.3px", whiteSpace: "nowrap",
            }}>
              pretty please
            </h1>
          </div>

          <div style={{ marginTop: 12, textAlign: "right" }}>
            <p className="mansalva" style={{ color: "#7a6f64", fontSize: 14, margin: 0, letterSpacing: "0.3px" }}>
              a game daily for your quiet misery of organising
            </p>
          </div>
        </div>

        {/* ── Occasion sticky ── */}
        <div style={{ marginBottom: 12 }}>
          <span style={{ ...bitcount(400), color: "#9a8e83", fontSize: 17, letterSpacing: "0.3px" }}>
            today's mission ↓
          </span>
        </div>
        <div style={{
          background: "#FFFDF5",
          borderRadius: 4,
          padding: "24px 22px",
          marginBottom: 36,
          boxShadow: "2px 3px 12px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)",
          position: "relative",
          transform: "rotate(0.4deg)",
        }}>
          {/* Tape across top */}
          <div style={{
            position: "absolute", top: -10, left: "50%", transform: "translateX(-50%) rotate(-1deg)",
            background: "#FFF3CC", opacity: 0.8, width: 80, height: 20, borderRadius: 2,
            boxShadow: "0 1px 2px rgba(0,0,0,0.08)"
          }} />

          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
            <span style={{ fontSize: 40, lineHeight: 1, flexShrink: 0, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.12))" }}>
              {occ.emoji}
            </span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="mansalva" style={{ color: "#1a1a1a", fontSize: 26, lineHeight: 1 }}>
                  {occ.name}
                </span>
                <Star color="#FFB830" size={14} style={{ marginTop: 2 }} />
              </div>
              {/* Curved underline beneath occasion name */}
              <NameUnderline color="#FFB830" style={{ marginTop: -2, marginLeft: 1 }} />
              <div style={{ color: "#9a8e83", fontSize: 11.5, marginTop: 2, ...nunito(400) }}>{occ.venue}</div>
            </div>
          </div>

          {/* Note text with hand-drawn left border */}
          <div style={{
            fontSize: 12, color: "#7a6f64", lineHeight: 1.65,
            borderLeft: "2.5px solid #FFD6D6", paddingLeft: 10,
            fontStyle: "italic", marginBottom: 18, ...nunito(400)
          }}>
            {occ.note}
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 28 }}>
            {[
              { v: occ.target, l: "target", color: "#25D366", annotate: true },
              { v: `${occ.min}–${occ.max}`, l: "range", color: "#FFB830" },
              { v: getGroupSizeForOccasion(occ), l: "in the group", color: "#8696A0" },
            ].map(({ v, l, color, annotate }) => (
              <div key={l} style={{ display: "flex", flexDirection: "column", gap: 4, position: "relative" }}>
                {annotate && (
                  <CircleAnnotation color="#25D366" style={{ position: "absolute", top: -11, left: -14, zIndex: 0 }} />
                )}
                <span style={{ color, fontSize: 28, lineHeight: 1, ...bitcount(600), position: "relative", zIndex: 1 }}>{v}</span>
                <span style={{ color: "#9a8e83", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.4px", ...bitcount(300) }}>{l}</span>
              </div>
            ))}
          </div>

          {/* Dog-ear fold bottom-right */}
          <DogEar />
          {/* Doodle corner star — moved to avoid dog-ear */}
          <Star color="#FFB830" size={14} style={{ position: "absolute", bottom: 22, right: 16, opacity: 0.4 }} />
        </div>

        {/* ── CTAs ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ marginBottom: 10 }}>
            <button
              onClick={() => onStart(occ)}
              className="mansalva"
              style={{
                width: "100%", background: "#25D366", color: "#002a10",
                border: "2px solid #1db356",
                borderRadius: 10, padding: "15px", fontSize: 22,
                cursor: "pointer", letterSpacing: "0.3px", transition: "transform 0.1s, background 0.15s",
                boxShadow: "3px 3px 0 #1a9448",
                position: "relative",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translate(-1px,-1px)"; e.currentTarget.style.boxShadow = "4px 4px 0 #1a9448"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "3px 3px 0 #1a9448"; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "translate(2px,2px)"; e.currentTarget.style.boxShadow = "1px 1px 0 #1a9448"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "3px 3px 0 #1a9448"; }}
            >
              let's do this 🤞
            </button>
          </div>

        </div>

        {/* ── How it works — post-it ── */}
        <div style={{
          background: "#FFF9C4",
          borderRadius: 2,
          padding: "20px 18px 16px",
          boxShadow: "3px 4px 12px rgba(0,0,0,0.13), 0 0 0 1px rgba(0,0,0,0.04)",
          transform: "rotate(0.8deg)",
          position: "relative",
          marginBottom: 8,
        }}>
          {/* Post-it fold corner */}
          <div style={{
            position: "absolute", bottom: 0, right: 0,
            width: 0, height: 0,
            borderStyle: "solid",
            borderWidth: "0 0 22px 22px",
            borderColor: "transparent transparent #e8e090 transparent",
            filter: "drop-shadow(-1px -1px 1px rgba(0,0,0,0.08))",
          }} />
          {/* Top sticky strip shadow */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 6,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.06), transparent)",
            borderRadius: "2px 2px 0 0",
          }} />

          <div style={{ marginBottom: 12 }}>
            <span style={{ color: "#9a8e83", fontSize: 14, textTransform: "uppercase", letterSpacing: "1px", ...bitcount(400) }}>
              how it works
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <HowRow {...HOW_CLOCK} />
            {HOW_GROUPS.map((tier) => (
              <div key={tier.hint} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span className="mansalva" style={{ fontSize: 11, color: "#a0988c" }}>{tier.hint}</span>
                {tier.items.map((row) => (
                  <HowRow key={`${tier.hint}-${row.k}`} {...row} />
                ))}
              </div>
            ))}
            <HowRow {...HOW_LOCK} />
          </div>

        </div>

        <div style={{ marginTop: 24, marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: 0.45 }}>
          <Squiggle color="#8696A0" />
          <span className="mansalva" style={{ fontSize: 12, color: "#9a8e83" }}>if you know you know</span>
          <Star color="#FFB830" size={12} />
        </div>

      </div>
    </div>
  );
}