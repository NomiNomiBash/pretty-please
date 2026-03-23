import { useRef, useEffect, useState } from "react";
import { ChatMsg } from "./ChatMsg.jsx";
import { CHARACTERS } from "../data/characters.js";
import { CD } from "../data/commitmentDisplay.js";

const ACTIONS = [
  { id: "message", l: "💬 Message" },
  { id: "poll", l: "📅 Poll" },
  { id: "nudge", l: "🔔 Nudge" },
  { id: "deadline", l: "⏰ Deadline" },
  { id: "pin", l: "📍 Pin" },
  { id: "dm", l: "🤫 DM" },
];

export function GameView({
  personalBest,
  occ,
  chars,
  msgs,
  steps,
  loading,
  narrator,
  mode,
  dmTarget,
  input,
  confirmed,
  maybeCount,
  inRange,
  onModeChange,
  onDmTargetChange,
  onInputChange,
  onSend,
  onLockIn,
  endRef,
  inputRef,
}) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 768px)").matches);

  useEffect(() => {
    if (isMobile) setPanelOpen(false);
  }, [isMobile]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const h = () => setIsMobile(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const handleModeClick = (id) => {
    onModeChange(id);
    if (id === "pin") onInputChange(occ?.venue || "");
    else if (id !== "dm") onInputChange("");
  };

  return (
    <div style={{ display: "flex", height: "100%", background: "var(--pp-bg)", overflow: "hidden" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ background: "var(--pp-bg-panel)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, borderBottom: "1px solid var(--pp-border)" }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{occ.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "var(--pp-text)", fontWeight: 600, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{occ.name} Planning 🎉</div>
            <div style={{ color: "var(--pp-text-muted)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Priya, Tom, Saskia, Marcus, Jade, Ollie, Bex, Hamish</div>
          </div>
          <button
            onClick={() => setPanelOpen((o) => !o)}
            style={{ background: "var(--pp-bg-elevated)", border: "none", borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 16, flexShrink: 0 }}
            aria-label={panelOpen ? "Hide group" : "Show group"}
          >
            {panelOpen ? "◀" : "👥"}
          </button>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ background: "var(--pp-bg-elevated)", borderRadius: 10, padding: "6px 12px", textAlign: "center", minWidth: 56 }}>
              <div className="font-bitcount font-bitcount-600" style={{ color: "var(--pp-text)", fontSize: 26, fontWeight: 600, lineHeight: 1 }}>{steps}</div>
              <div style={{ color: "var(--pp-text-muted)", fontSize: 9, letterSpacing: "0.8px", textTransform: "uppercase", marginTop: 1 }}>steps</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", background: "var(--pp-bg-page)", backgroundImage: "radial-gradient(circle at 15% 25%,rgba(37,211,102,0.04) 0%,transparent 55%)" }}>
          {msgs.map((m) => (
            <ChatMsg key={m.id} msg={m} />
          ))}
          {loading && (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <span style={{ color: "var(--pp-text-muted)", fontSize: 11 }}>someone is typing...</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {narrator && (
          <div style={{ background: "var(--pp-system-msg)", borderTop: "1px solid var(--pp-border)", padding: "5px 16px", textAlign: "center", flexShrink: 0 }}>
            <span style={{ color: "var(--pp-text-muted)", fontSize: 12, fontStyle: "italic" }}>💬 {narrator}</span>
          </div>
        )}

        <div style={{ background: "var(--pp-bg-panel)", borderTop: "1px solid var(--pp-border)", padding: "7px 14px", display: "flex", gap: 6, overflowX: "auto", flexShrink: 0 }}>
          {ACTIONS.map((a) => (
            <button
              key={a.id}
              onClick={() => handleModeClick(a.id)}
              style={{
                background: mode === a.id ? "#25D366" : "var(--pp-bg-elevated)",
                color: mode === a.id ? "#003d20" : "var(--pp-text-muted)",
                border: "none",
                borderRadius: 20,
                padding: "6px 13px",
                fontSize: 12,
                fontWeight: mode === a.id ? 700 : 400,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}
            >
              {a.l}
            </button>
          ))}
        </div>

        <div style={{ background: "var(--pp-bg-panel)", padding: "8px 12px", display: "flex", gap: 8, alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
          {mode === "pin" ? (
            <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
                disabled={loading}
                placeholder={occ?.venue || "Enter location..."}
                style={{ flex: 1, background: "#1A3A2C", border: "1px solid #4FC3F744", borderRadius: 24, padding: "10px 16px", color: "#4FC3F7", fontSize: 14, outline: "none", opacity: loading ? 0.6 : 1 }}
              />
              <button onClick={onSend} disabled={loading} style={{ background: loading ? "var(--pp-bg-elevated)" : "#1A3A2C", border: "1px solid #4FC3F766", borderRadius: "50%", width: 44, height: 44, cursor: loading ? "default" : "pointer", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: loading ? "var(--pp-text-muted)" : "#4FC3F7", transition: "background 0.15s" }}>
                {loading ? "⏳" : "📍"}
              </button>
            </div>
          ) : mode === "poll" ? (
            <button onClick={onSend} disabled={loading} style={{ flex: 1, background: loading ? "var(--pp-bg-elevated)" : "#1A2A3A", color: loading ? "var(--pp-text-muted)" : "#90CAF9", border: "1px solid #90CAF944", borderRadius: 24, padding: 12, fontSize: 14, fontWeight: 600, cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1, transition: "all 0.15s" }}>
              📅 Poll upcoming dates
            </button>
          ) : mode === "dm" ? (
            <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}>
              <select value={dmTarget} onChange={(e) => onDmTargetChange(e.target.value)} disabled={loading} style={{ background: "var(--pp-bg-elevated)", border: "none", borderRadius: 20, padding: "10px 12px", color: "var(--pp-text)", fontSize: 13, outline: "none", cursor: "pointer", flexShrink: 0 }}>
                {CHARACTERS.map((c) => (
                  <option key={c.id} value={c.id}>{c.avatar} {c.name}</option>
                ))}
              </select>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
                disabled={loading}
                placeholder="Private message..."
                style={{ flex: 1, background: "var(--pp-bg-elevated)", border: "none", borderRadius: 24, padding: "10px 16px", color: "var(--pp-text)", fontSize: 14, outline: "none", opacity: loading ? 0.6 : 1, minWidth: 0 }}
              />
              <button onClick={onSend} disabled={loading || !input.trim()} style={{ background: !loading && input.trim() ? "#1A3A5C" : "var(--pp-bg-elevated)", border: "none", borderRadius: "50%", width: 44, height: 44, cursor: !loading && input.trim() ? "pointer" : "default", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: !loading && input.trim() ? "#90CAF9" : "var(--pp-text-muted)", transition: "background 0.15s" }}>
                {loading ? "⏳" : "▶"}
              </button>
            </div>
          ) : (
            <>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
                disabled={loading}
                placeholder={mode === "nudge" ? "Guilt them gently..." : mode === "deadline" ? "Set your deadline..." : "Message the group..."}
                style={{ flex: 1, background: "var(--pp-bg-elevated)", border: "none", borderRadius: 24, padding: "10px 16px", color: "var(--pp-text)", fontSize: 14, outline: "none", opacity: loading ? 0.6 : 1 }}
              />
              <button onClick={onSend} disabled={loading || !input.trim()} style={{ background: !loading && input.trim() ? "#25D366" : "var(--pp-bg-elevated)", border: "none", borderRadius: "50%", width: 44, height: 44, cursor: !loading && input.trim() ? "pointer" : "default", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: !loading && input.trim() ? "#003d20" : "var(--pp-text-muted)", transition: "background 0.15s" }}>
                {loading ? "⏳" : "▶"}
              </button>
            </>
          )}
        </div>
      </div>

      {panelOpen && isMobile && (
        <div
          onClick={() => setPanelOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 5 }}
          aria-hidden="true"
        />
      )}
      <div
        style={{
          width: panelOpen ? (isMobile ? 280 : 258) : 0,
          background: "var(--pp-bg-panel)",
          display: "flex",
          flexDirection: "column",
          borderLeft: panelOpen ? "1px solid var(--pp-border)" : "none",
          flexShrink: 0,
          overflow: "hidden",
          transition: "width 0.25s ease",
          ...(isMobile && panelOpen ? { position: "fixed", right: 0, top: 0, bottom: 0, zIndex: 10, boxShadow: "-4px 0 20px rgba(0,0,0,0.3)" } : {}),
        }}
      >
        <div style={{ padding: 16, borderBottom: "1px solid var(--pp-border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontSize: 30 }}>{occ.emoji}</div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              {personalBest !== null && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "var(--pp-text-muted)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.6px" }}>personal best</div>
                  <div className="font-bitcount font-bitcount-600" style={{ color: "#FFB830", fontSize: 20, fontWeight: 600, lineHeight: 1.1 }}>{personalBest} <span style={{ fontSize: 11, color: "var(--pp-text-muted)" }}>steps</span></div>
                </div>
              )}
              {isMobile && (
                <button onClick={() => setPanelOpen(false)} style={{ background: "none", border: "none", color: "var(--pp-text-muted)", fontSize: 18, cursor: "pointer", padding: 4 }} aria-label="Close">✕</button>
              )}
            </div>
          </div>
          <div style={{ color: "var(--pp-text)", fontWeight: 700, fontSize: 14, lineHeight: 1.3, marginTop: 4 }}>{occ.name}</div>
          <div style={{ color: "var(--pp-text-muted)", fontSize: 11, marginTop: 3, lineHeight: 1.4 }}>{occ.venue}</div>
          <div style={{ marginTop: 12, background: "var(--pp-bg-elevated)", borderRadius: 10, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 38, fontWeight: 800, lineHeight: 1, color: confirmed.length >= occ.min ? "#25D366" : confirmed.length > 0 ? "#FFB830" : "var(--pp-text-muted)", transition: "color 0.3s" }}>{confirmed.length}</span>
              <span style={{ color: "var(--pp-text-muted)", fontSize: 16 }}>/ {occ.target}</span>
            </div>
            <div style={{ color: "var(--pp-text-muted)", fontSize: 11, textAlign: "center", marginTop: 3 }}>confirmed</div>
            <div style={{ background: "var(--pp-bubble-poll-bar)", borderRadius: 4, height: 4, margin: "8px 0 5px", overflow: "hidden" }}>
              <div style={{ background: "#25D366", width: `${Math.min(100, (confirmed.length / occ.target) * 100)}%`, height: "100%", borderRadius: 4, transition: "width 0.5s ease" }} />
            </div>
            {maybeCount > 0 && <div style={{ color: "#FFB830", fontSize: 11, textAlign: "center" }}>+{maybeCount} maybe{maybeCount !== 1 ? "s" : ""}</div>}
            <div style={{ color: "var(--pp-text-muted)", fontSize: 10, textAlign: "center", marginTop: 5 }}>need {occ.min}–{occ.max} people</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
          <div style={{ color: "var(--pp-text-muted)", fontSize: 10, padding: "0 16px 6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>The Group</div>
          {chars.map((c) => {
            const ch = CHARACTERS.find((x) => x.id === c.id);
            const d = CD[c.commitment] || CD.unknown;
            return (
              <div key={c.id} style={{ padding: "6px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{c.avatar}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "var(--pp-text)", fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: d.color }}>{d.label}</div>
                </div>
                <span style={{ fontSize: 15, flexShrink: 0 }}>{d.icon}</span>
              </div>
            );
          })}
        </div>

        <div style={{ padding: 14, borderTop: "1px solid var(--pp-border)" }}>
          <div style={{ color: "var(--pp-text-muted)", fontSize: 11, textAlign: "center", marginBottom: 8, lineHeight: 1.4 }}>
            {steps === 0 ? "Send your first message to begin" : confirmed.length < occ.min ? `${occ.min - confirmed.length} more needed to lock in` : confirmed.length > occ.max ? `${confirmed.length - occ.max} too many — manage the excess` : "You're in range — lock in?"}
          </div>
          <button onClick={onLockIn} style={{ width: "100%", background: inRange ? "#25D366" : "var(--pp-bg-elevated)", color: inRange ? "#003d20" : "var(--pp-text-muted)", border: "none", borderRadius: 10, padding: 13, fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.2s" }}>
            🔒 Lock In
          </button>
        </div>
      </div>
    </div>
  );
}
