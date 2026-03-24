import { useRef, useEffect, useState } from "react";
import { ChatMsg } from "./ChatMsg.jsx";
import { totalHeadcountIncludingPlayer } from "../utils/scoring.js";

const WA_GREEN    = "#25D366";
const WA_HEADER   = "#075E54";
const WA_TEAL     = "#128C7E";
const WA_SENT     = "#DCF8C6";
const WA_SENT_TXT = "#111";
const WA_BG       = "#E5DDD5";

const TIER_PRIMARY = [{ id: "message", l: "💬 Message" }];
const TIER_SECONDARY = [
  { id: "poll", l: "📅 Poll" },
  { id: "pin", l: "📍 Pin" },
  { id: "dm", l: "🤫 DM" },
];
const TIER_LAST = [
  { id: "nudge", l: "🔔 Nudge" },
  { id: "deadline", l: "⏰ Deadline" },
];

/* ── tiny icon helpers ── */
const Icon = ({ d, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d={d} />
  </svg>
);
const BackIcon   = () => <Icon size={20} d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />;
const VideoIcon  = () => <Icon size={22} d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />;
const PhoneIcon  = () => <Icon size={20} d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />;
const MenuIcon   = () => <Icon size={22} d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />;
const AttachIcon = () => <Icon size={22} d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" />;
const EmojiIcon  = () => <Icon size={22} d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />;
const MicIcon    = () => <Icon size={22} d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />;
const SendIcon   = () => <Icon size={22} d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />;
const CloseIcon  = () => <Icon size={18} d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />;

/* ── WA wallpaper tile ── */
const WA_TILE = `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`;

export function GameView({
  personalBest,
  occ,
  chars,
  msgs,
  steps,
  weeksLeft,
  loading,
  narrator,
  mode,
  deadlineActive,
  nudgeUsed,
  deadlineUsed,
  pinSuggestions,
  pollDates,
  dmTarget,
  input,
  confirmed,
  maybeCount,
  inRange,
  onModeChange,
  onDmTargetChange,
  onInputChange,
  onPinSuggestionSelect,
  onPollDatesChange,
  onSend,
  onLockIn,
  endRef,
  inputRef,
}) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 768px)").matches);

  const headcountTotal = occ ? totalHeadcountIncludingPlayer(confirmed.length) : 0;

  useEffect(() => { if (isMobile) setPanelOpen(false); }, [isMobile]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const h = () => setIsMobile(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const handleModeClick = (id, disabled) => {
    if (disabled) return;
    onModeChange(id);
    if (id === "pin") onInputChange(occ?.venue || "");
    else if (id !== "dm") onInputChange("");
  };

  const chipStyle = (active, disabled, primary) => ({
    background: disabled ? "#E9EDEF" : active ? WA_TEAL : "#fff",
    color: disabled ? "#B0B8BC" : active ? "#fff" : "#54656F",
    border: active ? "none" : "1px solid #D9DEE3",
    borderRadius: primary ? 22 : 20,
    padding: primary ? "8px 18px" : "5px 13px",
    fontSize: primary ? 13.5 : 12.5,
    fontWeight: active || primary ? 600 : 400,
    cursor: disabled ? "not-allowed" : "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.15s",
    flexShrink: 0,
    boxShadow: active && !disabled ? "0 1px 4px rgba(18,140,126,0.3)" : "none",
    opacity: disabled ? 0.72 : 1,
  });

  const participantLine = chars.map((c) => c.name).join(", ");
  const hasPollDate = Array.isArray(pollDates) && pollDates.some(Boolean);
  const nudgeTargets = chars.filter((c) => ["ghost", "unknown", "seen"].includes(c.commitment));
  const dmGhostRevealedNames = new Set(
    msgs
      .filter((m) => m.type === "system" && m.variant === "dmGhost" && m.ghostName)
      .map((m) => m.ghostName)
  );

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", background: WA_BG }}>

      {/* ── Main chat column ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* ── WhatsApp-style header ── */}
        <div style={{
          background: WA_HEADER,
          padding: "8px 6px 8px 4px",
          display: "flex",
          alignItems: "center",
          gap: 4,
          flexShrink: 0,
          userSelect: "none",
        }}>
          {/* Back — decorative only */}
          <div style={{ color: "rgba(255,255,255,0.35)", padding: "4px 2px", display: "flex", alignItems: "center", flexShrink: 0 }}>
            <BackIcon />
          </div>

          {/* Avatar — opens group info (same as title + ⋮) */}
          <button
            type="button"
            onClick={() => setPanelOpen((o) => !o)}
            aria-label={panelOpen ? "Close group info" : "Open group info"}
            style={{
              width: 40, height: 40, borderRadius: "50%",
              background: WA_TEAL,
              border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, flexShrink: 0, cursor: "pointer", padding: 0,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {occ.emoji}
          </button>

          {/* Name + participants — full-width tap target on mobile */}
          <button
            type="button"
            onClick={() => setPanelOpen((o) => !o)}
            aria-expanded={panelOpen}
            aria-label={`${occ.name}. Group info. ${chars.length} participants.`}
            style={{
              flex: 1, minWidth: 0, marginLeft: 8,
              padding: "8px 6px 8px 2px",
              textAlign: "left",
              background: "none", border: "none", cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <div style={{
              color: "#fff", fontWeight: 600, fontSize: 15,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2,
            }}>
              {occ.name} 🎉
            </div>
            <div style={{
              color: "rgba(255,255,255,0.72)", fontSize: 11.5,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1,
            }}>
              {participantLine}
            </div>
          </button>

          {/* Weeks countdown badge */}
          {weeksLeft !== null && (
            <div style={{
              background: weeksLeft <= 1 ? "rgba(220,80,80,0.25)" : weeksLeft <= 2 ? "rgba(255,184,48,0.2)" : "rgba(255,255,255,0.12)",
              borderRadius: 10, padding: "4px 10px",
              textAlign: "center", flexShrink: 0,
              transition: "background 0.4s",
            }}>
              <div className="font-bitcount font-bitcount-600" style={{
                color: weeksLeft <= 1 ? "#ff8080" : weeksLeft <= 2 ? "#FFB830" : "#fff",
                fontSize: 20, fontWeight: 600, lineHeight: 1,
                transition: "color 0.4s",
              }}>
                {weeksLeft}
              </div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 9, letterSpacing: "0.8px", textTransform: "uppercase" }}>
                {weeksLeft === 1 ? "week left" : "weeks"}
              </div>
            </div>
          )}

          {/* Steps badge */}
          <div style={{
            background: "rgba(255,255,255,0.12)",
            borderRadius: 10, padding: "4px 10px",
            textAlign: "center", flexShrink: 0, marginRight: 2,
          }}>
            <div className="font-bitcount font-bitcount-600" style={{ color: "#fff", fontSize: 20, fontWeight: 600, lineHeight: 1 }}>{steps}</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 9, letterSpacing: "0.8px", textTransform: "uppercase" }}>steps</div>
          </div>

          {/* Video / phone — decorative. ⋮ opens group info (matches title tap). */}
          <div style={{ display: "flex", gap: 0, alignItems: "center", flexShrink: 0 }}>
            <div style={{ padding: 6, display: "flex", alignItems: "center", color: "rgba(255,255,255,0.28)", pointerEvents: "none" }}>
              <VideoIcon />
            </div>
            <div style={{ padding: 6, display: "flex", alignItems: "center", color: "rgba(255,255,255,0.28)", pointerEvents: "none" }}>
              <PhoneIcon />
            </div>
            <button
              type="button"
              onClick={() => setPanelOpen((o) => !o)}
              aria-label={panelOpen ? "Close group info" : "Open group info"}
              style={{
                padding: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                minWidth: 44, minHeight: 44,
                background: "none", border: "none",
                color: "rgba(255,255,255,0.88)", cursor: "pointer",
                borderRadius: 8,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <MenuIcon />
            </button>
          </div>
        </div>

        {/* ── Chat area ── */}
        <div style={{
          flex: 1, overflowY: "auto",
          padding: "10px 12px",
          background: WA_BG,
          backgroundImage: WA_TILE,
        }}>
          {msgs.map((m) => <ChatMsg key={m.id} msg={m} />)}
          <div ref={endRef} />
        </div>

        {/* ── Narrator bar ── */}
        {narrator && (
          <div style={{
            background: "rgba(255,255,255,0.85)",
            borderTop: "1px solid rgba(0,0,0,0.07)",
            padding: "5px 16px", textAlign: "center", flexShrink: 0,
          }}>
            <span style={{
              color: narrator.startsWith("🚫") ? "#3949AB" : "#667781",
              fontSize: narrator.startsWith("🚫") ? 12.5 : 11.5,
              fontStyle: "italic",
              fontWeight: 400,
            }}>
              {narrator.startsWith("🚫") ? narrator : `💬 ${narrator}`}
            </span>
          </div>
        )}

        {/* ── Action chips (one row, tier order preserved) ── */}
        <div style={{
          background: "#F0F2F5",
          borderTop: "1px solid rgba(0,0,0,0.08)",
          padding: "8px 10px",
          display: "flex", alignItems: "center", gap: 6,
          overflowX: "auto",
          flexShrink: 0,
          WebkitOverflowScrolling: "touch",
        }}>
          {TIER_PRIMARY.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => handleModeClick(a.id, false)}
              style={chipStyle(mode === a.id, false, true)}
            >
              {a.l}
            </button>
          ))}
          <span style={{ width: 1, height: 22, background: "#D9DEE3", flexShrink: 0, margin: "0 2px" }} aria-hidden />
          {TIER_SECONDARY.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => handleModeClick(a.id, false)}
              style={chipStyle(mode === a.id, false, false)}
            >
              {a.l}
            </button>
          ))}
          <span style={{ width: 1, height: 22, background: "#D9DEE3", flexShrink: 0, margin: "0 2px" }} aria-hidden />
          {TIER_LAST.map((a) => {
            const disabled =
              a.id === "nudge"
                ? nudgeUsed
                : deadlineUsed || deadlineActive;
            const active = mode === a.id;
            return (
              <button
                key={a.id}
                type="button"
                title={a.id === "nudge" || a.id === "deadline" ? "One use per game" : undefined}
                disabled={disabled}
                onClick={() => handleModeClick(a.id, disabled)}
                style={chipStyle(active, disabled, false)}
              >
                {a.l}
              </button>
            );
          })}
        </div>

        {/* ── Input bar ── */}
        <div style={{
          background: "#F0F2F5",
          padding: "6px 10px",
          display: "flex", gap: 8, alignItems: "center",
          flexShrink: 0,
        }}>
          {/* Emoji icon — decorative only */}
          <div style={{ color: "#C4CCD1", display: "flex", alignItems: "center", flexShrink: 0, padding: 4, pointerEvents: "none" }}>
            <EmojiIcon />
          </div>

          {/* Input area */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {mode === "nudge" ? (
              <div style={{
                background: "#fff", borderRadius: 24, padding: "11px 16px",
                display: "flex", alignItems: "center", gap: 8, opacity: loading ? 0.7 : 1,
              }}>
                {nudgeTargets.length > 0 ? (
                  <>
                    <span style={{ fontSize: 14, color: "#8696A0" }}>Poking</span>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", flex: 1 }}>
                      {nudgeTargets.map((c) => (
                        <span key={c.id} style={{
                          background: "#F0F2F5", borderRadius: 12,
                          padding: "2px 8px", fontSize: 12.5, color: "#111",
                        }}>
                          {c.avatar} {c.name}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <span style={{ fontSize: 13, color: "#8696A0" }}>Everyone has already responded.</span>
                )}
              </div>
            ) : mode === "deadline" ? (
              <div style={{
                background: deadlineActive ? "#F0F2F5" : "#fff",
                borderRadius: 24, padding: "11px 16px",
                opacity: loading ? 0.7 : 1,
              }}>
                {deadlineActive ? (
                  <span style={{ fontSize: 13, color: "#8696A0" }}>
                    ⏰ Deadline already set for this week — waiting on replies.
                  </span>
                ) : (
                  <span style={{ fontSize: 13, color: "#54656F" }}>
                    ⏰ Sends an ultimatum — anyone who hasn&apos;t replied by next week gets dropped.
                  </span>
                )}
              </div>
            ) : mode === "poll" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                {[0, 1, 2].map((idx) => (
                  <input
                    key={idx}
                    type="date"
                    value={pollDates?.[idx] || ""}
                    onChange={(e) => {
                      const next = [...(pollDates || ["", "", ""])];
                      next[idx] = e.target.value;
                      onPollDatesChange(next);
                    }}
                    disabled={loading}
                    style={{
                      background: "#fff",
                      border: "none",
                      borderRadius: 12,
                      padding: "9px 8px",
                      color: "#111",
                      fontSize: 12,
                      outline: "none",
                      opacity: loading ? 0.7 : 1,
                    }}
                  />
                ))}
              </div>
            ) : mode === "dm" ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1, minWidth: 0 }}>
                <select
                  value={dmTarget}
                  onChange={(e) => onDmTargetChange(e.target.value)}
                  disabled={loading}
                  style={{
                    background: "#fff", border: "none", borderRadius: 20,
                    padding: "10px 12px", color: "#111", fontSize: 13,
                    outline: "none", cursor: "pointer", flexShrink: 0,
                  }}
                >
                  {chars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.avatar} {c.name}
                      {dmGhostRevealedNames.has(c.name) ? " · wasn't on DMs (early)" : ""}
                    </option>
                  ))}
                </select>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
                  disabled={loading}
                  placeholder="Message privately..."
                  style={{
                    flex: 1, background: "#fff", border: "none",
                    borderRadius: 24, padding: "11px 16px",
                    color: "#111", fontSize: 14, outline: "none",
                    opacity: loading ? 0.6 : 1, minWidth: 0,
                  }}
                />
              </div>
            ) : mode === "pin" ? (
              <div style={{ position: "relative" }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
                  disabled={loading}
                  placeholder={occ?.venue || "Location..."}
                  style={{
                    width: "100%", background: "#fff", border: "none",
                    borderRadius: 24, padding: "11px 16px",
                    color: "#111", fontSize: 14, outline: "none",
                    opacity: loading ? 0.6 : 1, boxSizing: "border-box",
                  }}
                />
                {Array.isArray(pinSuggestions) && pinSuggestions.length > 0 && (
                  <div style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: "calc(100% + 8px)",
                    background: "#fff",
                    border: "1px solid #D9DEE3",
                    borderRadius: 12,
                    boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
                    overflow: "hidden",
                    zIndex: 6,
                  }}>
                    {pinSuggestions.map((s) => (
                      <button
                        key={s.placeId || s.description}
                        onClick={() => onPinSuggestionSelect(s.description)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          background: "#fff",
                          border: "none",
                          borderBottom: "1px solid #F0F2F5",
                          padding: "10px 12px",
                          color: "#111",
                          fontSize: 12.5,
                          cursor: "pointer",
                        }}
                      >
                        📍 {s.description}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
                disabled={loading}
                placeholder={mode === "pin" ? occ?.venue || "Location..." : "Message"}
                style={{
                  width: "100%", background: "#fff", border: "none",
                  borderRadius: 24, padding: "11px 16px",
                  color: "#111", fontSize: 14, outline: "none",
                  opacity: loading ? 0.6 : 1, boxSizing: "border-box",
                }}
              />
            )}
          </div>

          {/* Mic shown when input is empty — decorative only */}
          {!input.trim() && !loading && mode !== "poll" && mode !== "nudge" && mode !== "deadline" && (
            <div style={{ color: "#C4CCD1", display: "flex", alignItems: "center", flexShrink: 0, padding: 4, pointerEvents: "none" }}>
              <AttachIcon />
            </div>
          )}

          {/* Send button — only shown when there's something to send */}
          {(() => {
            const canSend =
              !loading && (
                mode === "nudge" ? nudgeTargets.length > 0 && !nudgeUsed :
                mode === "deadline" ? !deadlineActive && !deadlineUsed :
                mode === "poll" ? hasPollDate :
                Boolean(input.trim())
              );
            const isDisabled =
              loading || (
                mode === "nudge" ? nudgeTargets.length === 0 || nudgeUsed :
                mode === "deadline" ? deadlineActive || deadlineUsed :
                mode === "poll" ? !hasPollDate :
                !input.trim()
              );
            return (
              <button
                onClick={onSend}
                disabled={isDisabled}
                style={{
                  background: canSend ? WA_GREEN : "#E9EDEF",
                  border: "none", borderRadius: "50%",
                  width: 46, height: 46,
                  cursor: canSend ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  color: canSend ? "#fff" : "#C4CCD1",
                  transition: "background 0.15s, color 0.15s",
                  boxShadow: canSend ? "0 1px 4px rgba(37,211,102,0.4)" : "none",
                }}
                aria-label="Send"
              >
                {loading ? <span style={{ fontSize: 18 }}>⏳</span> : canSend ? <SendIcon /> : <MicIcon />}
              </button>
            );
          })()}
        </div>
      </div>

      {/* ── Side panel overlay (mobile) ── */}
      {panelOpen && isMobile && (
        <div
          onClick={() => setPanelOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 5 }}
          aria-hidden="true"
        />
      )}

      {/* ── Group info panel ── */}
      <div style={{
        width: panelOpen ? (isMobile ? 280 : 260) : 0,
        background: "#fff",
        display: "flex", flexDirection: "column",
        borderLeft: panelOpen ? "1px solid #E9EDEF" : "none",
        flexShrink: 0, overflow: "hidden",
        transition: "width 0.25s ease",
        ...(isMobile && panelOpen ? {
          position: "fixed", right: 0, top: 0, bottom: 0,
          zIndex: 10, boxShadow: "-4px 0 20px rgba(0,0,0,0.2)",
        } : {}),
      }}>
        {/* Panel header */}
        <div style={{ background: WA_HEADER, padding: "14px 16px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setPanelOpen(false)}
              style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", padding: 2 }}
              aria-label="Close panel"
            >
              <CloseIcon />
            </button>
            <span style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>Group info</span>
          </div>
        </div>

        {/* Group summary card */}
        <div style={{ background: "#fff", padding: "20px 16px 12px", borderBottom: "1px solid #E9EDEF", flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: WA_TEAL,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32,
            }}>
              {occ.emoji}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#111", fontWeight: 700, fontSize: 15 }}>{occ.name}</div>
              <div style={{ color: "#667781", fontSize: 11.5, marginTop: 2 }}>{occ.venue}</div>
            </div>
          </div>

          {/* Confirmed counter */}
          <div style={{ background: "#F0F2F5", borderRadius: 12, padding: "12px 16px" }}>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
              <span style={{
                fontSize: 36, fontWeight: 800, lineHeight: 1,
                color: headcountTotal >= occ.min ? WA_GREEN : headcountTotal > 1 ? "#FFB830" : "#8696A0",
                transition: "color 0.3s",
              }}>
                {headcountTotal}
              </span>
              <span style={{ color: "#8696A0", fontSize: 15 }}>/ {occ.target}</span>
            </div>
            <div style={{ color: "#667781", fontSize: 11, textAlign: "center", marginBottom: 8 }}>going incl. you (theoretically)</div>
            <div style={{ background: "#D9DEE3", borderRadius: 4, height: 4, overflow: "hidden" }}>
              <div style={{
                background: WA_GREEN,
                width: `${Math.min(100, (headcountTotal / occ.target) * 100)}%`,
                height: "100%", borderRadius: 4, transition: "width 0.5s ease",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              {maybeCount > 0 && <span style={{ color: "#FFB830", fontSize: 11 }}>+{maybeCount} maybe{maybeCount !== 1 ? "s" : ""}</span>}
              <span style={{ color: "#8696A0", fontSize: 10, marginLeft: "auto" }}>total {occ.min}–{occ.max} incl. you</span>
            </div>
          </div>

          {/* Personal best */}
          {personalBest !== null && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, padding: "4px 0" }}>
              <span style={{ color: "#667781", fontSize: 12 }}>Personal best</span>
              <span className="font-bitcount font-bitcount-600" style={{ color: "#FFB830", fontSize: 18, fontWeight: 600 }}>
                {personalBest} <span style={{ fontSize: 11, color: "#8696A0" }}>steps</span>
              </span>
            </div>
          )}
        </div>

        {/* Members list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ color: WA_TEAL, fontSize: 13, fontWeight: 600, padding: "14px 16px 6px", letterSpacing: "0.1px" }}>
            {chars.length} participants
          </div>
          {chars.map((c) => {
            const seen = c.lastSeen?.trim();
            const isOnline = seen?.toLowerCase() === "online";
            return (
              <div key={c.id} style={{
                padding: "10px 16px",
                display: "flex", alignItems: "center", gap: 12,
                borderBottom: "1px solid #F0F2F5",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "#E9EDEF",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, flexShrink: 0,
                }}>
                  {c.avatar}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "#111", fontSize: 14, fontWeight: 500 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "#667781", marginTop: 1 }}>
                    {isOnline ? (
                      <span style={{ color: WA_GREEN }}>online</span>
                    ) : (
                      <>last seen {seen || "recently"}</>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Lock In footer */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #E9EDEF", background: "#fff", flexShrink: 0 }}>
          <div style={{ color: "#667781", fontSize: 11.5, textAlign: "center", marginBottom: 8, lineHeight: 1.4 }}>
            {steps === 0
              ? "Send your first message to begin"
              : headcountTotal < occ.min
              ? `${occ.min - headcountTotal} more needed (people total, incl. you) to lock in`
              : headcountTotal > occ.max
              ? `${headcountTotal - occ.max} over max headcount — manage the excess`
              : "You're in range — lock in?"}
          </div>
          <button
            onClick={onLockIn}
            style={{
              width: "100%",
              background: inRange ? WA_GREEN : "#E9EDEF",
              color: inRange ? "#fff" : "#8696A0",
              border: "none", borderRadius: 10,
              padding: 13, fontWeight: 700, fontSize: 14,
              cursor: inRange ? "pointer" : "default",
              transition: "all 0.2s",
              boxShadow: inRange ? "0 2px 8px rgba(37,211,102,0.35)" : "none",
            }}
          >
            🔒 Lock In
          </button>
        </div>
      </div>

    </div>
  );
}