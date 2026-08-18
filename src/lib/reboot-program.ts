import type { Answers } from "./reboot-diagnosis";
import { answerLabels, isUnknown } from "./reboot-diagnosis";

/**
 * Pure prescription engine — no React, no DOM.
 * Portable as-is to React Native / Expo.
 */

export type TrainingKind = "baseline" | "attention" | "recall" | "reading" | "finish";

export type RealWorldAction = {
  title: string;
  body: string;
  fallbackTitle: string;
  fallbackBody: string;
};

export type Prescription = {
  day: number;
  totalDays: number;
  headline: string;
  target: string;
  reason: string;
  trainingLabel: string;
  kind: TrainingKind;
  minutes: number;
  cta: string;
  why: string;
  action: RealWorldAction;
  signal: { label: string; value: string; note: string };
};

const first = (a: Answers, id: string) => a[id]?.[0] ?? "";

const WINDOW_MINUTES: Record<string, number> = {
  lt5: 10,
  "5_15": 15,
  "15_30": 20,
  "30_60": 30,
  gt60: 40,
};

export function baselineMinutes(answers: Answers) {
  if (isUnknown("focus_window", answers)) return 20;
  return WINDOW_MINUTES[first(answers, "focus_window")] ?? 20;
}

function profile(answers: Answers) {
  const primary = first(answers, "primary");
  const goals = answers["goals"] ?? [];
  const phoneish =
    primary === "scroll_less" ||
    primary === "phone_less" ||
    goals.includes("scroll_less") ||
    goals.includes("phone_less");
  const recallish =
    primary === "remember_more" ||
    primary === "study_better" ||
    goals.includes("remember_more");
  const readish = primary === "read_more" || goals.includes("read_more");
  const deepish = primary === "deep_work" || primary === "focus_better" || primary === "build_flow";
  return { primary, phoneish, recallish, readish, deepish };
}

/** Day 1–7 is calibration; day 1 is a pure, unmodified baseline. */
export function prescriptionFor(answers: Answers, day: number): Prescription {
  const p = profile(answers);
  const minutes = baselineMinutes(answers);
  const breaker = isUnknown("breaker", answers) ? "" : (answerLabels("breaker", answers)[0] ?? "");
  const app = isUnknown("social_app", answers) ? "" : (answerLabels("social_app", answers)[0] ?? "");
  const place = isUnknown("phone_place", answers) ? "" : first(answers, "phone_place");
  const workBreak = isUnknown("work_break", answers) ? "" : first(answers, "work_break");
  const recallTarget = isUnknown("recall_target", answers)
    ? ""
    : (answerLabels("recall_target", answers)[0]?.toLowerCase() ?? "");
  const energy = isUnknown("energy", answers) ? "" : (answerLabels("energy", answers)[0] ?? "");

  // ---- Day 1: honest baseline, nothing changed yet -------------------
  if (day === 1) {
    const headline = p.phoneish
      ? "Watch the reflex."
      : p.recallish
        ? "Read it once."
        : p.readish
          ? "Sit with the page."
          : "Work as usual.";

    const reason = p.phoneish
      ? `Before anything changes, REBOOT needs to see the reflex as it really is${app ? ` — including every pull toward ${app}` : ""}.`
      : p.recallish
        ? "We need an untouched sample of how much survives a single pass before any recall work begins."
        : p.deepish
          ? `Today is a measurement, not a test${workBreak === "starting" ? " — including how long it takes you to start" : ""}.`
          : "Today measures where you actually are, not where you'd like to be.";

    return {
      day,
      totalDays: 90,
      headline,
      target: `One ${minutes}-minute block of your normal work`,
      reason,
      trainingLabel: "Baseline block · calibration",
      kind: "baseline",
      minutes,
      cta: "Start baseline block",
      why: `You told us your primary goal is ${answerLabels("primary", answers)[0]?.toLowerCase() ?? "focus"}${breaker ? `, and that ${breaker.toLowerCase()} breaks you most often` : ""}. Day one changes nothing: same desk, same phone, same habits. REBOOT can only prescribe honestly once it has seen one untouched block, so today the only job is to work normally for ${minutes} minutes and tell us what happened.`,
      action: {
        title: "Change nothing today",
        body: `Leave your phone exactly where it usually is${place === "in_hand" ? " — in your hand, if that's the truth" : ""}. No new rules, no blockers. Just notice.`,
        fallbackTitle: "Then just note one thing",
        fallbackBody:
          "If even that feels like too much, write down a single sentence after the block: what pulled you away first.",
      },
      signal: {
        label: "Best hours",
        value: energy || "Unmeasured",
        note: energy
          ? `Run today's block in your ${energy.toLowerCase()} window if you can.`
          : "REBOOT will find your real energy curve over the first week.",
      },
    };
  }

  // ---- Days 2–7: still calibration, small honest variations ----------
  const kind: TrainingKind = p.recallish
    ? "recall"
    : p.readish
      ? "reading"
      : p.phoneish
        ? "attention"
        : "finish";

  const map: Record<TrainingKind, Omit<Prescription, "day" | "totalDays" | "minutes" | "signal">> = {
    baseline: {
      headline: "Work as usual.",
      target: `One ${minutes}-minute block of your normal work`,
      reason: "Another clean sample.",
      trainingLabel: "Baseline block · calibration",
      kind: "baseline",
      cta: "Start block",
      why: "REBOOT is still collecting untouched blocks.",
      action: {
        title: "Change nothing today",
        body: "Same desk, same phone, same habits.",
        fallbackTitle: "Then just note one thing",
        fallbackBody: "Write one sentence about what pulled you away first.",
      },
    },
    attention: {
      headline: "Cut the noise.",
      target: `One ${minutes}-minute block with the phone out of reach`,
      reason: `The reflex to check${app ? ` ${app}` : ""} is faster than the decision to check. Distance beats willpower.`,
      trainingLabel: "Attention block · calibration",
      kind: "attention",
      cta: "Start attention block",
      why: `Your primary goal is about the phone, and ${breaker ? breaker.toLowerCase() : "the reflex"} is what breaks you. Today we test one variable only: distance. Same work, same length — the phone just isn't within arm's reach.`,
      action: {
        title: "Put the phone in another room",
        body: "Before you start, not after the first urge.",
        fallbackTitle: "Face down, screen off, out of the sightline",
        fallbackBody: "If another room isn't possible, distance of any kind still counts today.",
      },
    },
    recall: {
      headline: "Say it back.",
      target: `One ${minutes}-minute block, then recall it from memory`,
      reason: `Rereading feels like learning. Retrieval is learning${recallTarget ? ` — starting with your ${recallTarget}` : ""}.`,
      trainingLabel: "Recall block · calibration",
      kind: "recall",
      cta: "Start recall block",
      why: `You came here to hold on to ${recallTarget || "what you read"}. Today's block ends with the book closed and two minutes of writing down everything you can remember. It will feel worse than rereading — that's the point.`,
      action: {
        title: "Keep one blank page next to you",
        body: "Paper, not a screen. It becomes today's recall sheet.",
        fallbackTitle: "Use the notes app, empty",
        fallbackBody: "A blank note works. Just don't open the source material while writing.",
      },
    },
    reading: {
      headline: "Stay with it.",
      target: `${minutes} minutes of reading, one text only`,
      reason: "Rereading the same lines is a pacing problem, not an intelligence problem.",
      trainingLabel: "Reading block · calibration",
      kind: "reading",
      cta: "Start reading block",
      why: "Reading is where your attention shows itself most clearly. One text, no tabs, no switching — we measure how far you get before the drift begins.",
      action: {
        title: "Choose the text before you sit down",
        body: "Deciding what to read is a separate job from reading.",
        fallbackTitle: "Reread something you already own",
        fallbackBody: "Anything you've already started counts. Don't shop for a book today.",
      },
    },
    finish: {
      headline: "Draw the finish line.",
      target: `One ${minutes}-minute block on a task with a visible end`,
      reason:
        workBreak === "finishing"
          ? "You don't lose the work in the middle — you lose it at the end. So define the end first."
          : "Vague tasks leak attention. A finish line holds it.",
      trainingLabel: "Deep work block · calibration",
      kind: "finish",
      cta: "Start deep block",
      why: `Your work breaks down at ${workBreak || "the edges"}. Before starting, write one sentence describing what "done" looks like for this block. The sentence is the intervention — the block just proves it works.`,
      action: {
        title: "Write your finish line first",
        body: 'One sentence: "This block is done when ___."',
        fallbackTitle: "Name the next single step",
        fallbackBody: "If you can't see the end, name only the next step and stop there.",
      },
    },
  };

  const base = map[kind];

  return {
    ...base,
    day,
    totalDays: 90,
    minutes,
    signal: {
      label: "Calibration week",
      value: `Day ${day} of 7`,
      note: "REBOOT is still building your real profile. Nothing is scored yet.",
    },
  };
}

export type SessionFeedback = {
  day: number;
  completedAt: string;
  minutes: number;
  firstDistraction: string;
  switches: string;
  difficulty: string;
  energy: string;
};

export const FIRST_DISTRACTION = [
  { value: "phone", label: "My phone" },
  { value: "notification", label: "A notification" },
  { value: "thought", label: "My own thoughts" },
  { value: "person", label: "Someone around me" },
  { value: "tab", label: "Another tab or task" },
  { value: "none", label: "Nothing pulled me" },
];

export const SWITCH_COUNTS = [
  { value: "0", label: "None" },
  { value: "1_2", label: "1 – 2" },
  { value: "3_5", label: "3 – 5" },
  { value: "6_10", label: "6 – 10" },
  { value: "many", label: "Lost count" },
];

export const DIFFICULTY = [
  { value: "easy", label: "Easy" },
  { value: "ok", label: "Manageable" },
  { value: "hard", label: "Hard" },
  { value: "brutal", label: "Brutal" },
];

export const ENERGY_AFTER = [
  { value: "drained", label: "Drained" },
  { value: "flat", label: "Flat" },
  { value: "steady", label: "Steady" },
  { value: "sharp", label: "Sharp" },
];
