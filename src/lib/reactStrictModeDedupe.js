/**
 * React 18 Strict Mode (development) invokes functional setState updaters twice.
 * Side effects inside those updaters (e.g. queueMicrotask → setMsgs) then run twice → duplicate system lines.
 * This helper caches the first transition result for a logical key so the second pass returns the same chars
 * and only one microtask runs.
 */
const charTransitionCache = new Map();

/**
 * @template T
 * @param {string} key
 * @param {(updater: (prev: T) => T) => void} setChars
 * @param {(prev: T) => { nextChars: T, enqueue?: () => void }} compute
 */
export function runSetCharsTransitionOnce(key, setChars, compute) {
  setChars((prev) => {
    if (charTransitionCache.has(key)) {
      return charTransitionCache.get(key);
    }
    const { nextChars, enqueue } = compute(prev);
    charTransitionCache.set(key, nextChars);
    queueMicrotask(() => {
      enqueue?.();
      charTransitionCache.delete(key);
    });
    return nextChars;
  });
}

/**
 * Append system messages once (guards duplicate setState passes / microtasks with same anchor id).
 * @param {(updater: (prev: unknown[]) => unknown[]) => void} setMsgs
 * @param {string} anchorId
 * @param {Array<{ id: string, type: string, text?: string }>} blocks
 */
export function appendSystemMsgsOnce(setMsgs, anchorId, blocks) {
  setMsgs((p) => {
    if (p.some((m) => m.id === anchorId)) return p;
    return [...p, ...blocks];
  });
}
