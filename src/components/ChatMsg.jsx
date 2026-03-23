import { PollBubble } from "./PollBubble.jsx";

export function ChatMsg({ msg }) {
  if (msg.type === "system")
    return (
      <div style={{ textAlign: "center", margin: "8px 0" }}>
        <span style={{ background: "var(--pp-system-msg)", color: "var(--pp-text-muted)", fontSize: 11, padding: "4px 12px", borderRadius: 8 }}>{msg.text}</span>
      </div>
    );
  if (msg.type === "typing")
    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 19 }}>{msg.avatar}</span>
        <div>
          <div style={{ color: "#25D366", fontSize: 11, marginBottom: 2 }}>{msg.charName}</div>
          <div style={{ background: "var(--pp-bubble-char)", borderRadius: "4px 12px 12px 12px", padding: "10px 14px", display: "inline-flex", gap: 4, border: "1px solid var(--pp-border)" }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--pp-text-muted)", animation: `bounce 1s ${i * 0.2}s infinite` }} />
            ))}
          </div>
        </div>
      </div>
    );
  if (msg.type === "player")
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }} className="msg-anim">
        <div style={{ maxWidth: "75%" }}>
          {msg.isPoll ? (
            <PollBubble msg={msg} />
          ) : (
            <div>
              <div
                style={{
                  background: msg.action === "dm" ? "var(--pp-bubble-player-dm)" : msg.action === "pin" ? "var(--pp-bubble-player-pin)" : msg.action === "deadline" ? "var(--pp-bubble-player-deadline)" : "var(--pp-bubble-player)",
                  borderRadius: "12px 12px 4px 12px",
                  padding: "8px 12px",
                  border: "1px solid transparent",
                }}
              >
                {msg.action === "nudge" && <div style={{ color: "#25D366", fontSize: 10, marginBottom: 3 }}>🔔 nudge</div>}
                {msg.action === "deadline" && <div style={{ color: "#FFB830", fontSize: 10, marginBottom: 3 }}>⏰ deadline</div>}
                {msg.action === "pin" && <div style={{ color: "#4FC3F7", fontSize: 10, marginBottom: 3 }}>📍 location pin</div>}
                {msg.action === "dm" && <div style={{ color: "#90CAF9", fontSize: 10, marginBottom: 3 }}>🤫 DM · {msg.dmTarget}</div>}
                <span style={{ color: "var(--pp-bubble-text)", fontSize: 14 }}>{msg.text}</span>
              </div>
              <div style={{ color: "var(--pp-text-muted)", fontSize: 10, textAlign: "right", marginTop: 2 }}>✓✓</div>
            </div>
          )}
        </div>
      </div>
    );
  if (msg.type === "character")
    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 4 }} className="msg-anim">
        <span style={{ fontSize: 19, flexShrink: 0 }}>{msg.avatar}</span>
        <div style={{ maxWidth: "72%" }}>
          <div style={{ color: msg.isDm ? "#90CAF9" : "#25D366", fontSize: 11, marginBottom: 2 }}>{msg.sender}{msg.isDm ? " (DM)" : ""}</div>
          <div style={{ background: msg.isDm ? "var(--pp-bubble-char-dm)" : "var(--pp-bubble-char)", borderRadius: "4px 12px 12px 12px", padding: "8px 12px", border: "1px solid var(--pp-border)" }}>
            <span style={{ color: "var(--pp-bubble-text)", fontSize: 14 }}>{msg.text}</span>
          </div>
          <div style={{ color: "var(--pp-text-muted)", fontSize: 10, marginTop: 2 }}>{new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
        </div>
      </div>
    );
  return null;
}
