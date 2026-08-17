import { useCallback, useEffect, useState } from "react";
import type { Answers } from "./reboot-diagnosis";

export type Phase = "cinematic" | "dissolve" | "diagnosis" | "report";

export type RebootState = {
  phase: Phase;
  screen: number;
  step: number;
  answers: Answers;
};

const KEY = "reboot.state.v1";

const initial: RebootState = { phase: "cinematic", screen: 0, step: 0, answers: {} };

function read(): RebootState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as Partial<RebootState>;
    return {
      ...initial,
      ...parsed,
      phase: parsed.phase === "dissolve" ? "diagnosis" : (parsed.phase ?? "cinematic"),
      answers: parsed.answers ?? {},
    };
  } catch {
    return initial;
  }
}

export function useRebootState() {
  const [state, setState] = useState<RebootState>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(read());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable */
    }
  }, [state, hydrated]);

  const patch = useCallback(
    (p: Partial<RebootState>) => setState((s) => ({ ...s, ...p })),
    [],
  );

  const reset = useCallback(() => setState(initial), []);

  return { state, patch, reset, hydrated };
}
