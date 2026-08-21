import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, X } from "lucide-react";
import {
  DIFFICULTY,
  ENERGY_AFTER,
  FIRST_DISTRACTION,
  RESPONSE_QUALITY,
  SWITCH_COUNTS,
  type Prescription,
  type SessionResult,
} from "@/lib/reboot-program";
import { MODE_LABEL } from "@/lib/reboot-profile";

const EASE = [0.22, 0.9, 0.24, 1] as const;

type Field = "firstDistraction" | "switches" | "difficulty" | "energy" | "responseQuality";
type Step = { key: Field; title: string; options: { value: string; label: string }[] };

function stepsFor(p: Prescription): Step[] {
  const steps: Step[] = [];
  if (p.mode === "recall" || p.mode === "explain") {
    steps.push({
      key: "responseQuality",
      title: p.mode === "recall" ? "How much came back?" : "How clear was your explanation?",
      options: RESPONSE_QUALITY,
    });
  }
  if (p.mode !== "observe") {
    steps.push(
      { key: "firstDistraction", title: "What pulled you away first?", options: FIRST_DISTRACTION },
      { key: "switches", title: "Roughly how many times did you switch?", options: SWITCH_COUNTS },
    );
  } else {
    steps.push({
      key: "firstDistraction",
      title: "What triggered the reach?",
      options: FIRST_DISTRACTION,
    });
  }
  steps.push(
    { key: "difficulty", title: "How did it feel?", options: DIFFICULTY },
    { key: "energy", title: "And your energy now?", options: ENERGY_AFTER },
  );
  return steps;
}

export function SessionRunner({
  prescription,
  onClose,
  onComplete,
}: {
  prescription: Prescription;
  onClose: () => void;
  onComplete: (r: SessionResult) => void;
}) {
  const isMission = prescription.mode === "observe";
  const total = prescription.minutes * 60;
  const [left, setLeft] = useState(total);
  const [running, setRunning] = useState(!isMission);
  const [done, setDone] = useState(false);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [step, setStep] = useState(0);
  const [note, setNote] = useState("");
  const answers = useRef<Partial<Record<Field, string>>>({});
  const steps = useMemo(() => stepsFor(prescription), [prescription]);

  useEffect(() => {
    if (isMission || !running || done) return;
    const t = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          setReachedEnd(true);
          setDone(true);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, done, isMission]);

  const clock = useMemo(() => {
    const m = Math.floor(left / 60);
    const s = left % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, [left]);

  const needsText = prescription.mode === "recall" || prescription.mode === "explain" || isMission;

  const finish = () => {
    const result: SessionResult = {
      id: `${prescription.day}-${Date.now()}`,
      day: prescription.day,
      mode: prescription.mode,
      completedAt: new Date().toISOString(),
      plannedMinutes: prescription.minutes,
      actualSeconds: isMission ? 0 : total - left,
      completed: isMission ? true : reachedEnd,
      ...answers.current,
      ...(isMission && note ? { observation: note } : {}),
    };
    onComplete(result);
  };

  const pick = (key: Field, value: string) => {
    answers.current[key] = value;
    if (step < steps.length - 1) {
      setTimeout(() => setStep((s) => s + 1), 200);
      return;
    }
    setTimeout(finish, 220);
  };

  const current = steps[step]!;

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-y-auto bg-paper text-ink"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.28, ease: EASE }}
    >
      <div className="safe-top safe-bottom mx-auto flex min-h-full w-full max-w-[30rem] flex-col px-6">
        <div className="flex items-center justify-between">
          <p className="meta-label text-ink-faint">{prescription.trainingLabel}</p>
          <button
            onClick={onClose}
            aria-label="Close session"
            className="rounded-full p-2 text-ink-faint transition-colors hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div
              key="run"
              className="flex flex-1 flex-col items-center justify-center py-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.24, ease: EASE }}
            >
              <div
                className="breathe h-2.5 w-2.5 rounded-full"
                style={{ background: "var(--coral)" }}
              />
              {isMission ? (
                <p className="mt-8 font-serif text-[2.6rem] leading-[1.05] tracking-[-0.02em]">
                  {MODE_LABEL[prescription.mode]}
                </p>
              ) : (
                <p className="mt-8 font-serif text-[5rem] leading-none tracking-[-0.03em] tabular-nums">
                  {clock}
                </p>
              )}
              <p className="mt-4 max-w-[19rem] text-center text-[0.9375rem] leading-relaxed text-ink-soft">
                {prescription.instruction}
              </p>

              {isMission && (
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What happened just before you reached?"
                  rows={4}
                  className="mt-7 w-full resize-none rounded-2xl px-5 py-4 text-[0.9375rem] leading-relaxed outline-none placeholder:text-ink-faint"
                  style={{ background: "color-mix(in oklab, var(--ink) 4%, transparent)" }}
                />
              )}

              <div className="mt-10 flex items-center gap-3">
                {!isMission && (
                  <button
                    onClick={() => setRunning((r) => !r)}
                    className="rounded-full px-6 py-3 text-[0.9375rem] font-medium transition-transform duration-200 active:scale-[0.97]"
                    style={{ background: "color-mix(in oklab, var(--ink) 6%, transparent)" }}
                  >
                    {running ? "Pause" : "Resume"}
                  </button>
                )}
                <button
                  onClick={() => setDone(true)}
                  className="rounded-full bg-ink px-6 py-3 text-[0.9375rem] font-semibold text-paper transition-transform duration-200 active:scale-[0.97]"
                >
                  {isMission ? "Logged it" : "I'm done"}
                </button>
              </div>

              {needsText && !isMission && (
                <p className="mt-6 max-w-[19rem] text-center text-[0.8125rem] leading-relaxed text-ink-faint">
                  {prescription.mode === "recall"
                    ? "When the timer ends, close the source before writing anything."
                    : "When the timer ends, explain it without looking."}
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={`q-${step}`}
              className="flex flex-1 flex-col justify-center py-10"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: EASE }}
            >
              <p className="meta-label text-coral">
                {MODE_LABEL[prescription.mode]} logged · {step + 1} of {steps.length}
              </p>
              <h2 className="mt-4 font-serif text-[2.1rem] leading-[1.06] tracking-[-0.015em]">
                {current.title}
              </h2>
              <div className="mt-7 space-y-2.5">
                {current.options.map((o) => {
                  const active = answers.current[current.key] === o.value;
                  return (
                    <button
                      key={o.value}
                      onClick={() => pick(current.key, o.value)}
                      className="flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left text-[1rem] font-medium tracking-[-0.01em] transition-all duration-200 active:scale-[0.99]"
                      style={{
                        background: active
                          ? "var(--ink)"
                          : "color-mix(in oklab, var(--ink) 4%, transparent)",
                        color: active ? "var(--paper)" : "var(--ink)",
                      }}
                    >
                      {o.label}
                      {active && <Check size={17} />}
                    </button>
                  );
                })}
              </div>
              <p className="mt-6 text-[0.8125rem] leading-relaxed text-ink-faint">
                Your answers are stored as-is. REBOOT uses them to choose tomorrow, not to score you.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
