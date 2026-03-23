import { IntroScreen } from "./components/IntroScreen.jsx";
import { ResultScreen } from "./components/ResultScreen.jsx";
import { GameView } from "./components/GameView.jsx";
import { useGameState } from "./hooks/useGameState.js";
import { useCast } from "./hooks/useCast.js";

export function App() {
  const game = useGameState();
  const { castData } = useCast();

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
