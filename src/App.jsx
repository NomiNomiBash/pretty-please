import { IntroScreen } from "./components/IntroScreen.jsx";
import { ResultScreen } from "./components/ResultScreen.jsx";
import { GameView } from "./components/GameView.jsx";
import { useGameState } from "./hooks/useGameState.js";
import { useCast } from "./hooks/useCast.js";

function clearPreviewResultQueryAndReload() {
  window.history.replaceState({}, "", window.location.pathname + window.location.hash);
  window.location.reload();
}

export function App() {
  const game = useGameState();
  const { castData } = useCast();

  // Dev only: open result screen without playing — e.g. http://localhost:5173/?previewResult=win
  if (import.meta.env.DEV) {
    const pr = new URLSearchParams(window.location.search).get("previewResult");
    if (pr === "win") {
      return (
        <ResultScreen
          result={{
            type: "win",
            title: "🎉 It's Happening",
            message: "6/8 confirmed. The House Warming is ON. Took 10 steps. (Dev preview)",
            score: 78,
            attendees: [
              { name: "Priya", avatar: "👩🏾" },
              { name: "Tom", avatar: "🧑🏻" },
              { name: "Zara", avatar: "👩🏽" },
              { name: "Marcus", avatar: "👨🏾" },
              { name: "Bex", avatar: "👩🏼" },
              { name: "Ollie", avatar: "🧑🏽" },
            ],
            isNewBest: true,
          }}
          occasion={null}
          steps={10}
          personalBest={null}
          onRestart={clearPreviewResultQueryAndReload}
        />
      );
    }
    if (pr === "loss") {
      return (
        <ResultScreen
          result={{
            type: "loss",
            title: "💀 Not Enough",
            message: "Only 2 confirmed. Needed at least 5. (Dev preview)",
            score: 16,
            attendees: [],
          }}
          occasion={null}
          steps={22}
          personalBest={12}
          onRestart={clearPreviewResultQueryAndReload}
        />
      );
    }
    if (pr === "tooMany") {
      return (
        <ResultScreen
          result={{
            type: "loss",
            title: "😬 Too Many People",
            message: "10 said yes. You only had room for 8. (Dev preview)",
            score: 48,
            attendees: [
              { name: "Ayo", avatar: "👩🏿" },
              { name: "Bex", avatar: "👩🏼" },
              { name: "Callum", avatar: "👨🏻" },
              { name: "Hamish", avatar: "🧔🏻" },
              { name: "Jade", avatar: "👩🏽" },
              { name: "Marcus", avatar: "👨🏾" },
              { name: "Nadia", avatar: "👩🏿" },
              { name: "Ollie", avatar: "🧑🏽" },
              { name: "Priya", avatar: "👩🏾" },
              { name: "Remi", avatar: "👩🏻" },
            ],
          }}
          occasion={null}
          steps={18}
          personalBest={null}
          onRestart={clearPreviewResultQueryAndReload}
        />
      );
    }
  }

  if (game.phase === "intro") {
    return (
      <IntroScreen
        occasionOverride={castData?.occasion}
        onStart={(occasion) =>
          game.startGame(castData?.occasion || occasion, castData?.characters || null, castData?.date ?? null)
        }
      />
    );
  }
  if (game.phase === "result") {
    return (
      <ResultScreen
        result={game.result}
        occasion={game.occ}
        steps={game.steps}
        personalBest={game.personalBest}
        onRestart={game.restart}
      />
    );
  }

  /* Player actions (message / poll / pin / DM / nudge / deadline) are validated and prepared in
     `src/lib/playerTurn/` — each mode maps to prep + optional post-AI drama hooks in `postAiByMode.js`. */
  return (
    <GameView
      personalBest={game.personalBest}
      occ={game.occ}
      chars={game.chars}
      msgs={game.msgs}
      steps={game.steps}
      weeksLeft={game.weeksLeft}
      loading={game.loading}
      narrator={game.narrator}
      mode={game.mode}
      deadlineActive={game.deadlineWeek !== null}
      nudgeUsed={game.nudgeUsed}
      deadlineUsed={game.deadlineUsed}
      pinSuggestions={game.pinSuggestions}
      pollDates={game.pollDates}
      dmTarget={game.dmTarget}
      input={game.input}
      confirmed={game.confirmed}
      maybeCount={game.maybeCount}
      inRange={game.inRange}
      onModeChange={game.handleModeChange}
      onDmTargetChange={game.setDmTarget}
      onInputChange={game.setInput}
      onPinSuggestionSelect={(label) => {
        game.setInput(label);
        game.setPinSuggestions([]);
      }}
      onPollDatesChange={game.setPollDates}
      onSend={game.handleSend}
      onLockIn={game.handleLockIn}
      endRef={game.endRef}
      inputRef={game.inputRef}
    />
  );
}
