import { useEffect, useRef, useState } from "react";
import { getUpcomingDateInputs } from "../lib/dates.js";
import { fetchPlaceSuggestions, sendTurn, postResult } from "../api/gameApi.js";
import { buildCastForOccasion } from "../lib/proceduralCast.js";
import { buildResult, resolveCommitmentsAtLockIn } from "../utils/scoring.js";
import { assignSingleDmGhost, characterGhostingDm } from "../data/characters.js";
import { attachCloseTies } from "../data/characterTies.js";
import {
  STEPS_PER_WEEK,
  TOTAL_WEEKS,
  validatePlayerTurn,
  preparePlayerTurn,
  buildTurnPrompt,
  scheduleAfterAi,
  runPostResponseDrama,
  finalizeDisposableAction,
} from "../lib/playerTurn/index.js";

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

const DM_SILENT_SYSTEM = [
  (n) => `📵 ${n} has not opened your DM. Delivered — nothing else.`,
  (n) => `📵 ${n} left you on delivered. Blue ticks, zero drama.`,
  (n) => `📵 Your DM to ${n} hit the void. Read receipts say no.`,
];
const DM_SILENT_NARRATOR = [
  "Full ghost. Your DM is furniture now.",
  "They saw the chat. They chose silence.",
  "One blue tick energy. Two blue ticks fantasy.",
];

function pickLine(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function useGameState() {
  const [phase, setPhase] = useState("intro");
  const [occ, setOcc] = useState(null);
  const [chars, setChars] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [steps, setSteps] = useState(0);
  const [weeksLeft, setWeeksLeft] = useState(null);
  const [input, setInput] = useState("");
  const [pinSuggestions, setPinSuggestions] = useState([]);
  const [pollDates, setPollDates] = useState(["", "", ""]);
  const [deadlineWeek, setDeadlineWeek] = useState(null);
  const [deadlineTargetIds, setDeadlineTargetIds] = useState([]);
  const [nudgeUsed, setNudgeUsed] = useState(false);
  const [deadlineUsed, setDeadlineUsed] = useState(false);
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

  useEffect(() => {
    if (mode !== "pin") {
      setPinSuggestions([]);
      return;
    }
    const q = input.trim();
    if (q.length < 2) {
      setPinSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      const suggestions = await fetchPlaceSuggestions(q);
      setPinSuggestions(suggestions);
    }, 220);
    return () => clearTimeout(t);
  }, [mode, input]);

  const startGame = (occasion, castFromApi = null, gameDateKey = null) => {
    const dateKey = gameDateKey ?? new Date().toISOString().slice(0, 10);
    const raw =
      castFromApi?.map((c) => ({ ...c, commitment: "unknown", lastMsg: null })) ??
      buildCastForOccasion(occasion);
    // Exactly one archetype per run ignores DMs until week threshold (see characters.js).
    const cast = attachCloseTies(assignSingleDmGhost(raw, dateKey), dateKey, null);
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
        characterId: firstSpeaker.id,
        text: "Right, a group chat. What are we actually planning then?",
      },
    ]);
    setSteps(0);
    setWeeksLeft(TOTAL_WEEKS);
    const seedDates = getUpcomingDateInputs({ weeksAway: TOTAL_WEEKS });
    setPollDates([seedDates[0] || "", seedDates[1] || "", seedDates[2] || ""]);
    setNarrator("");
    setMode("message");
    setInput("");
    setDeadlineWeek(null);
    setDeadlineTargetIds([]);
    setNudgeUsed(false);
    setDeadlineUsed(false);
    setPhase("playing");
  };

  const advanceWeekAndApplyFlakes = (newStep) => {
    if (newStep % STEPS_PER_WEEK !== 0 || weeksLeft === null || weeksLeft <= 0) return;

    const newWeeksLeft = weeksLeft - 1;
    setWeeksLeft(newWeeksLeft);

    const flakeSystemMsgs = [];
    const deadlineMsgs = [];

    const updated = chars.map((c) => {
      // Deadline enforcement: if a deadline was set this week, anyone who still
      // hasn't answered gets dropped to ghost.
      if (
        deadlineWeek !== null &&
        newWeeksLeft < deadlineWeek &&
        deadlineTargetIds.includes(c.id) &&
        ["unknown", "seen"].includes(c.commitment)
      ) {
        deadlineMsgs.push({
          id: `dl${Date.now()}${c.id}`,
          type: "system",
          text: `⏰ ${c.name} missed the deadline. Spot released.`,
        });
        return { ...c, commitment: "ghost" };
      }

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

    if (deadlineWeek !== null && newWeeksLeft < deadlineWeek) {
      setDeadlineWeek(null);
      setDeadlineTargetIds([]);
    }

    const weekLabel =
      newWeeksLeft === 0
        ? "📆 Event week is here."
        : newWeeksLeft === 1
        ? "📆 Final week."
        : `📆 ${newWeeksLeft} weeks to go.`;
    setChars(updated);
    setMsgs((p) => [
      ...p,
      { id: `week${Date.now()}`, type: "system", text: weekLabel },
      ...deadlineMsgs,
      ...flakeSystemMsgs,
    ]);
  };

  const handleSend = async () => {
    if (
      !validatePlayerTurn({
        loading,
        occ,
        mode,
        input,
        nudgeUsed,
        deadlineUsed,
        chars,
      }).ok
    ) {
      return;
    }

    const { txt, playerMsg: pm, pollId, dates, pollDatesReset } = preparePlayerTurn({
      mode,
      occ,
      input,
      pollDates,
      weeksLeft,
      chars,
      dmTarget,
    });
    if (pollDatesReset) setPollDates(pollDatesReset);

    setMsgs((p) => [...p, pm]);
    setInput("");
    const newStep = steps + 1;
    setSteps(newStep);
    setLoading(true);

    try {
      const dmChar = mode === "dm" ? chars.find((c) => c.id === dmTarget) : null;

      if (mode === "dm" && dmChar && characterGhostingDm(dmTarget, weeksLeft, TOTAL_WEEKS, chars)) {
        const delayBefore = 800 + Math.random() * 1400;
        await new Promise((x) => setTimeout(x, delayBefore));
        setMsgs((p) => [
          ...p,
          {
            id: `dmignore${Date.now()}`,
            type: "system",
            variant: "dmGhost",
            ghostName: dmChar.name,
            text: pickLine(DM_SILENT_SYSTEM)(dmChar.name),
          },
        ]);
        setNarrator(`🚫 ${pickLine(DM_SILENT_NARRATOR)}`);
        advanceWeekAndApplyFlakes(newStep);
        setMode("message");
        return;
      }

      const prompt = buildTurnPrompt({ msgs, txt, mode, dmChar, chars, dates });

      const ai = await sendTurn({
        occ,
        chars,
        mode,
        dmTarget,
        prompt,
        dates,
        weeksLeft,
        totalWeeks: TOTAL_WEEKS,
      });
      if (ai.narratorComment) setNarrator(ai.narratorComment);

      scheduleAfterAi(mode, {
        chars,
        weeksLeft,
        setDeadlineWeek,
        setDeadlineTargetIds,
      });

      let responseList = Array.isArray(ai.responses) ? ai.responses : [];
      if (mode === "dm") {
        responseList = responseList.filter((r) => r.characterId === dmTarget);
      }

      for (let i = 0; i < responseList.length; i++) {
        const r = responseList[i];
        const ch = chars.find((c) => c.id === r.characterId);
        if (!ch) continue;

        const delayBefore = 450 + i * 250 + Math.random() * 700;
        await new Promise((x) => setTimeout(x, delayBefore));
        const tid = `t${r.characterId}${Date.now()}`;
        setMsgs((p) => [...p, { id: tid, type: "typing", charName: ch.name, avatar: ch.avatar }]);

        const typingDuration = 900 + Math.random() * 1100;
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

      runPostResponseDrama(mode, { setChars, setMsgs });
      finalizeDisposableAction(mode, { setNudgeUsed, setDeadlineUsed, setMode });

      advanceWeekAndApplyFlakes(newStep);
      setMode("message");
    } catch (e) {
      console.error(e);
      if (mode === "deadline") {
        setDeadlineWeek(null);
        setDeadlineTargetIds([]);
      }
      const detail = e?.message ? ` (${e.message})` : "";
      setMsgs((p) => [...p, { id: Date.now(), type: "system", text: `📡 Signal lost in Zone 2. Try again.${detail}` }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleLockIn = () => {
    if (!occ) return;
    const resolved = resolveCommitmentsAtLockIn(chars);
    const confirmedResolved = resolved.filter((c) => c.commitment === "yes");
    const payload = buildResult({ occ, confirmed: confirmedResolved, steps, personalBest });

    const maybeFlipped = chars.filter((c) => {
      if (c.commitment !== "maybe") return false;
      const r = resolved.find((x) => x.id === c.id);
      return r && r.commitment !== "maybe";
    });
    const hadMaybe = chars.some((c) => c.commitment === "maybe");
    let message = payload.result.message;
    if (maybeFlipped.length > 0) {
      message += " Some maybes finally picked a side.";
    } else if (hadMaybe) {
      message += " The maybes stayed vague — only firm yeses counted.";
    }

    if (payload.isNewBest) {
      setPersonalBest(payload.nextBest);
      localStorage.setItem("pp-personal-best", String(payload.nextBest));
    }
    setResult({ ...payload.result, message });
    postResult({
      occasionId: occ.id,
      steps,
      confirmedCount: confirmedResolved.length,
      outcome: payload.result.type === "win" ? "win" : confirmedResolved.length < occ.min ? "loss_too_few" : "loss_too_many",
      score: payload.result.score,
      confirmedChars: confirmedResolved.map((c) => c.name),
    });
    setPhase("result");
  };

  const handleModeChange = (id) => {
    setMode(id);
    if (id === "pin") setInput(occ?.venue || "");
    else if (id === "poll") {
      const seedDates = getUpcomingDateInputs({ weeksAway: Math.max(0, weeksLeft ?? TOTAL_WEEKS) });
      setPollDates([seedDates[0] || "", seedDates[1] || "", seedDates[2] || ""]);
    }
    else if (id !== "dm") setInput("");
    if (id !== "pin") setPinSuggestions([]);
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
    weeksLeft,
    input,
    mode,
    deadlineWeek,
    nudgeUsed,
    deadlineUsed,
    pinSuggestions,
    pollDates,
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
    setPinSuggestions,
    setPollDates,
    handleSend,
    handleLockIn,
    handleModeChange,
    restart,
  };
}
