import page1 from "@/assets/page1.png.asset.json";
import page2 from "@/assets/page2.png.asset.json";
import page3 from "@/assets/page3.png.asset.json";
import page4 from "@/assets/page4.png.asset.json";
import page5 from "@/assets/page5.png.asset.json";
import page6 from "@/assets/page6.png.asset.json";

export type CineScreen = {
  id: number;
  image: string;
  meta: string;
  title: string;
  body: string;
  secondary?: string;
  stages?: string[];
  cta: string;
  ghost?: string;
  /** vertical anchor of the artwork so empty space lands under the type */
  focus: string;
};

export const CINE_SCREENS: CineScreen[] = [
  {
    id: 1,
    image: page1.url,
    meta: "REBOOT / 01",
    title: "Your attention is being pulled apart.",
    body: "Every notification, feed and interruption asks for the same thing: switch.",
    secondary: "And what you repeat becomes easier to repeat.",
    cta: "See what's happening",
    focus: "50% 22%",
  },
  {
    id: 2,
    image: page2.url,
    meta: "REBOOT / 02",
    title: "You're training yourself to switch.",
    body: "Open. Scroll. Check. Change. Repeat.",
    secondary:
      "The problem isn't that you've lost attention. Your environment keeps rewarding the opposite behaviour.",
    cta: "Cut the noise",
    focus: "50% 20%",
  },
  {
    id: 3,
    image: page3.url,
    meta: "REBOOT / 03",
    title: "Attention is a skill.",
    body: "Staying with one thing, returning after distraction and rebuilding what you learned can all be trained.",
    secondary: "REBOOT starts by measuring how you work today.",
    cta: "Build my baseline",
    focus: "50% 18%",
  },
  {
    id: 4,
    image: page4.url,
    meta: "REBOOT / 04",
    title: "Less input. More depth.",
    body: "We'll change the conditions around you, train sustained attention, improve recall and help you design real deep-work sessions.",
    secondary: "No miracle. No dopamine detox. Just deliberate practice and better conditions.",
    cta: "Show me the protocol",
    focus: "50% 16%",
  },
  {
    id: 5,
    image: page5.url,
    meta: "REBOOT / 05",
    title: "90 days. Built around you.",
    body: "REBOOT learns from your sessions, experiments, environment, energy and Flow conditions — then adapts what comes next.",
    stages: ["Observe", "Adapt", "Own it"],
    secondary: "No streak to protect. Miss a day and the program simply waits.",
    cta: "One last thing",
    focus: "50% 14%",
  },
  {
    id: 6,
    image: page6.url,
    meta: "DAY 001 / 090",
    title: "Rebuild your attention.",
    body: "The first week is calibration. We start with what you tell us, then REBOOT learns from what actually happens.",
    cta: "Begin REBOOT",
    ghost: "Not now",
    focus: "50% 18%",
  },
];
