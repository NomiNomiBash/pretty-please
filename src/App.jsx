import { useState, useRef } from "react";
import { IntroScreen } from "./components/IntroScreen.jsx";
import { ResultScreen } from "./components/ResultScreen.jsx";
import { GameView } from "./components/GameView.jsx";
import { CHARACTERS } from "./data/characters.js";
import { getUpcomingDates } from "./lib/dates.js";
import { fetchResponses } from "./api/anthropic.js";

export function App() {
  const [phase, setPhase] = useState("intro");
  const [occ, setOcc] = useState(null);
  const [chars, setChars] = useState(() => CHARACTERS.map((c) => ({ ...c, commitment: "unknown" })));
  const [msgs, setMsgs] = useState([]);
  const [steps, setSteps] = useState(0);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("message");
  const [dmTarget, setDmTarget] = useState(CHARACTERS[0].id);
  const [loading, setLoading] = useState(false);
  const [narrator, setNarrator] = useState("");
  const [result, setResult] = useState(null);
  const [personalBest, setPersonalBest] = useState(() => {
    const saved = localStorage.getItem("pp-personal-best");
    return saved ? parseInt(saved, 10) : null;
  });
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const startGame = (o) => {
    setOcc(o);
    setChars(CHARACTERS.map((c) => ({ ...c, commitment: "unknown" })));
    const names = CHARACTERS.map((c) => c.name).join(", ");
    setMsgs([
      { id: 1, type: "system", text: `"${o.name} Planning 🎉" group created` },
      { id: 2, type: "system", text: `You added ${names}` },
      { id: 3, type: "character", sender: "Marcus", avatar: "👨🏿", characterId: "marcus", text: "Right, a group chat. What are we actually planning then?" },
    ]);
    setSteps(0);
    setNarrator("");
    setMode("message");
    setInput("");
    setPhase("playing");
  };

  const confirmed = chars.filter((c) => c.commitment === "yes");
  const maybeCount = chars.filter((c) => c.commitment === "maybe").length;
  const inRange = occ && confirmed.length >= occ.min && confirmed.length <= occ.max;

  const handleSend = async () => {
    if (loading) return;
    const needsText = mode !== "poll";
    if (needsText && !input.trim() && mode !== "pin") return;

    const dates = getUpcomingDates();
    const pollId = `p${Date.now()}`;
    let txt = "";
    let pm = {};
    const pinLocation = mode === "pin" ? (input.trim() || occ.venue) : "";

    if (mode === "pin") {
      txt = `📍 ${occ.name} · ${pinLocation} · ${occ.note}`;
      pm = { id: Date.now(), type: "player", text: `📍 ${pinLocation}`, action: "pin" };
    } else if (mode === "poll") {
      txt = `📅 Date poll for ${occ.name} — which weekend works?\n${dates.map((d, i) => `${i + 1}. ${d}`).join("\n")}`;
      pm = { id: Date.now(), type: "player", text: "Which date works for everyone?", action: "poll", isPoll: true, pollId, votes: Object.fromEntries(dates.map((d) => [d, []])) };
    } else if (mode === "dm") {
      const ch = CHARACTERS.find((c) => c.id === dmTarget);
      txt = input.trim();
      pm = { id: Date.now(), type: "player", text: txt, action: "dm", dmTarget: ch?.name || "" };
    } else {
      txt = input.trim();
      pm = { id: Date.now(), type: "player", text: txt, action: mode };
    }

    setMsgs((p) => [...p, pm]);
    setInput("");
    setSteps((s) => s + 1);
    setLoading(true);
    try {
      const hist = msgs
        .filter((m) => m.type === "player" || m.type === "character")
        .slice(-10)
        .map((m) => `${m.sender || "You"}: ${m.text}`)
        .join("\n");
      const dmChar = mode === "dm" ? CHARACTERS.find((c) => c.id === dmTarget) : null;
      const prompt = `Chat history:\n${hist || "(no messages yet)"}\n\nPlayer action (${mode}): "${txt}"\n${dmChar ? `\nDM TARGET: Only ${dmChar.name} should respond. Nobody else.\n` : ""}\nCurrent commitments: ${chars.map((c) => `${c.name}=${c.commitment}`).join(", ")}\n${mode === "poll" ? `\nDate options in poll: ${dates.join(" | ")}\nCharacters should vote for which date(s) suit them.\n` : ""}\nReturn JSON only.`;

      const ai = await fetchResponses({ occ, chars, mode, dmTarget, prompt, dates });

      if (ai.narratorComment) setNarrator(ai.narratorComment);
      for (let i = 0; i < ai.responses.length; i++) {
        const r = ai.responses[i];
        const ch = CHARACTERS.find((c) => c.id === r.characterId);
        if (!ch) continue;
        // Variable delay before each character starts typing (1.5–5s, scales gently with position)
        const delayBefore = 1500 + i * 800 + Math.random() * 2200;
        await new Promise((x) => setTimeout(x, delayBefore));
        const tid = `t${r.characterId}${Date.now()}`;
        setMsgs((p) => [...p, { id: tid, type: "typing", charName: ch.name, avatar: ch.avatar }]);
        // Typing duration 3–6s so messages have time to be read
        const typingDuration = 3000 + Math.random() * 3000;
        await new Promise((x) => setTimeout(x, typingDuration));
        const isDm = mode === "dm";
        const newMsgs = r.messages.map((m, j) => ({ id: `${Date.now()}${i}${j}`, type: "character", sender: ch.name, avatar: ch.avatar, characterId: r.characterId, text: m, isDm }));
        setMsgs((p) => [...p.filter((m) => m.id !== tid), ...newMsgs]);
        if (mode === "poll" && r.commitment !== "unknown") {
          const picked = dates.find((d) => r.messages.some((m) => m.includes(d.split(" ")[0]) || m.includes(d.split(" ")[1]))) || dates[0];
          setMsgs((p) =>
            p.map((m) => {
              if (m.pollId === pollId && m.isPoll) {
                const v = { ...m.votes };
                if (picked && v[picked] && !v[picked].includes(ch.name)) v[picked] = [...v[picked], ch.name];
                return { ...m, votes: v };
              }
              return m;
            })
          );
        }
        setChars((p) => p.map((c) => (c.id === r.characterId ? { ...c, commitment: r.commitment } : c)));
      }
    } catch (e) {
      console.error(e);
      setMsgs((p) => [...p, { id: Date.now(), type: "system", text: "📡 Signal lost in Zone 2. Try again." }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleLockIn = () => {
    const count = confirmed.length;
    const { min, max, target } = occ;
    let r;
    if (count < min) {
      r = {
        type: "loss",
        title: count === 0 ? "💀 Zero. Not One Person." : "💀 Not Enough",
        message: count === 0 ? "Absolute radio silence. You eat the full cost alone and pretend it never happened." : `Only ${count} confirmed. Needed at least ${min}. You text everyone 'no worries! next time!' and stare at the ceiling.`,
        score: Math.round((count / min) * 40),
        attendees: [],
      };
    } else if (count > max) {
      r = {
        type: "loss",
        title: "😬 Too Many People",
        message: `${count} said yes. You only had room for ${max}. Hamish brings someone uninvited. Someone brings a dog. The vibe is irrevocably off.`,
        score: Math.round((max / count) * 60),
        attendees: confirmed.map((c) => c.name),
      };
    } else {
      const eff = steps <= 8 ? "Suspiciously efficient." : steps <= 15 ? "Not bad at all." : steps <= 25 ? "You got there. Eventually." : "What an absolute ordeal. But you did it.";
      const isNewBest = personalBest === null || steps < personalBest;
      if (isNewBest) {
        setPersonalBest(steps);
        localStorage.setItem("pp-personal-best", steps);
      }
      r = {
        type: "win",
        title: "🎉 It's Happening",
        message: `${count}/${target} confirmed. The ${occ.name} is ON. Took ${steps} steps. ${eff}`,
        score: Math.max(10, Math.min(100, 100 - steps * 2 + (count === target ? 20 : 0))),
        attendees: confirmed.map((c) => c.name),
        isNewBest,
      };
    }
    setResult(r);
    setPhase("result");
  };

  const handleModeChange = (id) => {
    setMode(id);
    if (id === "pin") setInput(occ?.venue || "");
    else if (id !== "dm") setInput("");
  };

  if (phase === "intro") return <IntroScreen onStart={startGame} />;
  if (phase === "result") return <ResultScreen result={result} occasion={occ} steps={steps} personalBest={personalBest} onRestart={() => { setResult(null); setPhase("intro"); }} />;

  return (
    <GameView
      personalBest={personalBest}
      occ={occ}
      chars={chars}
      msgs={msgs}
      steps={steps}
      loading={loading}
      narrator={narrator}
      mode={mode}
      dmTarget={dmTarget}
      input={input}
      confirmed={confirmed}
      maybeCount={maybeCount}
      inRange={inRange}
      onModeChange={handleModeChange}
      onDmTargetChange={setDmTarget}
      onInputChange={setInput}
      onSend={handleSend}
      onLockIn={handleLockIn}
      endRef={endRef}
      inputRef={inputRef}
    />
  );
}
