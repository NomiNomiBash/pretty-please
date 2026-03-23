export function ResultScreen({ result, occasion, steps, personalBest, onRestart }) {
  return (
    <div style={{ height: "100%", background: "var(--pp-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", overflowY: "auto" }}>
      <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 60, marginBottom: 14 }}>{result.type === "win" ? "🎉" : "💀"}</div>
        <h2 style={{ color: "var(--pp-text)", fontSize: 24, fontWeight: 800, margin: 0 }}>{result.title}</h2>
        <p style={{ color: "var(--pp-text-muted)", fontSize: 14, lineHeight: 1.7, marginTop: 12 }}>{result.message}</p>
        {result.attendees?.length > 0 && (
          <div style={{ background: "var(--pp-bg-panel)", borderRadius: 12, padding: 16, marginTop: 20, border: "1px solid var(--pp-border)" }}>
            <div style={{ color: "var(--pp-text-muted)", fontSize: 11, marginBottom: 10 }}>Who confirmed:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {result.attendees.map((n) => (
                <span key={n} style={{ background: "#25D366", color: "#004a14", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>{n}</span>
              ))}
            </div>
          </div>
        )}
        {result.type === "win" && result.isNewBest && (
          <div style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: 10, padding: "10px 16px", marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🏆</span>
            <span style={{ color: "#25D366", fontSize: 13, fontWeight: 700 }}>New personal best!</span>
          </div>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <div style={{ flex: 1, background: "var(--pp-bg-panel)", borderRadius: 10, padding: 12, textAlign: "center", border: "1px solid var(--pp-border)" }}>
            <div style={{ color: result.type === "win" ? "#25D366" : "#FF6B6B", fontSize: 28, fontWeight: 700 }}>{result.score}</div>
            <div style={{ color: "var(--pp-text-muted)", fontSize: 11 }}>score</div>
          </div>
          <div style={{ flex: 1, background: "var(--pp-bg-panel)", borderRadius: 10, padding: 12, textAlign: "center", border: "1px solid var(--pp-border)" }}>
            <div style={{ color: "#FFB830", fontSize: 28, fontWeight: 700 }}>{steps}</div>
            <div style={{ color: "var(--pp-text-muted)", fontSize: 11 }}>steps</div>
          </div>
          {personalBest !== null && !result.isNewBest && (
            <div style={{ flex: 1, background: "var(--pp-bg-panel)", borderRadius: 10, padding: 12, textAlign: "center", border: "1px solid var(--pp-border)" }}>
              <div style={{ color: "#FFB830", fontSize: 28, fontWeight: 700 }}>{personalBest}</div>
              <div style={{ color: "var(--pp-text-muted)", fontSize: 11 }}>personal best</div>
            </div>
          )}
        </div>
        <button onClick={onRestart} style={{ width: "100%", marginTop: 20, background: "#25D366", color: "#000", border: "none", borderRadius: 12, padding: 16, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          Try Again (They Still Won't Come)
        </button>
      </div>
    </div>
  );
}
