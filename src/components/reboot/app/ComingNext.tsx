import { motion } from "motion/react";

const EASE = [0.22, 0.9, 0.24, 1] as const;

const CONTENT: Record<string, { label: string; title: string; body: string; items: string[] }> = {
  train: {
    label: "Train",
    title: "The training room opens next.",
    body: "Attention blocks, recall drills and reading sets will live here — built from what your calibration week actually shows.",
    items: ["Attention blocks", "Recall drills", "Reading sets", "Flow Lab"],
  },
  program: {
    label: "Program",
    title: "Ninety days, drawn out.",
    body: "Once calibration ends, the full arc appears here: phases, weekly focus and what changes when.",
    items: ["Calibration week", "Phase map", "Weekly focus", "Day 90"],
  },
  profile: {
    label: "Profile",
    title: "Your profile, as REBOOT sees it.",
    body: "Your diagnosis, your measured focus window and everything still unknown will be editable here.",
    items: ["Diagnosis answers", "Measured window", "Unknowns", "Preferences"],
  },
};

export function ComingNext({ tab }: { tab: "train" | "program" | "profile" }) {
  const c = CONTENT[tab]!;
  return (
    <motion.div
      className="mx-auto w-full max-w-[30rem] px-6 pb-36"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: EASE }}
    >
      <p className="meta-label text-ink-faint">{c.label}</p>
      <h1 className="mt-4 font-serif text-[2.6rem] leading-[1.02] tracking-[-0.02em]">{c.title}</h1>
      <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-soft">{c.body}</p>

      <div className="paper-card mt-7 p-6">
        <p className="meta-label text-coral">Coming next</p>
        <ul className="mt-4 space-y-3.5">
          {c.items.map((i) => (
            <li key={i} className="flex items-center gap-3 text-[1rem] tracking-[-0.01em]">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: "var(--ink-faint)" }}
              />
              {i}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 text-[0.8125rem] leading-relaxed text-ink-faint">
        Nothing here is locked behind anything. It simply isn't built yet — and REBOOT would rather
        show you one honest screen than four half-finished ones.
      </p>
    </motion.div>
  );
}
