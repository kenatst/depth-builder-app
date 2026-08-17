import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CINE_SCREENS } from "@/lib/reboot-content";

type Props = {
  index: number;
  onAdvance: () => void;
  onBack: () => void;
  onSkip: () => void;
  onBegin: () => void;
};

const EASE = [0.22, 0.9, 0.24, 1] as const;

export function CinematicOnboarding({ index, onAdvance, onBack, onSkip, onBegin }: Props) {
  const reduce = useReducedMotion();
  const screen = CINE_SCREENS[Math.min(index, CINE_SCREENS.length - 1)]!;
  const last = index === CINE_SCREENS.length - 1;
  const dur = reduce ? 0.2 : 0.78;

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-void">
      {/* artwork layer */}
      <div className="pointer-events-none absolute inset-0">
        <AnimatePresence mode="sync">
          <motion.div
            key={screen.id}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: reduce ? 1 : 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reduce ? 1 : 1.01 }}
            transition={{ duration: dur, ease: EASE }}
          >
            <img
              src={screen.image}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
              style={{ objectPosition: screen.focus }}
              draggable={false}
            />
            <div
              className="absolute inset-0 breathe"
              style={{
                background:
                  "radial-gradient(60% 38% at 50% 26%, color-mix(in oklab, var(--signal) 22%, transparent), transparent 70%)",
                mixBlendMode: "screen",
              }}
            />
          </motion.div>
        </AnimatePresence>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, oklch(0 0 0 / 0.25) 0%, oklch(0 0 0 / 0) 26%, oklch(0 0 0 / 0.55) 52%, oklch(0 0 0 / 0.94) 74%, oklch(0 0 0) 100%)",
          }}
        />
      </div>

      {/* top chrome */}
      <header className="safe-top relative z-10 flex items-center justify-between px-6">
        <span className="meta-label text-cine-muted/70">{screen.meta}</span>
        {!last && (
          <button
            onClick={onSkip}
            className="meta-label text-cine-muted/60 transition-colors hover:text-cine-fg"
          >
            Skip
          </button>
        )}
      </header>

      <div className="flex-1" />

      {/* typography + controls */}
      <div className="safe-bottom relative z-10 px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.22 } }}
            transition={{ delay: reduce ? 0 : 0.16, duration: 0.5, ease: EASE }}
            className="mx-auto w-full max-w-[30rem]"
          >
            <Reveal delay={0.16} reduce={reduce}>
              <h1 className="cine-title text-[2.05rem] text-cine-fg sm:text-[2.4rem]">
                {screen.title}
              </h1>
            </Reveal>
            <Reveal delay={0.26} reduce={reduce}>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-cine-fg/80">{screen.body}</p>
            </Reveal>
            {screen.stages && (
              <Reveal delay={0.34} reduce={reduce}>
                <div className="mt-5 flex items-center gap-3">
                  {screen.stages.map((s, i) => (
                    <div key={s} className="flex items-center gap-3">
                      {i > 0 && <span className="text-signal/70">→</span>}
                      <span className="rounded-full bg-cine-fg/10 px-3.5 py-1.5 text-[0.8125rem] font-medium text-cine-fg/85">
                        {s}
                      </span>
                    </div>
                  ))}
                </div>
              </Reveal>
            )}
            {screen.secondary && (
              <Reveal delay={0.4} reduce={reduce}>
                <p className="mt-4 text-[0.9375rem] leading-relaxed text-cine-muted/75">
                  {screen.secondary}
                </p>
              </Reveal>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mx-auto mt-8 w-full max-w-[30rem]">
          <button
            onClick={last ? onBegin : onAdvance}
            className="w-full rounded-full bg-cine-fg px-6 py-4 text-[1rem] font-semibold tracking-tight text-void transition-transform duration-200 active:scale-[0.985]"
          >
            {screen.cta}
          </button>
          <div className="mt-4 flex h-6 items-center justify-between">
            <button
              onClick={onBack}
              disabled={index === 0}
              className="text-[0.8125rem] text-cine-muted/60 transition-opacity disabled:opacity-0"
            >
              Back
            </button>
            <div className="flex items-center gap-1.5">
              {CINE_SCREENS.map((s, i) => (
                <span
                  key={s.id}
                  className="h-[3px] rounded-full transition-all duration-500"
                  style={{
                    width: i === index ? 22 : 8,
                    background:
                      i === index ? "var(--signal)" : "color-mix(in oklab, var(--cine-fg) 22%, transparent)",
                  }}
                />
              ))}
            </div>
            {screen.ghost ? (
              <button
                onClick={onSkip}
                className="text-[0.8125rem] text-cine-muted/60 transition-colors hover:text-cine-fg"
              >
                {screen.ghost}
              </button>
            ) : (
              <span className="w-8" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Reveal({
  children,
  delay,
  reduce,
}: {
  children: React.ReactNode;
  delay: number;
  reduce: boolean | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduce ? 0 : delay, duration: 0.58, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
