export type Answers = Record<string, string[]>;

export type Question = {
  id: string;
  kind: "single" | "multi";
  title: string;
  hint?: string;
  options?: { value: string; label: string; note?: string }[];
  /** dynamic options derived from previous answers */
  optionsFrom?: (a: Answers) => { value: string; label: string; note?: string }[];
  when?: (a: Answers) => boolean;
  /** appended automatically as an explicit unknown escape */
  unknownLabel?: string;
};

export const GOALS = [
  { value: "scroll_less", label: "Scroll less" },
  { value: "focus_better", label: "Focus better" },
  { value: "deep_work", label: "Deep work" },
  { value: "study_better", label: "Study better" },
  { value: "read_more", label: "Read more" },
  { value: "remember_more", label: "Remember more" },
  { value: "build_flow", label: "Build Flow" },
  { value: "phone_less", label: "Use my phone less" },
];

export const GOAL_LABEL: Record<string, string> = Object.fromEntries(
  GOALS.map((g) => [g.value, g.label]),
);

const has = (a: Answers, key: string, ...values: string[]) =>
  values.some((v) => (a[key] ?? []).includes(v));

const primary = (a: Answers) => a["primary"]?.[0] ?? "";

export const QUESTIONS: Question[] = [
  {
    id: "goals",
    kind: "multi",
    title: "Why are you here?",
    hint: "Choose everything that feels true. You can pick several.",
    options: GOALS,
  },
  {
    id: "primary",
    kind: "single",
    title: "If REBOOT could change only one, which matters most?",
    hint: "This becomes your primary goal. Everything else adapts around it.",
    optionsFrom: (a) => {
      const picked = a["goals"] ?? [];
      const list = picked.length ? picked : GOALS.map((g) => g.value);
      return list.map((v) => ({ value: v, label: GOAL_LABEL[v] ?? v }));
    },
  },
  {
    id: "breaker",
    kind: "single",
    title: "What breaks your attention most often?",
    hint: "The one that happens most, not the worst one.",
    options: [
      { value: "notifications", label: "Notifications" },
      { value: "social", label: "Social apps" },
      { value: "messages", label: "Messages & email" },
      { value: "restlessness", label: "Internal restlessness" },
      { value: "people", label: "People & noise around me" },
      { value: "tabs", label: "My own open tabs" },
    ],
    unknownLabel: "I don't know yet",
  },
  {
    id: "social_app",
    kind: "single",
    title: "Which app pulls you back the most?",
    when: (a) =>
      has(a, "goals", "scroll_less", "phone_less") || has(a, "breaker", "social", "notifications"),
    options: [
      { value: "tiktok", label: "TikTok" },
      { value: "instagram", label: "Instagram" },
      { value: "youtube", label: "YouTube" },
      { value: "x", label: "X / Twitter" },
      { value: "reddit", label: "Reddit" },
      { value: "messaging", label: "Messaging apps" },
    ],
    unknownLabel: "Not sure",
  },
  {
    id: "phone_place",
    kind: "single",
    title: "Where is your phone while you work?",
    when: (a) => has(a, "goals", "scroll_less", "phone_less"),
    options: [
      { value: "in_hand", label: "In my hand" },
      { value: "on_desk", label: "On the desk, face up" },
      { value: "face_down", label: "On the desk, face down" },
      { value: "pocket", label: "In a pocket or bag" },
      { value: "another_room", label: "In another room" },
    ],
    unknownLabel: "It varies",
  },
  {
    id: "focus_window",
    kind: "single",
    title: "How long do you stay with one thing before switching?",
    hint: "Your honest average, not your best day.",
    options: [
      { value: "lt5", label: "Under 5 minutes" },
      { value: "5_15", label: "5 – 15 minutes" },
      { value: "15_30", label: "15 – 30 minutes" },
      { value: "30_60", label: "30 – 60 minutes" },
      { value: "gt60", label: "More than an hour" },
    ],
    unknownLabel: "I've never measured it",
  },
  {
    id: "work_break",
    kind: "single",
    title: "Where does the work actually fall apart?",
    when: (a) => ["focus_better", "deep_work", "study_better", "build_flow"].includes(primary(a)),
    options: [
      { value: "starting", label: "Starting" },
      { value: "staying", label: "Staying in it" },
      { value: "returning", label: "Coming back after a break" },
      { value: "finishing", label: "Finishing" },
      { value: "choosing", label: "Choosing what to work on" },
    ],
    unknownLabel: "I don't know yet",
  },
  {
    id: "reading",
    kind: "single",
    title: "What happens when you read?",
    when: (a) => has(a, "goals", "read_more", "study_better", "remember_more"),
    options: [
      { value: "reread", label: "I reread the same lines" },
      { value: "drift", label: "I drift off after a page" },
      { value: "forget", label: "I finish but forget it" },
      { value: "never_start", label: "I rarely start" },
      { value: "screen_only", label: "I only read on a screen" },
    ],
    unknownLabel: "Not sure",
  },
  {
    id: "recall_target",
    kind: "single",
    title: "What do you most want to hold on to?",
    when: (a) => has(a, "goals", "remember_more", "study_better"),
    options: [
      { value: "course", label: "Course material" },
      { value: "books", label: "Books & long reads" },
      { value: "work", label: "Work knowledge" },
      { value: "language", label: "A language" },
      { value: "ideas", label: "My own ideas" },
    ],
    unknownLabel: "Not sure",
  },
  {
    id: "environment",
    kind: "single",
    title: "Where do you usually try to work?",
    options: [
      { value: "home_desk", label: "A desk at home" },
      { value: "shared_home", label: "A shared space at home" },
      { value: "office", label: "An open office" },
      { value: "cafe", label: "Cafés & public spaces" },
      { value: "library", label: "A library" },
      { value: "moving", label: "Wherever I happen to be" },
    ],
    unknownLabel: "It changes daily",
  },
  {
    id: "energy",
    kind: "single",
    title: "When is your attention naturally best?",
    options: [
      { value: "early", label: "Early morning" },
      { value: "morning", label: "Mid-morning" },
      { value: "afternoon", label: "Afternoon" },
      { value: "evening", label: "Evening" },
      { value: "night", label: "Late night" },
    ],
    unknownLabel: "I haven't noticed a pattern",
  },
  {
    id: "absorption",
    kind: "multi",
    title: "When do you lose track of time?",
    hint: "These are the conditions REBOOT will try to reproduce.",
    options: [
      { value: "coding", label: "Building or coding" },
      { value: "writing", label: "Writing" },
      { value: "music", label: "Playing music" },
      { value: "sport", label: "Sport & movement" },
      { value: "games", label: "Games" },
      { value: "drawing", label: "Drawing or making" },
      { value: "conversation", label: "A good conversation" },
      { value: "nature", label: "Outside, walking" },
    ],
    unknownLabel: "It doesn't happen much anymore",
  },
  {
    id: "flow_exit",
    kind: "single",
    title: "What usually pulls you out of Flow?",
    when: (a) => has(a, "goals", "build_flow") || primary(a) === "build_flow",
    options: [
      { value: "interrupt", label: "Someone interrupts me" },
      { value: "hard", label: "The task gets too hard" },
      { value: "easy", label: "The task gets boring" },
      { value: "check", label: "I check something 'quickly'" },
      { value: "tired", label: "Energy drops" },
    ],
    unknownLabel: "I don't know yet",
  },
  {
    id: "session_target",
    kind: "single",
    title: "What would a good deep-work session look like?",
    options: [
      { value: "25", label: "25 focused minutes" },
      { value: "45", label: "45 focused minutes" },
      { value: "90", label: "90 focused minutes" },
      { value: "two_blocks", label: "Two blocks in one day" },
    ],
    unknownLabel: "I'd rather REBOOT decide",
  },
];

export const UNKNOWN = "__unknown__";

export function visibleQuestions(answers: Answers): Question[] {
  return QUESTIONS.filter((q) => !q.when || q.when(answers));
}

export function optionsFor(q: Question, answers: Answers) {
  const base = q.optionsFrom ? q.optionsFrom(answers) : (q.options ?? []);
  return q.unknownLabel ? [...base, { value: UNKNOWN, label: q.unknownLabel }] : base;
}

export function labelOf(q: Question, value: string, answers: Answers) {
  return optionsFor(q, answers).find((o) => o.value === value)?.label ?? value;
}

export function answerLabels(id: string, answers: Answers): string[] {
  const q = QUESTIONS.find((x) => x.id === id);
  const vals = answers[id] ?? [];
  if (!q || vals.length === 0) return [];
  return vals.map((v) => labelOf(q, v, answers));
}

export function isUnknown(id: string, answers: Answers) {
  const v = answers[id];
  return !v || v.length === 0 || v.includes(UNKNOWN);
}
