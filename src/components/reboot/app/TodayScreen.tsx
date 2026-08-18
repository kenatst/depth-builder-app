import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import type { Answers } from "@/lib/reboot-diagnosis";
import { prescriptionFor, type SessionFeedback } from "@/lib/reboot-program";

const EASE = [0.22, 0.9, 0.24, 1] as const;

export function TodayScreen({
  answers,
  day,
  session,
  onStart,
}: {
  answers: Answers;
  day: number;
  session?: SessionFeedback;
  onStart: () => void;
}) {
  const p = prescriptionFor(answers, day);
  const [why, setWhy] = useState(false);
  const [soft, setSoft] = useState(false);

  return (
    <div className="mx-auto w-full max-w-[30rem] px-6 pb-36">
      <Fade delay={0}>
        <p className="meta-label text-ink-faint">
          Day {String(p.day).padStart(3, "0")} / {p.totalDays}
          {p.day <= 7 && " · Calibration"}
        </p>
        <h1 className="mt-4 font-serif text-[3rem] leading-[0.98] tracking-[-0.02em]">
          {p.headline}
        </h1>
      </Fade>

      <Fade delay={0.06}>
        <motion.div
          layout
          className="paper-card mt-7 overflow-hidden p-7"
          style={{ boxShadow: "var(--shadow-lift)" }}
        >
          <p className="meta-label text-coral">Today's target</p>
          <p className="mt-3 text-[1.375rem] font-semibold leading-snug tracking-[-0.02em]">
            {p.target}
          </p>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">{p.reason}</p>

          <div className="mt-6 flex items-center gap-2.5">
            <Pill>{p.trainingLabel}</Pill>
            <Pill>{p.minutes} min</Pill>
          </div>

          {session ? (
            <div
              className="mt-7 rounded-2xl px-5 py-4"
              style={{ background: "color-mix(in oklab, var(--cyan) 13%, transparent)" }}
            >
              <p className="text-[0.9375rem] font-semibold tracking-[-0.01em]">
                Today's block is logged
              </p>
              <p className="mt-1 text-[0.875rem] leading-relaxed text-ink-soft">
                {p.minutes} minutes recorded. REBOOT will use it to shape tomorrow.
              </p>
            </div>
          ) : (
            <button
              onClick={onStart}
              className="mt-7 w-full rounded-full bg-ink px-6 py-4 text-[1rem] font-semibold tracking-tight text-paper transition-transform duration-200 active:scale-[0.985]"
            >
              {p.cta}
            </button>
          )}

          <button
            onClick={() => setWhy((v) => !v)}
            className="mt-4 flex w-full items-center justify-center gap-1.5 text-[0.875rem] font-medium text-ink-faint transition-colors hover:text-ink"
          >
            Why this?
            <motion.span animate={{ rotate: why ? 180 : 0 }} transition={{ duration: 0.22 }}>
              <ChevronDown size={15} />
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {why && (
              <motion.p
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: EASE }}
                className="overflow-hidden text-[0.9375rem] leading-relaxed text-ink-soft"
              >
                <span className="mt-4 block">{p.why}</span>
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </Fade>

      <Fade delay={0.12}>
        <motion.div layout className="paper-card mt-3 p-6">
          <p className="meta-label text-ink-faint">One real-world action</p>
          <p className="mt-2.5 text-[1.0625rem] font-semibold tracking-[-0.015em]">
            {soft ? p.action.fallbackTitle : p.action.title}
          </p>
          <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-soft">
            {soft ? p.action.fallbackBody : p.action.body}
          </p>
          {!soft && (
            <button
              onClick={() => setSoft(true)}
              className="mt-4 text-[0.875rem] font-medium text-ink-faint transition-colors hover:text-ink"
            >
              I can't do this today
            </button>
          )}
        </motion.div>
      </Fade>

      <Fade delay={0.18}>
        <div className="paper-card mt-3 p-6">
          <div className="flex items-baseline justify-between gap-4">
            <p className="meta-label text-cyan">{p.signal.label}</p>
            <p className="text-[0.9375rem] font-semibold tracking-[-0.01em]">{p.signal.value}</p>
          </div>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{p.signal.note}</p>
        </div>
      </Fade>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="rounded-full px-3.5 py-1.5 text-[0.8125rem] font-medium text-ink-soft"
      style={{ background: "color-mix(in oklab, var(--ink) 5%, transparent)" }}
    >
      {children}
    </span>
  );
}

function Fade({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.42, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
