import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = process.env.CAPTURE_BASE || "http://localhost:8080/";
const OUT = process.env.CAPTURE_OUT || "/Users/kena/Documents/ChatGPT/vfin/qa/web";
const WIDTH = Number(process.env.WIDTH || 402);
const HEIGHT = Number(process.env.HEIGHT || 874);
const RUN = process.env.RUN || "full"; // "full" | "jump"
const JUMP = process.env.JUMP || "";

const PHONES = {
  375: 812,
  393: 852,
  402: 874,
  430: 932,
};

const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const CINE_CTAS = [
  "See what's happening",
  "Cut the noise",
  "Build my baseline",
  "Show me the protocol",
  "One last thing",
  "Begin REBOOT",
];

const QUESTION_FLOW = [
  {
    id: "d1-goals",
    kind: "multi",
    title: "Why are you here?",
    picks: ["Scroll less", "Focus better", "Study better", "Remember more", "Build Flow"],
  },
  {
    id: "d2-primary",
    kind: "single",
    title: "If REBOOT could change only one, which matters most?",
    pick: "Focus better",
  },
  { id: "d3-breaker", kind: "single", title: "What breaks your attention most often?", pick: "Notifications" },
  { id: "d4-social_app", kind: "single", title: "Which app pulls you back the most?", pick: "Instagram" },
  { id: "d5-phone_place", kind: "single", title: "Where is your phone while you work?", pick: "On the desk, face up" },
  { id: "d6-focus_window", kind: "single", title: "How long do you stay with one thing before switching?", pick: "15 – 30 minutes" },
  { id: "d7-work_break", kind: "single", title: "Where does the work actually fall apart?", pick: "Starting" },
  { id: "d8-reading", kind: "single", title: "What happens when you read?", pick: "I drift off after a page" },
  { id: "d9-recall_target", kind: "single", title: "What do you most want to hold on to?", pick: "Course material" },
  { id: "d10-environment", kind: "single", title: "Where do you usually try to work?", pick: "A desk at home" },
  { id: "d11-energy", kind: "single", title: "When is your attention naturally best?", pick: "Early morning" },
  {
    id: "d12-absorption",
    kind: "multi",
    title: "When do you lose track of time?",
    picks: ["Building or coding", "Writing"],
  },
  { id: "d13-flow_exit", kind: "single", title: "What usually pulls you out of Flow?", pick: "I check something 'quickly'" },
  { id: "d14-session_target", kind: "single", title: "What would a good deep-work session look like?", pick: "45 focused minutes" },
];

const METRIC_SELECTORS = {
  meta: ".meta-label",
  cineTitle: "h1.cine-title",
  questionTitle: "main h2",
  questionHint: "main h2 + p",
  cineBody: "main p, .safe-bottom p",
  cta: "button.rounded-full",
  choice: "main button",
  reportTitle: "h1",
  paperCard: ".paper-card",
};

function outPath(width, state, ext = "png") {
  return join(OUT, String(width), `${state}.${ext}`);
}

async function settle(page, ms) {
  await page.waitForTimeout(ms);
}

async function metrics(page) {
  return page.evaluate((sel) => {
    const grab = (s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const c = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        fontFamily: c.fontFamily,
        fontSize: c.fontSize,
        fontWeight: c.fontWeight,
        lineHeight: c.lineHeight,
        letterSpacing: c.letterSpacing,
        color: c.color,
        backgroundColor: c.backgroundColor,
        borderRadius: c.borderRadius,
        boxShadow: c.boxShadow,
        padding: c.padding,
        margin: c.margin,
        width: Math.round(r.width * 10) / 10,
        height: Math.round(r.height * 10) / 10,
        top: Math.round(r.top * 10) / 10,
        left: Math.round(r.left * 10) / 10,
        opacity: c.opacity,
        textTransform: c.textTransform,
        gap: c.gap,
      };
    };
    const out = {};
    for (const [k, v] of Object.entries(sel)) out[k] = grab(v);
    return out;
  }, METRIC_SELECTORS);
}

async function screenshot(page, width, state) {
  const p = outPath(width, state);
  mkdirSync(dirname(p), { recursive: true });
  await page.screenshot({ path: p, type: "png" });
  const m = await metrics(page);
  const mp = p.replace(/\.png$/, ".json");
  writeFileSync(mp, JSON.stringify(m, null, 2));
  console.log(`captured ${state} @ ${width}`);
}

async function clickButton(page, name) {
  const btn = page.getByRole("button", { name, exact: true });
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
}

async function runFullFlow(page, width) {
  // Onboarding
  for (let i = 0; i < 6; i++) {
    await screenshot(page, width, `cine-${i + 1}`);
    await clickButton(page, CINE_CTAS[i]);
    await settle(page, 1150);
  }
  // Screen 6 already captured; now dissolve after clicking Begin REBOOT
  await settle(page, 620);
  await screenshot(page, width, "dissolve-collapse");
  await settle(page, 620);
  await screenshot(page, width, "dissolve-clarity");
  await settle(page, 900);
  // Diagnosis
  for (const q of QUESTION_FLOW) {
    await screenshot(page, width, q.id);
    if (q.kind === "multi") {
      for (const p of q.picks) await clickButton(page, p);
      await settle(page, 250);
      await screenshot(page, width, `${q.id}-selected`);
      await clickButton(page, "Continue");
    } else {
      await clickButton(page, q.pick);
    }
    await settle(page, 950);
  }
  // Report
  await screenshot(page, width, "report");
}

async function jumpTo(page, state, width) {
  await page.evaluate((s) => {
    const st = JSON.parse(s);
    localStorage.setItem("reboot.state.v1", JSON.stringify(st));
  }, JUMP);
  await page.reload();
  await page.waitForTimeout(700);
  await screenshot(page, width, `jump-${state}`);
}

async function main() {
  const width = WIDTH;
  const height = HEIGHT || PHONES[width] || 874;
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--hide-scrollbars", "--disable-lazy-loading"],
  });
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: UA,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("console", (msg) => {
    if (msg.type() === "error") console.log(`[console.error] ${msg.text()}`);
  });
  await page.goto(BASE, { waitUntil: "networkidle" });
  // wait for hydration + fonts
  await page.evaluate(() => document.fonts.ready);
  // Simulate device safe-area insets so the web layout matches a real iPhone
  // (env(safe-area-inset-*) is 0 in headless Chrome).
  const safeTop = process.env.SAFE_TOP || "";
  const safeBottom = process.env.SAFE_BOTTOM || "";
  if (safeTop || safeBottom) {
    await page.addStyleTag({
      content: `.safe-top{padding-top:max(1.25rem, ${safeTop || 0}px) !important;}` +
        `.safe-bottom{padding-bottom:max(1.75rem, ${safeBottom || 0}px) !important;}`,
    });
  }
  await settle(page, 500);
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  if (!bg || bg === "rgba(0, 0, 0, 0)") {
    throw new Error("App did not hydrate");
  }

  if (RUN === "jump") {
    await jumpTo(page, JUMP, width);
  } else {
    await runFullFlow(page, width);
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
