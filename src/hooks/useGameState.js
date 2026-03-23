import { useRef, useState } from "react";
import { getUpcomingDates } from "../lib/dates.js";
import { sendTurn, postResult } from "../api/gameApi.js";
import { buildCastForOccasion } from "./useCast.js";
import { buildResult } from "../utils/scoring.js";

const STEPS_PER_DAY = 2;

const FLAKE_CHANCE = {
  ollie: 0.3,
  callum: 0.28,
  remi: 0.25,
  saskia: 0.22,
  theo: 0.22,
  hamish: 0.2,
  nadia: 0.2,
  jade: 0.18,
  tom: 0.15,
  zara: 0.15,
  priya: 0.12,
  ayo: 0.12,
  bex: 0.08,
  marcus: 0.05,
};

const FLAKE_MSGS_MAYBE = [
  (n) => `${n} just went quiet on the group.`,
  (n) => `${n} is suddenly less sure about this.`,
  (n) => `${n} needs to "check something".`,
  (n) => `${n} has gone from yes to... thinking about it.`,
];
const FLAKE_MSGS_GHOST = [
  (n) => `${n} has left the building 👻`,
  (n) => `${n} hasn't responded in a while.`,
  (n) => `${n} has entered ghost mode.`,
];

function pickFlakeMsg(arr, name) {
  return arr[Math.floor(Math.random() * arr.length)](name);
}

export function useGameState() {
  const [phase, setPhase] = useState("intro");
  const [occ, setOcc] = useState(null);
  const [chars, setChars] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [steps, setSteps] = useState(0);
  const [daysLeft, setDaysLeft] = useState(null);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("message");
  const [dmTarget, setDmTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [narrator, setNarrator] = useState("");
  const [result, setResult] = useState(null);
  const [personalBest, setPersonalBest] = useState(() => {
    const saved = localStorage.getItem("pp-personal-best");
    return saved ? parseInt(saved, 10) : null;
  });
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const confirmed = chars.filter((c) => c.commitment === "yes");
  const maybeCount = chars.filter((c) => c.commitment === "maybe").length;
  const inRange = occ && confirmed.length >= occ.min && confirmed.length <= occ.max;

  const startGame = (occasion, castFromApi = null) => {
    const cast =
      castFromApi?.map((c) => ({ ...c, commitment: "unknown", lastMsg: null })) ??
      buildCastForOccasion(occasion);
    const names = cast.map((c) => c.name).join(", ");
    const firstSpeaker = cast.find((c) => c.id === "marcus") ?? cast[0];

    setOcc(occasion);
    setChars(cast);
    setDmTarget(cast[0]?.id ?? null);
    setMsgs([
      { id: 1, type: "system", text: `"${occasion.name} Planning 🎉" group created` },
      { id: 2, type: "system", text: `You added ${names}` },
      {
        id: 3,
        type: "character",
        sender: firstSpeaker.name,
        avatar: firstSpeaker.avatar,
        characterId: "marcus",
        text: "Right, a group chat. What are we actually planning then?",
      },
    ]);
    setSteps(0);
    setDaysLeft(occasion.days);
    setNarrator("");
    setMode("message");
    setInput("");
    setPhase("playing");
  };

  const advanceDayAndApplyFlakes = (newStep) => {
    if (newStep % STEPS_PER_DAY !== 0 || daysLeft === null || daysLeft <= 0) return;

    const newDaysLeft = daysLeft - 1;
    setDaysLeft(newDaysLeft);

    const flakeSystemMsgs = [];
    const updated = chars.map((c) => {
      const chance = FLAKE_CHANCE[c.id] ?? 0.12;
      if (c.commitment === "yes" && Math.random() < chance) {
        flakeSystemMsgs.push({
          id: `flake${Date.now()}${c.id}`,
          type: "system",
          text: pickFlakeMsg(FLAKE_MSGS_MAYBE, c.name),
        });
        return { ...c, commitment: "maybe" };
      }
      if (c.commitment === "maybe" && Math.random() < chance * 0.6) {
        flakeSystemMsgs.push({
          id: `ghost${Date.now()}${c.id}`,
          type: "system",
          text: pickFlakeMsg(FLAKE_MSGS_GHOST, c.name),
        });
        return { ...c, commitment: "ghost" };
      }
      return c;
    });

    const dayLabel =
      newDaysLeft === 0
        ? "📅 The day is here."
        : newDaysLeft === 1
        ? "📅 One day left."
        : `📅 ${newDaysLeft} days to go.`;
    setChars(updated);
    setMsgs((p) => [...p, { id: `day${Date.now()}`, type: "system", text: dayLabel }, ...flakeSystemMsgs]);
  };

  const handleSend = async () => {
    if (loading || !occ) return;
    const needsText = mode !== "poll";
    if (needsText && !input.trim() && mode !== "pin") return;

    const dates = getUpcomingDates();
    const pollId = `p${Date.now()}`;
    const pinLocation = mode === "pin" ? input.trim() || occ.venue : "";
    let txt = "";
    let pm = {};

    if (mode === "pin") {
      txt = `📍 ${occ.name} · ${pinLocation} · ${occ.note}`;
      pm = { id: Date.now(), type: "player", text: `📍 ${pinLocation}`, action: "pin" };
    } else if (mode === "poll") {
      txt = `📅 Date poll for ${occ.name} — which weekend works?\n${dates.map((d, i) => `${i + 1}. ${d}`).join("\n")}`;
      pm = {
        id: Date.now(),
        type: "player",
        text: "Which date works for everyone?",
        action: "poll",
        isPoll: true,
        pollId,
        votes: Object.fromEntries(dates.map((d) => [d, []])),
      };
    } else if (mode === "dm") {
      const ch = chars.find((c) => c.id === dmTarget);
      txt = input.trim();
      pm = { id: Date.now(), type: "player", text: txt, action: "dm", dmTarget: ch?.name || "" };
    } else {
      txt = input.trim();
      pm = { id: Date.now(), type: "player", text: txt, action: mode };
    }

    setMsgs((p) => [...p, pm]);
    setInput("");
    const newStep = steps + 1;
    setSteps(newStep);
    setLoading(true);

    try {
      const hist = msgs
        .filter((m) => m.type === "player" || m.type === "character")
        .slice(-10)
        .map((m) => `${m.sender || "You"}: ${m.text}`)
        .join("\n");
      const dmChar = mode === "dm" ? chars.find((c) => c.id === dmTarget) : null;
      const prompt = `Chat history:\n${hist || "(no messages yet)"}\n\nPlayer action (${mode}): "${txt}"\n${
        dmChar ? `\nDM TARGET: Only ${dmChar.name} should respond. Nobody else.\n` : ""
      }\nCurrent commitments: ${chars.map((c) => `${c.name}=${c.commitment}`).join(", ")}\n${
        mode === "poll" ? `\nDate options in poll: ${dates.join(" | ")}\nCharacters should vote for which date(s) suit them.\n` : ""
      }\nReturn JSON only.`;

      const ai = await sendTurn({ occ, chars, mode, dmTarget, prompt, dates });
      if (ai.narratorComment) setNarrator(ai.narratorComment);

      for (let i = 0; i < ai.responses.length; i++) {
        const r = ai.responses[i];
        const ch = chars.find((c) => c.id === r.characterId);
        if (!ch) continue;

        const delayBefore = 1500 + i * 800 + Math.random() * 2200;
        await new Promise((x) => setTimeout(x, delayBefore));
        const tid = `t${r.characterId}${Date.now()}`;
        setMsgs((p) => [...p, { id: tid, type: "typing", charName: ch.name, avatar: ch.avatar }]);

        const typingDuration = 3000 + Math.random() * 3000;
        await new Promise((x) => setTimeout(x, typingDuration));

        const isDm = mode === "dm";
        const newMsgs = r.messages.map((m, j) => ({
          id: `${Date.now()}${i}${j}`,
          type: "character",
          sender: ch.name,
          avatar: ch.avatar,
          characterId: r.characterId,
          text: m,
          isDm,
        }));
        setMsgs((p) => [...p.filter((m) => m.id !== tid), ...newMsgs]);

        if (mode === "poll" && Array.isArray(r.pollVotes) && r.pollVotes.length > 0) {
          setMsgs((p) =>
            p.map((m) => {
              if (m.pollId === pollId && m.isPoll) {
                const v = { ...m.votes };
                for (const d of r.pollVotes) {
                  if (dates.includes(d) && v[d] !== undefined && !v[d].includes(ch.name)) {
                    v[d] = [...v[d], ch.name];
                  }
                }
                return { ...m, votes: v };
              }
              return m;
            })
          );
        }

        const lastText = Array.isArray(r.messages) && r.messages.length ? r.messages[r.messages.length - 1] : "";
        setChars((p) =>
          p.map((c) => (c.id === r.characterId ? { ...c, commitment: r.commitment, lastMsg: lastText } : c))
        );
      }

      advanceDayAndApplyFlakes(newStep);
    } catch (e) {
      console.error(e);
      setMsgs((p) => [...p, { id: Date.now(), type: "system", text: "📡 Signal lost in Zone 2. Try again." }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleLockIn = () => {
    if (!occ) return;
    const payload = buildResult({ occ, confirmed, steps, personalBest });
    if (payload.isNewBest) {
      setPersonalBest(payload.nextBest);
      localStorage.setItem("pp-personal-best", String(payload.nextBest));
    }
    setResult(payload.result);
    postResult({
      occasionId: occ.id,
      steps,
      confirmedCount: confirmed.length,
      outcome: payload.result.type === "win" ? "win" : confirmed.length < occ.min ? "loss_too_few" : "loss_too_many",
      score: payload.result.score,
      confirmedChars: confirmed.map((c) => c.name),
    });
    setPhase("result");
  };

  const handleModeChange = (id) => {
    setMode(id);
    if (id === "pin") setInput(occ?.venue || "");
    else if (id !== "dm") setInput("");
  };

  const restart = () => {
    setResult(null);
    setPhase("intro");
  };

  return {
    phase,
    occ,
    chars,
    msgs,
    steps,
    daysLeft,
    input,
    mode,
    dmTarget,
    loading,
    narrator,
    result,
    personalBest,
    confirmed,
    maybeCount,
    inRange,
    endRef,
    inputRef,
    startGame,
    setDmTarget,
    setInput,
    handleSend,
    handleLockIn,
    handleModeChange,
    restart,
  };
}
