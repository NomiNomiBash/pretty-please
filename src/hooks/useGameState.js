import { useEffect, useRef, useState } from "react";
import { formatIsoDateLabel, getUpcomingDateInputs, getUpcomingDates } from "../lib/dates.js";
import { fetchPlaceSuggestions, sendTurn, postResult } from "../api/gameApi.js";
import { buildCastForOccasion } from "./useCast.js";
import { buildResult, resolveCommitmentsAtLockIn } from "../utils/scoring.js";
import { assignSingleDmGhost, characterGhostingDm } from "../data/characters.js";

const STEPS_PER_WEEK = 4;
const TOTAL_WEEKS = 7;

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
  (n) => `📵 ${n} has not opened this chat.`,
  (n) => `📵 ${n} is online. Your message stays delivered.`,
  (n) => `📵 You and ${n} are not having this conversation yet.`,
];
const DM_SILENT_NARRATOR = [
  "The DM was technically sent. Emotionally, it was not.",
  "Some chats are one-player games.",
  "Blue ticks: the museum piece of modern friendship.",
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
    const cast = assignSingleDmGhost(raw, dateKey);
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
    if (loading || !occ) return;
    const noTextModes = ["poll", "nudge", "deadline"];
    if (!noTextModes.includes(mode) && !input.trim() && mode !== "pin") return;
    if (mode === "nudge") {
      if (nudgeUsed) return;
      const targets = chars.filter((c) => ["ghost", "unknown", "seen"].includes(c.commitment));
      if (targets.length === 0) return;
    }
    if (mode === "deadline" && deadlineUsed) return;

    const pollWeeksAway = Math.max(0, weeksLeft ?? TOTAL_WEEKS);
    const fallbackDates = getUpcomingDates({ weeksAway: pollWeeksAway });
    const pickedDates = Array.from(
      new Set(
        pollDates
          .map((iso) => formatIsoDateLabel(iso))
          .filter(Boolean)
      )
    );
    const dates = pickedDates.length > 0 ? pickedDates : fallbackDates;
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
      const resetDates = getUpcomingDateInputs({ weeksAway: pollWeeksAway });
      setPollDates([resetDates[0] || "", resetDates[1] || "", resetDates[2] || ""]);
    } else if (mode === "nudge") {
      const targets = chars.filter((c) => ["ghost", "unknown", "seen"].includes(c.commitment));
      const names = targets.map((c) => c.name).join(", ");
      txt = `🔔 Hey — just checking in. ${names ? `${names}, any thoughts?` : "Anyone?"}`;
      pm = { id: Date.now(), type: "player", text: "🔔 Checking in on everyone...", action: "nudge" };
    } else if (mode === "deadline") {
      txt = `⏰ Need answers by end of this week — if I don't hear back I'll assume you're out.`;
      pm = { id: Date.now(), type: "player", text: "⏰ Answer by end of this week or I'm releasing your spot.", action: "deadline" };
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
      const dmChar = mode === "dm" ? chars.find((c) => c.id === dmTarget) : null;

      if (mode === "dm" && dmChar && characterGhostingDm(dmTarget, weeksLeft, TOTAL_WEEKS, chars)) {
        const delayBefore = 800 + Math.random() * 1400;
        await new Promise((x) => setTimeout(x, delayBefore));
        setMsgs((p) => [
          ...p,
          {
            id: `dmignore${Date.now()}`,
            type: "system",
            text: pickLine(DM_SILENT_SYSTEM)(dmChar.name),
          },
        ]);
        setNarrator(pickLine(DM_SILENT_NARRATOR));
        advanceWeekAndApplyFlakes(newStep);
        return;
      }

      const hist = msgs
        .filter((m) => m.type === "player" || m.type === "character")
        .slice(-10)
        .map((m) => `${m.sender || "You"}: ${m.text}`)
        .join("\n");
      const prompt = `Chat history:\n${hist || "(no messages yet)"}\n\nPlayer action (${mode}): "${txt}"\n${
        dmChar ? `\nDM TARGET: Only ${dmChar.name} (id "${dmChar.id}") should respond. Nobody else.\n` : ""
      }\nCurrent commitments: ${chars.map((c) => `${c.name}=${c.commitment}`).join(", ")}\n${
        mode === "poll" ? `\nDate options in poll: ${dates.join(" | ")}\nCharacters should vote for which date(s) suit them.\n` : ""
      }${
        mode === "nudge"
          ? `\nNUDGE TARGETS (ghost/unseen only): ${chars.filter((c) => ["ghost","unknown","seen"].includes(c.commitment)).map((c) => `${c.name} id:${c.id}`).join(", ") || "none"}. Follow the NUDGE hard requirements.\n`
          : mode === "deadline"
          ? "\nFollow the DEADLINE hard requirements in the system prompt (minimum 4 replies; force real commitment changes).\n"
          : ""
      }\nReturn JSON only.`;

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

      if (mode === "deadline") {
        const dlTargets = chars.filter((c) => ["ghost", "unknown", "seen"].includes(c.commitment));
        setDeadlineWeek(weeksLeft);
        setDeadlineTargetIds(dlTargets.map((c) => c.id));
      }

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

      if (mode === "nudge") {
        setChars((prev) => {
          const ghosts = prev.filter((c) => c.commitment === "ghost");
          const pick = ghosts.slice(0, 2);
          const idSet = new Set(pick.map((c) => c.id));
          const names = [];
          const next = prev.map((c) => {
            if (!idSet.has(c.id)) return c;
            if (Math.random() < 0.78) {
              names.push(c.name);
              return { ...c, commitment: "maybe" };
            }
            return c;
          });
          if (names.length) {
            queueMicrotask(() =>
              setMsgs((m) => [
                ...m,
                {
                  id: `nudgefx${Date.now()}`,
                  type: "system",
                  text: `🔔 ${names.join(" & ")} surfaced after the nudge.`,
                },
              ])
            );
          }
          return next;
        });
      }

      if (mode === "deadline") {
        setChars((prev) =>
          prev.map((c) => {
            const u = Math.random();
            if (c.commitment === "maybe") {
              if (u < 0.42) return { ...c, commitment: "yes" };
              if (u < 0.68) return { ...c, commitment: "no" };
              return c;
            }
            if (c.commitment === "unknown") {
              if (u < 0.36) return { ...c, commitment: "maybe" };
              if (u < 0.52) return { ...c, commitment: "yes" };
              return c;
            }
            if (c.commitment === "seen") {
              if (u < 0.44) return { ...c, commitment: "maybe" };
              if (u < 0.58) return { ...c, commitment: "yes" };
              return c;
            }
            return c;
          })
        );
        setMsgs((p) => [
          ...p,
          {
            id: `deadlinefx${Date.now()}`,
            type: "system",
            text: "⏰ The deadline shook loose a few actual answers.",
          },
        ]);
      }

      if (mode === "nudge") {
        setNudgeUsed(true);
        setMode("message");
      }
      if (mode === "deadline") {
        setDeadlineUsed(true);
        setMode("message");
      }

      advanceWeekAndApplyFlakes(newStep);
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
