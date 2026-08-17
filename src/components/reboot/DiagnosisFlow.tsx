import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import type { Answers } from "@/lib/reboot-diagnosis";
import { optionsFor, visibleQuestions } from "@/lib/reboot-diagnosis";

type Props = {
  answers: Answers;
  step: number;
  onAnswers: (a: Answers) => void;
  onStep: (n: number) => void;
  onComplete: () => void;
};

const EASE = [0.22, 0.9, 0.24, 1] as const;

export function DiagnosisFlow({ answers, step, onAnswers, onStep, onComplete }: Props) {
  const reduce = useReducedMotion();
  const questions = visibleQuestions(answers);
  const index = Math.min(step, questions.length - 1);
  const q = questions[index]!;
  const options = optionsFor(q, answers);
  const selected = answers[q.id] ?? [];
  const canContinue = selected.length > 0;
  const progress = (index + (canContinue ? 1 : 0)) / questions.length;

  const choose = (value: string) => {
    if (q.kind === "multi") {
      const next = selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value];
      onAnswers({ ...answers, [q.id]: next });
      return;
    }
    const cleared = { ...answers, [q.id]: [value] };
    // a changed primary goal can invalidate later dependent answers
    onAnswers(cleared);
    setTimeout(() => advance(cleared), 220);
  };

  const advance = (state: Answers = answers) => {
    const list = visibleQuestions(state);
    const pos = list.findIndex((x) => x.id === q.id);
    if (pos >= list.length - 1) onComplete();
    else onStep(pos + 1);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-ink">
      <header className="safe-top px-6">
        <div className="mx-auto flex w-full max-w-[30rem] items-center gap-4">
          <button
            onClick={() => onStep(Math.max(0, index - 1))}
            disabled={index === 0}
            className="text-[0.8125rem] text-ink-faint transition-opacity disabled:opacity-0"
          >
            Back
          </button>
          <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-hairline">
            <motion.div
              className="h-full rounded-full bg-ink"
              animate={{ width: `${Math.max(6, progress * 100)}%` }}
              transition={{ duration: 0.5, ease: EASE }}
            />
          </div>
          <span className="meta-label text-ink-faint">
            {index + 1}/{questions.length}
          </span>
        </div>
      </header>

      <main className="flex-1 px-6 pt-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: reduce ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -10 }}
            transition={{ duration: 0.42, ease: EASE }}
            className="mx-auto w-full max-w-[30rem]"
          >
            <h2 className="font-serif text-[2.1rem] leading-[1.08] tracking-[-0.01em] text-ink">
              {q.title}
            </h2>
            {q.hint && <p className="mt-3 text-[0.9375rem] text-ink-soft">{q.hint}</p>}

            <div className="mt-8 space-y-2.5 pb-40">
              {options.map((o, i) => {
                const active = selected.includes(o.value);
                return (
                  <motion.button
                    key={o.value}
                    onClick={() => choose(o.value)}
                    initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduce ? 0 : 0.05 + i * 0.03, duration: 0.36, ease: EASE }}
                    className="paper-card flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-all duration-200 active:scale-[0.99]"
                    style={{
                      boxShadow: active ? "var(--shadow-lift)" : "var(--shadow-soft)",
                      background: active ? "var(--ink)" : "var(--paper-raised)",
                      color: active ? "var(--paper)" : "var(--ink)",
                    }}
                  >
                    <span className="text-[1.0625rem] font-medium tracking-[-0.01em]">
                      {o.label}
                    </span>
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors"
                      style={{
                        background: active
                          ? "color-mix(in oklab, var(--paper) 22%, transparent)"
                          : "color-mix(in oklab, var(--ink) 6%, transparent)",
                      }}
                    >
                      {active && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {q.kind === "multi" && (
        <div className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 px-6 pt-16"
          style={{
            background:
              "linear-gradient(to bottom, transparent, color-mix(in oklab, var(--paper) 85%, transparent) 35%, var(--paper) 70%)",
          }}
        >
          <div className="mx-auto w-full max-w-[30rem]">
            <button
              onClick={() => advance()}
              disabled={!canContinue}
              className="pointer-events-auto w-full rounded-full bg-ink px-6 py-4 text-[1rem] font-semibold tracking-tight text-paper transition-all duration-200 active:scale-[0.985] disabled:opacity-25"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
