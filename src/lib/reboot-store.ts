import { useCallback, useEffect, useState } from "react";
import type { Answers } from "./reboot-diagnosis";
import type { SessionFeedback } from "./reboot-program";

export type Phase = "cinematic" | "dissolve" | "diagnosis" | "report" | "app";
export type Tab = "today" | "train" | "program" | "profile";

export type RebootState = {
  phase: Phase;
  screen: number;
  step: number;
  answers: Answers;
  tab: Tab;
  day: number;
  sessions: SessionFeedback[];
};

const KEY = "reboot.state.v2";

const initial: RebootState = {
  phase: "cinematic",
  screen: 0,
  step: 0,
  answers: {},
  tab: "today",
  day: 1,
  sessions: [],
};

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
      sessions: parsed.sessions ?? [],
      day: parsed.day ?? 1,
      tab: parsed.tab ?? "today",
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

  const patch = useCallback((p: Partial<RebootState>) => setState((s) => ({ ...s, ...p })), []);

  const completeSession = useCallback(
    (feedback: SessionFeedback) =>
      setState((s) => ({
        ...s,
        sessions: [...s.sessions.filter((x) => x.day !== feedback.day), feedback],
      })),
    [],
  );

  const reset = useCallback(() => setState(initial), []);

  return { state, patch, reset, completeSession, hydrated };
}
