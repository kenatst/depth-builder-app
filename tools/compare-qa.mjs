// Compares web vs native screenshots: resizes both to the same canvas, computes
// per-pixel deltas, writes a side-by-side montage and a per-state diff report.
import { mkdirSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const WEB_DIR = process.env.WEB_DIR || "/Users/kena/Documents/ChatGPT/vfin/qa/web/402";
const NATIVE_DIR = process.env.NATIVE_DIR || "/Users/kena/Documents/ChatGPT/vfin/qa/native/17pro";
const OUT_DIR = process.env.OUT_DIR || "/Users/kena/Documents/ChatGPT/vfin/qa/compare";
const STATES = process.env.STATES ? process.env.STATES.split(",") : null;
const CANVAS = 402; // 1x points for diffing

const states = STATES ?? [
  "cine-1", "cine-2", "cine-3", "cine-4", "cine-5", "cine-6",
  "d1-goals", "d1-goals-selected", "d2-primary", "d3-breaker", "d4-social_app",
  "d5-phone_place", "d6-focus_window", "d7-work_break", "d8-reading", "d9-recall_target",
  "d10-environment", "d11-energy", "d12-absorption", "d12-absorption-selected",
  "d13-flow_exit", "d14-session_target", "report", "report-unknowns",
];

function clamp(v) { return Math.max(0, Math.min(255, v)); }

async function main() {
  const sharp = (await import("sharp")).default;
  mkdirSync(OUT_DIR, { recursive: true });
  const report = [];

  for (const state of states) {
    const webPath = join(WEB_DIR, `${state}.png`);
    const nativePath = join(NATIVE_DIR, `${state}.png`);
    if (!existsSync(webPath) || !existsSync(nativePath)) {
      console.log(`skip ${state} (missing)`);
      continue;
    }

    const web = await sharp(webPath)
      .resize(CANVAS, Math.round(CANVAS * 2622 / 1206))
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const nat = await sharp(nativePath)
      .resize(CANVAS, Math.round(CANVAS * 2622 / 1206))
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const { data: webData, info: webInfo } = web;
    const { data: natData } = nat;
    const channels = webInfo.channels;
    const pixels = webInfo.width * webInfo.height;

    let sum = 0;
    let bottomSum = 0;
    let bottomCount = 0;
    let maxDelta = 0;
    for (let i = 0; i < pixels; i++) {
      const dr = Math.abs(webData[i * channels] - natData[i * channels]);
      const dg = Math.abs(webData[i * channels + 1] - natData[i * channels + 1]);
      const db = Math.abs(webData[i * channels + 2] - natData[i * channels + 2]);
      const delta = (dr + dg + db) / 3;
      sum += delta;
      maxDelta = Math.max(maxDelta, delta);
      if (i >= pixels * 0.55) {
        bottomSum += delta;
        bottomCount++;
      }
    }
    const mean = sum / pixels;
    const bottomMean = bottomSum / bottomCount;

    // montage: web | native, 1px gap, 402pt wide each
    const webResized = await sharp(webPath).resize(CANVAS, Math.round(CANVAS * 2622 / 1206)).png().toBuffer();
    const natResized = await sharp(nativePath).resize(CANVAS, Math.round(CANVAS * 2622 / 1206)).png().toBuffer();
    const gap = Buffer.alloc(2 * Math.round(CANVAS * 2622 / 1206) * 3, 180);
    await sharp({
      create: {
        width: CANVAS * 2 + 2,
        height: Math.round(CANVAS * 2622 / 1206),
        channels: 3,
        background: { r: 180, g: 180, b: 180 },
      },
    })
      .composite([
        { input: webResized, left: 0, top: 0 },
        { input: natResized, left: CANVAS + 2, top: 0 },
      ])
      .png()
      .toFile(join(OUT_DIR, `${state}.png`));

    report.push({ state, mean: Math.round(mean * 10) / 10, bottomMean: Math.round(bottomMean * 10) / 10, maxDelta: Math.round(maxDelta) });
    console.log(`${state}: mean Δ ${mean.toFixed(1)}  bottom Δ ${bottomMean.toFixed(1)}`);
  }

  writeFileSync(join(OUT_DIR, "report.json"), JSON.stringify(report, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
