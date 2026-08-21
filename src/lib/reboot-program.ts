import type { Answers } from "./reboot-diagnosis";
import {
  adaptationNote,
  buildProfile,
  durationFor,
  selectMode,
  type AttentionProfile,
  type SessionMode,
  type SessionResult,
} from "./reboot-profile";

/**
 * Pure prescription engine — no React, no DOM.
 * Turns diagnosis + session evidence into today's single instruction.
 * Portable as-is to React Native / Expo.
 */

export type { SessionMode, SessionResult };

export type RealWorldAction = {
  title: string;
  body: string;
  fallbackTitle: string;
  fallbackBody: string;
};

export type Prescription = {
  day: number;
  totalDays: number;
  mode: SessionMode;
  headline: string;
  target: string;
  reason: string;
  trainingLabel: string;
  minutes: number;
  cta: string;
  why: string;
  /** what the last session changed, if anything */
  adaptation: string | null;
  action: RealWorldAction;
  signal: { label: string; value: string; note: string };
  /** in-session instruction shown while the block runs */
  instruction: string;
};

export function prescriptionFor(
  answers: Answers,
  day: number,
  sessions: SessionResult[] = [],
): Prescription {
  const p = buildProfile(answers, sessions);
  const { mode, reasons } = selectMode(p, day, sessions);
  const minutes = durationFor(p, mode, day);
  const baseline = day === 1;

  const body = baseline ? baselineCopy(p, minutes) : modeCopy(mode, p, minutes);

  return {
    day,
    totalDays: 90,
    mode,
    minutes,
    ...body,
    why: `${body.why} ${reasons.join(" ")}`.trim(),
    adaptation: adaptationNote(p, sessions),
    signal: signalFor(p, day),
  };
}

type Body = Omit<
  Prescription,
  "day" | "totalDays" | "mode" | "minutes" | "adaptation" | "signal"
>;

function baselineCopy(p: AttentionProfile, minutes: number): Body {
  return {
    headline: p.phoneish
      ? "Watch the reflex."
      : p.recallish
        ? "Read it once."
        : p.readish
          ? "Sit with the page."
          : "Work as usual.",
    target: `One ${minutes}-minute block of your normal work`,
    reason: p.phoneish
      ? `Before anything changes, REBOOT needs to see the reflex as it really is${p.app ? ` — including every pull toward ${p.app}` : ""}.`
      : p.recallish
        ? "We need an untouched sample of how much survives a single pass before any recall work begins."
        : "Today measures where you actually are, not where you'd like to be.",
    trainingLabel: "STAY · baseline",
    cta: "Start baseline block",
    why: `You told us your primary goal is ${p.primaryLabel.toLowerCase()}${p.breaker ? `, and that ${p.breaker.toLowerCase()} breaks you most often` : ""}. Day one changes nothing: same desk, same phone, same habits.`,
    instruction: "Work normally. Don't fix your environment. Just notice what happens.",
    action: {
      title: "Change nothing today",
      body: `Leave your phone exactly where it usually is${p.place === "in_hand" ? " — in your hand, if that's the truth" : ""}. No new rules, no blockers.`,
      fallbackTitle: "Then just note one thing",
      fallbackBody:
        "Write down a single sentence after the block: what pulled you away first.",
    },
  };
}

function modeCopy(mode: SessionMode, p: AttentionProfile, minutes: number): Body {
  switch (mode) {
    case "recall":
      return {
        headline: "Say it back.",
        target: `${minutes} minutes of reading, then rebuild it from memory`,
        reason: `Rereading feels like learning. Retrieval is learning${p.recallTarget ? ` — starting with your ${p.recallTarget}` : ""}.`,
        trainingLabel: "RECALL · retrieval block",
        cta: "Start recall block",
        why: `You came here to hold on to ${p.recallTarget || "what you read"}. This block ends with the source closed and everything you remember written down.`,
        instruction: "Read one source. When the timer ends, close it — nothing open while you write.",
        action: {
          title: "Keep one blank page next to you",
          body: "Paper, not a screen. It becomes today's recall sheet.",
          fallbackTitle: "Use the notes app, empty",
          fallbackBody: "A blank note works. Just don't reopen the source while writing.",
        },
      };
    case "explain":
      return {
        headline: "Teach it back.",
        target: `${minutes} minutes learning one idea, then explain it simply`,
        reason: "If you can't say it plainly, you haven't understood it yet.",
        trainingLabel: "EXPLAIN · understanding block",
        cta: "Start explain block",
        why: `Your work breaks down at ${p.workBreak || "the edges"}, and explaining is the fastest way to find the gap.`,
        instruction: "Learn one thing well. At the end, explain it out loud as if to a beginner.",
        action: {
          title: "Pick the person you're explaining to",
          body: "A friend, a student, a younger you. Naming them sharpens the language.",
          fallbackTitle: "Explain it to the page",
          fallbackBody: "Write the explanation instead of saying it. Same job.",
        },
      };
    case "nothing":
      return {
        headline: "Do nothing.",
        target: `${minutes} minutes with no input at all`,
        reason: "Boredom tolerance is the muscle underneath attention. Today we train it directly.",
        trainingLabel: "NOTHING · tolerance block",
        cta: "Start nothing block",
        why: "The last blocks landed hard, so REBOOT is not adding load today. Sit with no new stimulus and let the urge pass without acting on it.",
        instruction: "No phone, no music, no reading. Sit. Let the urges arrive and leave.",
        action: {
          title: "Leave the phone in another room",
          body: "For this block it isn't a rule — it's the whole exercise.",
          fallbackTitle: "Face down, out of the sightline",
          fallbackBody: "If another room isn't possible, any distance still counts.",
        },
      };
    case "observe":
      return {
        headline: "Catch it live.",
        target: "One real-world observation mission, off-screen",
        reason: `The reflex to check${p.app ? ` ${p.app}` : ""} is faster than the decision to check. Today you only watch it happen.`,
        trainingLabel: "OBSERVE · field mission",
        cta: "Start observation",
        why: `${p.dominantDistraction === "phone" ? "Your phone was the first thing to break your last block. " : ""}Before REBOOT changes the reflex, you need to see its trigger with your own eyes.`,
        instruction:
          "Go about your day. The first time you reach for your phone without deciding to, stop and write down what happened just before.",
        action: {
          title: "One sentence, at the moment it happens",
          body: "Not later from memory. The trigger is only visible in the second it fires.",
          fallbackTitle: "Log it at the end of the day",
          fallbackBody: "One honest reconstruction is better than nothing at all.",
        },
      };
    case "stay":
    default:
      return {
        headline: p.phoneish ? "Cut the noise." : p.deepish ? "Draw the finish line." : "Stay with it.",
        target: p.phoneish
          ? `One ${minutes}-minute block with the phone out of reach`
          : `One unbroken ${minutes}-minute block on a single task`,
        reason: p.phoneish
          ? "Distance beats willpower. Same work, one variable changed."
          : p.workBreak === "finishing"
            ? "You don't lose the work in the middle — you lose it at the end. So define the end first."
            : "One task, start to finish. Every switch gets counted.",
        trainingLabel: "STAY · sustained block",
        cta: "Start stay block",
        why: p.phoneish
          ? `${p.breaker ? `${p.breaker} is what breaks you.` : ""} Today tests one variable only: distance.`
          : `Before starting, write one sentence describing what "done" looks like for this block.`,
        instruction: "One task only. If you switch, come back and log it at the end.",
        action: p.phoneish
          ? {
              title: "Put the phone in another room",
              body: "Before you start, not after the first urge.",
              fallbackTitle: "Face down, screen off, out of the sightline",
              fallbackBody: "If another room isn't possible, distance of any kind still counts.",
            }
          : {
              title: "Write your finish line first",
              body: 'One sentence: "This block is done when ___."',
              fallbackTitle: "Name the next single step",
              fallbackBody: "If you can't see the end, name only the next step and stop there.",
            },
      };
  }
}

function signalFor(p: AttentionProfile, day: number): Prescription["signal"] {
  if (p.measuredMinutes !== null) {
    return {
      label: "Measured so far",
      value: `${p.measuredMinutes} min held`,
      note: `Across ${p.evidenceCount} logged ${p.evidenceCount === 1 ? "block" : "blocks"}. Nothing is scored — this is only what you actually did.`,
    };
  }
  if (day === 1) {
    return {
      label: "Best hours",
      value: p.energyWindow || "Unmeasured",
      note: p.energyWindow
        ? `Run today's block in your ${p.energyWindow.toLowerCase()} window if you can.`
        : "REBOOT will find your real energy curve over the first week.",
    };
  }
  return {
    label: "Calibration week",
    value: `Day ${day} of 7`,
    note: "REBOOT is still building your real profile. Nothing is scored yet.",
  };
}

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

export const RESPONSE_QUALITY = [
  { value: "blank", label: "Almost nothing came back" },
  { value: "fragments", label: "Fragments and headlines" },
  { value: "most", label: "Most of it, in my own words" },
  { value: "clean", label: "All of it, clearly" },
];
