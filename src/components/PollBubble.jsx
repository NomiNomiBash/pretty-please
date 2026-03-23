export function PollBubble({ msg }) {
  const total = Object.values(msg.votes).flat().length;
  return (
    <div style={{ background: "var(--pp-bubble-poll)", borderRadius: 12, padding: 12, minWidth: 240, maxWidth: 270, border: "1px solid var(--pp-border)" }}>
      <div style={{ color: "var(--pp-text-muted)", fontSize: 10, marginBottom: 4 }}>📅 DATE POLL</div>
      <div style={{ color: "var(--pp-text)", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Which date works?</div>
      {Object.entries(msg.votes).map(([date, voters]) => {
        const pct = total > 0 ? (voters.length / total) * 100 : 0;
        const winning = voters.length > 0 && voters.length === Math.max(...Object.values(msg.votes).map((v) => v.length));
        return (
          <div key={date} style={{ marginBottom: 9 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
              <span style={{ color: winning ? "#25D366" : "var(--pp-text)", fontSize: 13, fontWeight: winning ? 700 : 400 }}>{date}</span>
              <span style={{ color: "var(--pp-text-muted)", fontSize: 11 }}>{voters.length} vote{voters.length !== 1 ? "s" : ""}</span>
            </div>
            <div style={{ background: "var(--pp-bubble-poll-bar)", borderRadius: 4, height: 5, overflow: "hidden" }}>
              <div style={{ background: winning ? "#25D366" : "var(--pp-text-muted)", width: `${pct}%`, height: "100%", borderRadius: 4, transition: "width 0.5s ease" }} />
            </div>
            {voters.length > 0 && <div style={{ color: "var(--pp-text-muted)", fontSize: 10, marginTop: 2 }}>{voters.join(", ")}</div>}
          </div>
        );
      })}
    </div>
  );
}
