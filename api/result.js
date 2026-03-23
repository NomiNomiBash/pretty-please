function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const payload = parseBody(req);
  // Phase 2 scaffold: persist this to DB in phase 3.
  res.status(200).json({
    ok: true,
    received: {
      occasionId: payload.occasionId,
      steps: payload.steps,
      confirmedCount: payload.confirmedCount,
      outcome: payload.outcome,
      score: payload.score,
    },
  });
}
