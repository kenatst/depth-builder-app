import { motion } from "motion/react";
import { answerLabels, isUnknown, QUESTIONS, visibleQuestions } from "@/lib/reboot-diagnosis";
import type { Answers } from "@/lib/reboot-diagnosis";

const EASE = [0.22, 0.9, 0.24, 1] as const;

const FOCUS_COPY: Record<string, string> = {
  lt5: "Under 5 minutes",
  "5_15": "5 – 15 minutes",
  "15_30": "15 – 30 minutes",
  "30_60": "30 – 60 minutes",
  gt60: "60+ minutes",
};

export function StartingPoint({
  answers,
  onRestart,
  onStart,
}: {
  answers: Answers;
  onRestart: () => void;
  onStart: () => void;
}) {
  const primary = answerLabels("primary", answers)[0] ?? "Not chosen yet";
  const breaker = isUnknown("breaker", answers)
    ? "Not identified yet"
    : (answerLabels("breaker", answers)[0] ?? "");
  const window = isUnknown("focus_window", answers)
    ? "Unmeasured"
    : (FOCUS_COPY[answers["focus_window"]?.[0] ?? ""] ?? "Unmeasured");
  const absorption = isUnknown("absorption", answers) ? [] : answerLabels("absorption", answers);

  const answered = visibleQuestions(answers);
  const unknowns = answered
    .filter((q) => isUnknown(q.id, answers))
    .map((q) => UNKNOWN_COPY[q.id] ?? q.title);

  const known = answered
    .filter((q) => !isUnknown(q.id, answers) && !["goals", "primary"].includes(q.id))
    .map((q) => ({
      label: SHORT[q.id] ?? q.title,
      value: answerLabels(q.id, answers).join(", "),
    }));

  return (
    <div className="min-h-[100dvh] bg-paper text-ink">
      <div className="safe-top safe-bottom mx-auto w-full max-w-[30rem] px-6">
        <Fade delay={0}>
          <p className="meta-label text-ink-faint">Reboot / Calibration</p>
          <h1 className="mt-4 font-serif text-[2.6rem] leading-[1.03] tracking-[-0.015em]">
            Your starting point
          </h1>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">
            Built from what you told us. The first week will replace these answers with what
            actually happens.
          </p>
        </Fade>

        <div className="mt-8 space-y-3">
          <Fade delay={0.08}>
            <div className="paper-card p-6" style={{ boxShadow: "var(--shadow-lift)" }}>
              <p className="meta-label text-coral">Primary goal</p>
              <p className="mt-2 font-serif text-[2rem] leading-tight">{primary}</p>
              {(answers["goals"]?.length ?? 0) > 1 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {answerLabels("goals", answers)
                    .filter((g) => g !== primary)
                    .map((g) => (
                      <span
                        key={g}
                        className="rounded-full px-3 py-1.5 text-[0.8125rem] text-ink-soft"
                        style={{ background: "color-mix(in oklab, var(--ink) 5%, transparent)" }}
                      >
                        {g}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </Fade>

          <div className="grid grid-cols-2 gap-3">
            <Fade delay={0.14}>
              <Stat label="Main breaker" value={breaker} accent="var(--coral)" />
            </Fade>
            <Fade delay={0.18}>
              <Stat label="Focus window" value={window} accent="var(--cyan)" />
            </Fade>
          </div>

          <Fade delay={0.24}>
            <div className="paper-card p-6">
              <p className="meta-label text-ink-faint">Absorption context</p>
              {absorption.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {absorption.map((a) => (
                    <span
                      key={a}
                      className="rounded-full px-3.5 py-2 text-[0.875rem] font-medium"
                      style={{
                        background: "color-mix(in oklab, var(--cyan) 14%, transparent)",
                        color: "color-mix(in oklab, var(--ink) 90%, var(--cyan))",
                      }}
                    >
                      {a}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[0.9375rem] text-ink-soft">
                  Nothing reliable yet — REBOOT will look for it in your sessions.
                </p>
              )}
            </div>
          </Fade>

          {known.length > 0 && (
            <Fade delay={0.3}>
              <div className="paper-card p-6">
                <p className="meta-label text-ink-faint">What we know</p>
                <dl className="mt-4 space-y-3.5">
                  {known.map((k) => (
                    <div key={k.label} className="flex items-baseline justify-between gap-6">
                      <dt className="text-[0.9375rem] text-ink-soft">{k.label}</dt>
                      <dd className="text-right text-[0.9375rem] font-medium tracking-[-0.01em]">
                        {k.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Fade>
          )}

          <Fade delay={0.36}>
            <div className="paper-card p-6">
              <p className="meta-label text-ink-faint">Unknown dimensions</p>
              {unknowns.length ? (
                <ul className="mt-4 space-y-2.5">
                  {unknowns.map((u) => (
                    <li key={u} className="flex items-start gap-3 text-[0.9375rem] text-ink-soft">
                      <span
                        className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: "var(--ink-faint)" }}
                      />
                      {u}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[0.9375rem] text-ink-soft">
                  Nothing missing — we'll still verify everything through practice.
                </p>
              )}
            </div>
          </Fade>

          <Fade delay={0.42}>
            <div
              className="paper-card flex items-center gap-3 px-6 py-5"
              style={{ background: "color-mix(in oklab, var(--coral) 8%, var(--paper-raised))" }}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                  style={{ background: "var(--coral)" }}
                />
                <span
                  className="relative inline-flex h-2.5 w-2.5 rounded-full"
                  style={{ background: "var(--coral)" }}
                />
              </span>
              <div>
                <p className="text-[1rem] font-semibold tracking-[-0.01em]">Status: Calibrating</p>
                <p className="mt-0.5 text-[0.875rem] text-ink-soft">
                  Day 1 of 90 · your plan adapts as REBOOT observes you
                </p>
              </div>
            </div>
          </Fade>
        </div>

        <Fade delay={0.5}>
          <div className="mt-8 space-y-3">
            <button
              onClick={onStart}
              className="w-full rounded-full bg-ink px-6 py-4 text-[1rem] font-semibold tracking-tight text-paper transition-transform duration-200 active:scale-[0.985]"
            >
              Start day one
            </button>
            <button
              onClick={onRestart}
              className="w-full py-2 text-[0.875rem] text-ink-faint transition-colors hover:text-ink"
            >
              Retake the diagnosis
            </button>
          </div>
          <p className="mt-6 pb-4 text-center text-[0.75rem] leading-relaxed text-ink-faint">
            REBOOT artwork is metaphorical. Nothing here measures your brain, dopamine or any
            biological state.
          </p>
        </Fade>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="paper-card h-full p-5">
      <p className="meta-label" style={{ color: accent }}>
        {label}
      </p>
      <p className="mt-2 text-[1.0625rem] font-medium leading-snug tracking-[-0.01em]">{value}</p>
    </div>
  );
}

function Fade({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

const SHORT: Record<string, string> = {
  breaker: "Main breaker",
  social_app: "Strongest pull",
  phone_place: "Phone placement",
  focus_window: "Focus window",
  work_break: "Breaking point",
  reading: "Reading pattern",
  recall_target: "Recall target",
  environment: "Environment",
  energy: "Best hours",
  absorption: "Absorption",
  flow_exit: "Flow exit",
  session_target: "Session target",
};

const UNKNOWN_COPY: Record<string, string> = {
  breaker: "Which interruption actually costs you the most",
  social_app: "Which app pulls hardest, in real numbers",
  phone_place: "How phone placement changes your sessions",
  focus_window: "Your true focus window, measured",
  work_break: "Where the work breaks down",
  reading: "How you read under load",
  recall_target: "What you most need to retain",
  environment: "Which environment performs best",
  energy: "Your real energy curve across the day",
  absorption: "The conditions that absorb you",
  flow_exit: "What ends your Flow",
  session_target: "The session length that fits you",
  goals: "Your goals",
  primary: "Your primary goal",
};

export const ALL_QUESTION_IDS = QUESTIONS.map((q) => q.id);
