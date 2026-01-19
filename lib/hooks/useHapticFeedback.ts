import { useCallback } from "react";

type HapticPattern = "light" | "medium" | "heavy";

export function useHapticFeedback() {
  const trigger = useCallback(
    (pattern: HapticPattern = "light", durationOverride?: number) => {
      if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;

      const duration =
        typeof durationOverride === "number"
          ? durationOverride
          : pattern === "heavy"
            ? 50
            : pattern === "medium"
              ? 25
              : 10;

      navigator.vibrate(duration);
    },
    [],
  );

  return { trigger };
}
