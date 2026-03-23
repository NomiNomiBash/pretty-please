import { PollBubble } from "./PollBubble.jsx";

const TIME = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const BUBBLE_RECEIVED = "#fff";
const BUBBLE_SENT     = "#DCF8C6";
const BUBBLE_DM_SENT  = "#FFF9C4";
const BUBBLE_DM_RECV  = "#E8F4FD";
const BUBBLE_PIN      = "#E8F5E9";
const BUBBLE_DEADLINE = "#FFF8E1";
const TEXT_MAIN       = "#111";
const TEXT_MUTED      = "#8696A0";
const BORDER_RECV     = "rgba(0,0,0,0.08)";

export function ChatMsg({ msg }) {

  /* ── System message ── */
  if (msg.type === "system")
    return (
      <div style={{ textAlign: "center", margin: "8px 0" }}>
        <span style={{
          background: "rgba(225,245,254,0.92)",
          color: "#54656F",
          fontSize: 11.5,
          padding: "4px 12px",
          borderRadius: 8,
          boxShadow: "0 1px 1px rgba(0,0,0,0.08)",
        }}>
          {msg.text}
        </span>
      </div>
    );

  /* ── Typing indicator (three dots) ── */
  if (msg.type === "typing")
    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 19 }}>{msg.avatar}</span>
        <div>
          <div style={{ color: "#25D366", fontSize: 11, marginBottom: 2 }}>{msg.charName}</div>
          <div style={{
            background: BUBBLE_RECEIVED,
            borderRadius: "4px 12px 12px 12px",
            padding: "10px 14px",
            display: "inline-flex", gap: 4,
            boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
          }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: "50%",
                background: TEXT_MUTED,
                animation: `bounce 1s ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        </div>
      </div>
    );

  /* ── Player (sent) bubble ── */
  if (msg.type === "player")
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }} className="msg-anim">
        <div style={{ maxWidth: "75%" }}>
          {msg.isPoll ? (
            <PollBubble msg={msg} />
          ) : (
            <div>
              <div style={{
                background:
                  msg.action === "dm"       ? BUBBLE_DM_SENT :
                  msg.action === "pin"      ? BUBBLE_PIN :
                  msg.action === "deadline" ? BUBBLE_DEADLINE :
                  BUBBLE_SENT,
                borderRadius: "12px 12px 4px 12px",
                padding: "7px 11px 8px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
              }}>
                {msg.action === "nudge" && (
                  <div style={{ color: "#1a7a40", fontSize: 10, marginBottom: 3, fontWeight: 600 }}>🔔 nudge</div>
                )}
                {msg.action === "deadline" && (
                  <div style={{ color: "#b8860b", fontSize: 10, marginBottom: 3, fontWeight: 600 }}>⏰ deadline</div>
                )}
                {msg.action === "pin" && (
                  <div style={{ color: "#2e7d32", fontSize: 10, marginBottom: 3, fontWeight: 600 }}>📍 location pin</div>
                )}
                {msg.action === "dm" && (
                  <div style={{ color: "#5c6bc0", fontSize: 10, marginBottom: 3, fontWeight: 600 }}>🤫 DM · {msg.dmTarget}</div>
                )}
                <span style={{ color: TEXT_MAIN, fontSize: 14, lineHeight: 1.45 }}>{msg.text}</span>
              </div>
              <div style={{ color: TEXT_MUTED, fontSize: 10, textAlign: "right", marginTop: 2, paddingRight: 2 }}>
                {TIME} <span style={{ color: "#53BDEB" }}>✓✓</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );

  /* ── Character (received) bubble ── */
  if (msg.type === "character")
    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 4 }} className="msg-anim">
        <span style={{ fontSize: 19, flexShrink: 0 }}>{msg.avatar}</span>
        <div style={{ maxWidth: "72%" }}>
          <div style={{
            color: msg.isDm ? "#5c6bc0" : "#25D366",
            fontSize: 11.5, fontWeight: 600, marginBottom: 2,
          }}>
            {msg.sender}{msg.isDm ? " (DM)" : ""}
          </div>
          <div style={{
            background: msg.isDm ? BUBBLE_DM_RECV : BUBBLE_RECEIVED,
            borderRadius: "4px 12px 12px 12px",
            padding: "7px 11px 8px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
            border: `1px solid ${BORDER_RECV}`,
          }}>
            <span style={{ color: TEXT_MAIN, fontSize: 14, lineHeight: 1.45 }}>{msg.text}</span>
          </div>
          <div style={{ color: TEXT_MUTED, fontSize: 10, marginTop: 2, paddingLeft: 2 }}>{TIME}</div>
        </div>
      </div>
    );

  return null;
}