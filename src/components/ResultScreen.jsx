// Planner / notebook styling aligned with IntroScreen (grid paper, margin, punches).

import { useEffect, useState } from "react";

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

const Star = ({ color = "#FFB830", size = 16, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style}>
    <path
      d="M8 1 L9.5 6 L14.5 6 L10.5 9 L12 14 L8 11 L4 14 L5.5 9 L1.5 6 L6.5 6 Z"
      stroke={color}
      strokeWidth="1.2"
      fill="none"
      strokeLinejoin="round"
    />
  </svg>
);

const Squiggle = ({ color = "#FFB830", style = {} }) => (
  <svg width="48" height="12" viewBox="0 0 48 12" fill="none" style={style}>
    <path
      d="M2 6 Q8 1 14 6 Q20 11 26 6 Q32 1 38 6 Q44 11 46 6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const Scribble = ({ color = "#25D366", style = {} }) => (
  <svg width="60" height="18" viewBox="0 0 60 18" fill="none" style={style}>
    <path
      d="M3 9 Q10 3 18 9 Q26 15 34 9 Q42 3 50 9 Q55 13 58 9"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.35"
    />
    <path
      d="M3 12 Q10 6 18 12 Q26 18 34 12 Q42 6 50 12 Q55 16 58 12"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.2"
    />
  </svg>
);

const Cross = ({ color = "#c0b8ae", size = 10, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" fill="none" style={style}>
    <path d="M5 1 L5 9 M1 5 L9 5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const HolePunch = ({ style = {} }) => (
  <div
    style={{
      width: 18,
      height: 18,
      borderRadius: "50%",
      background: "rgba(0,0,0,0.12)",
      border: "1.5px solid rgba(0,0,0,0.08)",
      boxShadow: "inset 0 1px 3px rgba(0,0,0,0.15)",
      ...style,
    }}
  />
);

/** Supports legacy string-only attendees from dev previews. */
function attendeeParts(entry) {
  if (entry && typeof entry === "object" && "name" in entry) {
    return { key: entry.name, name: entry.name, avatar: entry.avatar || "🧑" };
  }
  const name = String(entry ?? "");
  return { key: name, name, avatar: "🧑" };
}

const DogEar = ({ style = {} }) => (
  <div
    style={{
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 20,
      height: 20,
      background: "linear-gradient(225deg, #e8e0d0 50%, #FFFDF5 50%)",
      borderTop: "1px solid rgba(0,0,0,0.06)",
      borderLeft: "1px solid rgba(0,0,0,0.06)",
      ...style,
    }}
  />
);

export function ResultScreen({ result, occasion, steps, personalBest, onRestart }) {
  const win = result.type === "win";
  const [gameUrl, setGameUrl] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    setGameUrl(`${window.location.origin}${window.location.pathname || "/"}`);
  }, []);

  const shareGame = async () => {
    const url = gameUrl || `${window.location.origin}${window.location.pathname || "/"}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "pretty please", text: "Organise the group chat — if you dare.", url });
        return;
      }
    } catch {
      /* user cancelled share sheet */
    }
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2200);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        background: "#F5F0E8",
        backgroundImage: `
        linear-gradient(to bottom, #F5F0E8 0, #F5F0E8 68px, transparent 68px),
        repeating-linear-gradient(transparent, transparent 31px, rgba(100,120,200,0.08) 31px, rgba(100,120,200,0.08) 32px)
      `,
        backgroundPosition: "0 0, 0 36px",
        fontFamily: "'Nunito', sans-serif",
        padding: "0 0 48px",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "fixed",
          left: 52,
          top: 0,
          bottom: 0,
          width: 1.5,
          background: "rgba(255,120,120,0.3)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "fixed",
          left: 18,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
          alignItems: "center",
          pointerEvents: "none",
          zIndex: 2,
        }}
      >
        <HolePunch />
        <HolePunch />
        <HolePunch />
      </div>

      <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 24px 0 68px", position: "relative", zIndex: 1 }}>
        {/* Title band */}
        <div style={{ textAlign: "left", marginBottom: 28, marginTop: 48, position: "relative" }}>
          <Star color="#FFB830" size={10} style={{ position: "absolute", top: 4, right: 8, opacity: 0.5 }} />
          <Cross color="#c0b8ae" size={9} style={{ position: "absolute", top: 0, right: 36, opacity: 0.4 }} />

          <div style={{ position: "relative", display: "inline-block" }}>
            <Scribble color="#25D366" style={{ position: "absolute", bottom: -6, left: 0 }} />
            <h1
              className="mansalva"
              style={{
                color: "#1a1a1a",
                fontSize: 40,
                lineHeight: 1,
                margin: 0,
                letterSpacing: "0.3px",
              }}
            >
              it&apos;s a wrap 🌯
            </h1>
          </div>

          <div style={{ marginTop: 10, ...nunito(400), color: "#7a6f64", fontSize: 14 }}>
            {occasion?.name ? (
              <>
                <span className="mansalva" style={{ color: "#9a8e83" }}>
                  {occasion.emoji} {occasion.name}
                </span>
                <span style={{ color: "#c4bbb3" }}> · </span>
                <span style={{ fontStyle: "italic" }}>how did we do?</span>
              </>
            ) : (
              <span style={{ fontStyle: "italic" }}>how did we do?</span>
            )}
          </div>
        </div>

        {/* Main result — cream “sticky” like intro occasion */}
        <div
          style={{
            background: "#FFFDF5",
            borderRadius: 4,
            padding: "22px 20px 20px",
            marginBottom: 24,
            boxShadow: "2px 3px 12px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)",
            position: "relative",
            transform: "rotate(-0.35deg)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -8,
              left: "50%",
              transform: "translateX(-50%) rotate(1deg)",
              background: "#FFE4E4",
              opacity: 0.85,
              width: 72,
              height: 18,
              borderRadius: 2,
              boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
            }}
          />

          <div style={{ textAlign: "center", fontSize: 52, lineHeight: 1, marginBottom: 12 }}>
            {win ? "🎉" : "💀"}
          </div>
          <h2
            className="mansalva"
            style={{ color: "#1a1a1a", fontSize: 24, fontWeight: 800, margin: 0, textAlign: "center", letterSpacing: "0.2px" }}
          >
            {result.title}
          </h2>
          <p
            style={{
              color: "#7a6f64",
              fontSize: 13,
              lineHeight: 1.65,
              marginTop: 14,
              textAlign: "center",
              ...nunito(400),
              fontStyle: "italic",
            }}
          >
            {result.message}
          </p>

          {result.attendees?.length > 0 && (
            <div
              style={{
                marginTop: 18,
                paddingTop: 16,
                borderTop: "1px dashed rgba(0,0,0,0.08)",
              }}
            >
              <div style={{ color: "#9a8e83", fontSize: 11, marginBottom: 10, textAlign: "center", ...bitcount(400), textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {win ? "who confirmed" : "who said yes"}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {result.attendees.map((entry, i) => {
                  const { key, name, avatar } = attendeeParts(entry);
                  const chipWin = {
                    background: "#25D366",
                    color: "#002a10",
                    border: "1px solid #1db356",
                    boxShadow: "0 1px 0 rgba(0,0,0,0.06)",
                  };
                  const chipLoss = {
                    background: "#F0F4F8",
                    color: "#37474F",
                    border: "1px solid #B0BEC5",
                    boxShadow: "none",
                  };
                  const chip = win ? chipWin : chipLoss;
                  return (
                    <span
                      key={`${key}-${i}`}
                      className="mansalva"
                      style={{
                        ...chip,
                        padding: "5px 12px",
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span style={{ fontSize: 17, lineHeight: 1 }} aria-hidden>
                        {avatar}
                      </span>
                      {name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <DogEar />
          <Star color="#FFB830" size={14} style={{ position: "absolute", bottom: 20, right: 14, opacity: 0.35 }} />
        </div>

        {win && result.isNewBest && (
          <div
            style={{
              marginBottom: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }} aria-hidden>
              🏆
            </span>
            <span style={{ color: "#1a7a40", fontSize: 13, ...bitcount(600), letterSpacing: "0.4px" }}>
              New personal best!
            </span>
          </div>
        )}

        {/* Stats — same rhythm as intro stats row */}
        <div style={{ display: "flex", gap: 24, justifyContent: "center", marginBottom: 8, flexWrap: "wrap" }}>
          {[
            { v: steps, l: "steps", color: "#FFB830" },
            ...(personalBest !== null && !result.isNewBest
              ? [{ v: personalBest, l: "personal best", color: "#8696A0" }]
              : []),
          ].map(({ v, l, color }) => (
            <div key={l} style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center", minWidth: 72 }}>
              <span style={{ color, fontSize: 30, lineHeight: 1, ...bitcount(600) }}>{v}</span>
              <span style={{ color: "#9a8e83", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.4px", ...bitcount(300) }}>
                {l}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onRestart}
          className="mansalva"
          style={{
            width: "100%",
            marginTop: 22,
            background: "#25D366",
            color: "#002a10",
            border: "2px solid #1db356",
            borderRadius: 10,
            padding: "14px 15px 12px",
            fontSize: 22,
            lineHeight: 1.2,
            cursor: "pointer",
            letterSpacing: "0.3px",
            transition: "transform 0.1s, background 0.15s",
            boxShadow: "3px 3px 0 #1a9448",
            position: "relative",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translate(-1px,-1px)";
            e.currentTarget.style.boxShadow = "4px 4px 0 #1a9448";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "";
            e.currentTarget.style.boxShadow = "3px 3px 0 #1a9448";
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "translate(2px,2px)";
            e.currentTarget.style.boxShadow = "1px 1px 0 #1a9448";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "";
            e.currentTarget.style.boxShadow = "3px 3px 0 #1a9448";
          }}
        >
          <span style={{ display: "block" }}>Try Again</span>
          <span style={{ display: "block", fontSize: 14, opacity: 0.92, marginTop: 2, fontWeight: 600 }}>
            (They Still Won&apos;t Come)
          </span>
        </button>

        {/* Share */}
        <div style={{ marginTop: 14, marginBottom: 0 }}>
          <button
            type="button"
            onClick={shareGame}
            className="mansalva"
            style={{
              width: "100%",
              background: "#FFFDF5",
              color: "#2a2a2a",
              border: "2px solid #d4ccc0",
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: 16,
              cursor: "pointer",
              letterSpacing: "0.2px",
              boxShadow: "2px 2px 0 rgba(0,0,0,0.06)",
              transition: "transform 0.1s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translate(-1px,-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "";
            }}
          >
            {linkCopied ? "Link copied — send it 😈" : "Share link to the game 🔗"}
          </button>
          {gameUrl ? (
            <p
              style={{
                marginTop: 8,
                marginBottom: 0,
                fontSize: 10,
                color: "#9a8e83",
                wordBreak: "break-all",
                textAlign: "center",
                ...nunito(400),
              }}
            >
              {gameUrl}
            </p>
          ) : null}
        </div>

        <div
          style={{
            marginTop: 20,
            marginBottom: 0,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            opacity: 0.45,
            textAlign: "center",
          }}
        >
          <Squiggle color="#8696A0" />
          <span className="mansalva" style={{ fontSize: 12, color: "#9a8e83", lineHeight: 1.35 }}>
            PSA: think twice before you flake your friends
          </span>
          <Star color="#FFB830" size={12} />
        </div>

        <div
          style={{
            background: "#FFF9C4",
            borderRadius: 2,
            padding: "8px 12px 10px",
            marginTop: 10,
            marginBottom: 36,
            marginLeft: "auto",
            marginRight: 0,
            maxWidth: 168,
            boxShadow: "3px 5px 14px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)",
            transform: "rotate(3.5deg)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 0,
              height: 0,
              borderStyle: "solid",
              borderWidth: "0 0 12px 12px",
              borderColor: "transparent transparent #e8e090 transparent",
            }}
          />
          <p
            className="mansalva"
            style={{
              color: "#5a4a3a",
              fontSize: 14,
              lineHeight: 1.3,
              margin: 0,
              textAlign: "center",
            }}
          >
            same time tmr??
          </p>
        </div>
      </div>
    </div>
  );
}
