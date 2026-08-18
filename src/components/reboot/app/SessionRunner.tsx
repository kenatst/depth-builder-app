import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, X } from "lucide-react";
import {
  DIFFICULTY,
  ENERGY_AFTER,
  FIRST_DISTRACTION,
  SWITCH_COUNTS,
  type Prescription,
  type SessionFeedback,
} from "@/lib/reboot-program";

const EASE = [0.22, 0.9, 0.24, 1] as const;

type Step = { key: keyof SessionFeedback; title: string; options: { value: string; label: string }[] };

const STEPS: Step[] = [
  { key: "firstDistraction", title: "What pulled you away first?", options: FIRST_DISTRACTION },
  { key: "switches", title: "Roughly how many times did you switch?", options: SWITCH_COUNTS },
  { key: "difficulty", title: "How did it feel?", options: DIFFICULTY },
  { key: "energy", title: "And your energy now?", options: ENERGY_AFTER },
];

export function SessionRunner({
  prescription,
  onClose,
  onComplete,
}: {
  prescription: Prescription;
  onClose: () => void;
  onComplete: (f: SessionFeedback) => void;
}) {
  const total = prescription.minutes * 60;
  const [left, setLeft] = useState(total);
  const [running, setRunning] = useState(true);
  const [done, setDone] = useState(false);
  const [step, setStep] = useState(0);
  const answers = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!running || done) return;
    const t = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          setDone(true);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, done]);

  const clock = useMemo(() => {
    const m = Math.floor(left / 60);
    const s = left % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, [left]);

  const pick = (key: string, value: string) => {
    answers.current[key] = value;
    if (step < STEPS.length - 1) {
      setTimeout(() => setStep((s) => s + 1), 200);
      return;
    }
    setTimeout(
      () =>
        onComplete({
          day: prescription.day,
          completedAt: new Date().toISOString(),
          minutes: prescription.minutes,
          firstDistraction: answers.current["firstDistraction"] ?? "",
          switches: answers.current["switches"] ?? "",
          difficulty: answers.current["difficulty"] ?? "",
          energy: answers.current["energy"] ?? "",
        }),
      220,
    );
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-paper text-ink"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.28, ease: EASE }}
    >
      <div className="safe-top safe-bottom mx-auto flex h-full w-full max-w-[30rem] flex-col px-6">
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
              key="timer"
              className="flex flex-1 flex-col items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.24, ease: EASE }}
            >
              <div
                className="breathe h-2.5 w-2.5 rounded-full"
                style={{ background: "var(--coral)" }}
              />
              <p className="mt-8 font-serif text-[5rem] leading-none tracking-[-0.03em] tabular-nums">
                {clock}
              </p>
              <p className="mt-4 max-w-[18rem] text-center text-[0.9375rem] leading-relaxed text-ink-soft">
                {prescription.target}
              </p>
              <div className="mt-10 flex items-center gap-3">
                <button
                  onClick={() => setRunning((r) => !r)}
                  className="rounded-full px-6 py-3 text-[0.9375rem] font-medium transition-transform duration-200 active:scale-[0.97]"
                  style={{ background: "color-mix(in oklab, var(--ink) 6%, transparent)" }}
                >
                  {running ? "Pause" : "Resume"}
                </button>
                <button
                  onClick={() => setDone(true)}
                  className="rounded-full bg-ink px-6 py-3 text-[0.9375rem] font-semibold text-paper transition-transform duration-200 active:scale-[0.97]"
                >
                  I'm done
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`q-${step}`}
              className="flex flex-1 flex-col justify-center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: EASE }}
            >
              <p className="meta-label text-coral">
                Block logged · {step + 1} of {STEPS.length}
              </p>
              <h2 className="mt-4 font-serif text-[2.1rem] leading-[1.06] tracking-[-0.015em]">
                {STEPS[step]!.title}
              </h2>
              <div className="mt-7 space-y-2.5">
                {STEPS[step]!.options.map((o) => {
                  const active = answers.current[STEPS[step]!.key] === o.value;
                  return (
                    <button
                      key={o.value}
                      onClick={() => pick(STEPS[step]!.key, o.value)}
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
                Your answers are stored as-is. REBOOT does not turn them into a score.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
