import type { Answers } from "./reboot-diagnosis";
import { answerLabels, isUnknown } from "./reboot-diagnosis";

/**
 * Attention profile + adaptive selection rules.
 * Pure logic — no React, no DOM. Portable to React Native / Expo.
 * Nothing here invents a score: every value is either declared, measured, or unknown.
 */

export type SessionMode = "stay" | "recall" | "explain" | "nothing" | "observe";

export type SessionResult = {
  id: string;
  day: number;
  mode: SessionMode;
  completedAt: string;
  plannedMinutes: number;
  actualSeconds: number;
  /** reached the full prescribed duration */
  completed: boolean;
  firstDistraction?: string;
  switches?: string;
  difficulty?: string;
  energy?: string;
  /** RECALL / EXPLAIN only */
  responseQuality?: string;
  /** OBSERVE only */
  observation?: string;
};

export const MODE_LABEL: Record<SessionMode, string> = {
  stay: "STAY",
  recall: "RECALL",
  explain: "EXPLAIN",
  nothing: "NOTHING",
  observe: "OBSERVE",
};

export const MODE_PURPOSE: Record<SessionMode, string> = {
  stay: "Sustain one task and count the pull-aways.",
  recall: "Read, close the text, rebuild it from memory.",
  explain: "Learn something, then teach it back in plain words.",
  nothing: "Stay awake with no new input at all.",
  observe: "One real-world observation mission, off-screen.",
};

const first = (a: Answers, id: string) => a[id]?.[0] ?? "";

const WINDOW_MINUTES: Record<string, number> = {
  lt5: 10,
  "5_15": 15,
  "15_30": 20,
  "30_60": 30,
  gt60: 40,
};

const SWITCH_SCORE: Record<string, number> = { "0": 0, "1_2": 1.5, "3_5": 4, "6_10": 8, many: 12 };

export type AttentionProfile = {
  primary: string;
  primaryLabel: string;
  phoneish: boolean;
  recallish: boolean;
  readish: boolean;
  deepish: boolean;
  /** declared focus window, in minutes */
  declaredMinutes: number;
  /** minutes actually sustained, averaged over completed evidence — null until measured */
  measuredMinutes: number | null;
  evidenceCount: number;
  /** most common first distraction across evidence */
  dominantDistraction: string;
  /** average switches per block, null until measured */
  switchRate: number | null;
  /** trend of perceived difficulty across the last two blocks */
  load: "unknown" | "light" | "right" | "heavy";
  breaker: string;
  app: string;
  place: string;
  workBreak: string;
  recallTarget: string;
  energyWindow: string;
};

export function buildProfile(answers: Answers, sessions: SessionResult[]): AttentionProfile {
  const primary = first(answers, "primary");
  const goals = answers["goals"] ?? [];
  const inGoals = (...v: string[]) => v.some((x) => primary === x || goals.includes(x));

  const declaredMinutes = isUnknown("focus_window", answers)
    ? 20
    : (WINDOW_MINUTES[first(answers, "focus_window")] ?? 20);

  const timed = sessions.filter((s) => s.mode !== "observe");
  const measuredMinutes = timed.length
    ? Math.round(timed.reduce((n, s) => n + s.actualSeconds, 0) / timed.length / 60)
    : null;

  const counts = new Map<string, number>();
  for (const s of sessions) {
    if (s.firstDistraction && s.firstDistraction !== "none")
      counts.set(s.firstDistraction, (counts.get(s.firstDistraction) ?? 0) + 1);
  }
  const dominantDistraction =
    [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";

  const withSwitches = sessions.filter((s) => s.switches);
  const switchRate = withSwitches.length
    ? withSwitches.reduce((n, s) => n + (SWITCH_SCORE[s.switches!] ?? 0), 0) / withSwitches.length
    : null;

  const recent = sessions.slice(-2).map((s) => s.difficulty).filter(Boolean) as string[];
  const load: AttentionProfile["load"] = !recent.length
    ? "unknown"
    : recent.every((d) => d === "easy")
      ? "light"
      : recent.some((d) => d === "brutal") || recent.filter((d) => d === "hard").length >= 2
        ? "heavy"
        : "right";

  return {
    primary,
    primaryLabel: answerLabels("primary", answers)[0] ?? "focus",
    phoneish: inGoals("scroll_less", "phone_less"),
    recallish: inGoals("remember_more", "study_better"),
    readish: inGoals("read_more"),
    deepish: inGoals("deep_work", "focus_better", "build_flow"),
    declaredMinutes,
    measuredMinutes,
    evidenceCount: sessions.length,
    dominantDistraction,
    switchRate,
    load,
    breaker: isUnknown("breaker", answers) ? "" : (answerLabels("breaker", answers)[0] ?? ""),
    app: isUnknown("social_app", answers) ? "" : (answerLabels("social_app", answers)[0] ?? ""),
    place: isUnknown("phone_place", answers) ? "" : first(answers, "phone_place"),
    workBreak: isUnknown("work_break", answers) ? "" : first(answers, "work_break"),
    recallTarget: isUnknown("recall_target", answers)
      ? ""
      : (answerLabels("recall_target", answers)[0]?.toLowerCase() ?? ""),
    energyWindow: isUnknown("energy", answers) ? "" : (answerLabels("energy", answers)[0] ?? ""),
  };
}

/** Deterministic, explainable duration rule. */
export function durationFor(p: AttentionProfile, mode: SessionMode, day: number) {
  if (mode === "observe") return 0;
  let base = p.measuredMinutes ?? p.declaredMinutes;
  if (day === 1) base = p.declaredMinutes;
  if (mode === "nothing") return Math.max(5, Math.min(12, Math.round(base * 0.4)));
  if (day > 1) {
    if (p.load === "light") base = Math.round(base * 1.25);
    if (p.load === "heavy") base = Math.round(base * 0.75);
  }
  return Math.max(5, Math.min(45, base));
}

/**
 * Mode selection: score every mode from diagnosis + evidence, highest wins.
 * Ties break by the fixed order below, so the same inputs always give the same output.
 */
const ORDER: SessionMode[] = ["stay", "recall", "explain", "observe", "nothing"];

export function selectMode(
  p: AttentionProfile,
  day: number,
  sessions: SessionResult[],
): { mode: SessionMode; reasons: string[] } {
  if (day === 1) return { mode: "stay", reasons: ["Day one is an untouched baseline block."] };

  const score: Record<SessionMode, number> = { stay: 1, recall: 0, explain: 0, nothing: 0, observe: 0 };
  const reasons: string[] = [];

  if (p.phoneish) {
    score.stay += 2;
    score.observe += 2;
    reasons.push(`Your goal is ${p.primaryLabel.toLowerCase()}, so REBOOT keeps working on the reflex.`);
  }
  if (p.recallish) {
    score.recall += 3;
    score.explain += 2;
    reasons.push("You came here to hold on to what you read, so retrieval leads your week.");
  }
  if (p.readish) {
    score.stay += 2;
    score.recall += 1;
  }
  if (p.deepish) {
    score.stay += 2;
    score.explain += 1;
    if (p.workBreak === "vague" || p.workBreak === "starting") score.explain += 1;
  }

  if (p.dominantDistraction === "phone" || p.dominantDistraction === "notification") {
    score.observe += 2;
    reasons.push("Your phone was the first thing to pull you away, so today includes a real-world move.");
  }
  if (p.switchRate !== null && p.switchRate >= 4) {
    score.stay += 2;
    reasons.push("Your last blocks broke into pieces, so REBOOT is rebuilding one unbroken stretch.");
  }
  if (p.load === "heavy") {
    score.nothing += 4;
    reasons.push("The last blocks landed hard, so today is deliberately lighter.");
  }
  if (p.load === "light") {
    score.recall += 1;
    score.explain += 1;
    reasons.push("The last block felt easy, so REBOOT raised the demand.");
  }

  // don't repeat the same mode three days running
  const last2 = sessions.slice(-2).map((s) => s.mode);
  if (last2.length === 2 && last2[0] === last2[1]) score[last2[0]!] -= 3;

  let best = ORDER[0]!;
  for (const m of ORDER) if (score[m] > score[best]) best = m;
  if (!reasons.length) reasons.push("REBOOT is still collecting evidence, so today stays simple.");
  return { mode: best, reasons };
}

/** One short line describing what the last session changed, or null when nothing changed. */
export function adaptationNote(p: AttentionProfile, sessions: SessionResult[]): string | null {
  const last = sessions[sessions.length - 1];
  if (!last) return null;
  if (p.load === "heavy") return "Yesterday was hard, so today's block is shorter.";
  if (p.load === "light") return "Yesterday felt easy, so today asks for more.";
  if (last.firstDistraction === "phone")
    return "Your phone broke the last block, so today addresses it directly.";
  if (last.completed) return "You finished the last block, so REBOOT held the length.";
  return "You stopped the last block early, so today stays within reach.";
}
