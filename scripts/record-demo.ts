// Records the walkthrough with headless Chrome + Playwright, then encodes 1280x720 H.264 (silent) with ffmpeg.
// Usage: npx tsx scripts/record-demo.ts https://boostcheck.vercel.app out.mp4
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { chromium, type Page } from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = process.argv[3] ?? "demo.mp4";
const EDIT_POST = process.env.EDIT_POST ?? "dewly-17";
const AI_POST = process.env.AI_POST ?? "dewly-25";

async function caption(page: Page, text: string) {
  await page.evaluate((t) => {
    let el = document.getElementById("__cap");
    if (!el) {
      el = document.createElement("div");
      el.id = "__cap";
      el.style.cssText = "position:fixed;left:50%;bottom:28px;transform:translateX(-50%);max-width:1000px;background:rgba(17,17,17,.88);color:#fff;font:600 21px/1.35 system-ui,sans-serif;padding:12px 20px;border-radius:10px;z-index:99999;text-align:center;pointer-events:none";
      document.body.appendChild(el);
    }
    el.textContent = t;
  }, text);
}
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function smoothScroll(page: Page, to: number, ms = 1500) {
  await page.evaluate(([y, d]) => new Promise<void>((res) => {
    const start = window.scrollY, t0 = performance.now();
    const step = (t: number) => { const k = Math.min(1, (t - t0) / d); window.scrollTo(0, start + (y - start) * k); k < 1 ? requestAnimationFrame(step) : res(); };
    requestAnimationFrame(step);
  }), [to, ms] as const);
}

(async () => {
  // Reset demo state first so the run starts clean.
  await fetch(`${BASE}/api/reset`, { method: "POST" });
  const dir = "/tmp/bc-video";
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROME ?? "/usr/bin/google-chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir, size: { width: 1280, height: 720 } } });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/?brand=dewly`, { waitUntil: "networkidle" });
  await caption(page, "BoostCheck: checks creator posts against TikTok's ad policy before a brand boosts them");
  await wait(4500);
  await caption(page, "One synthetic campaign, 40 creator posts, each already checked");
  await wait(3000);
  await smoothScroll(page, 420, 2500);
  await wait(1500);
  await caption(page, "Most are OK to boost. A few need an edit or an AI label.");
  await wait(2500);

  await page.goto(`${BASE}/post/${EDIT_POST}`, { waitUntil: "networkidle" });
  await caption(page, "A flagged post: the exact voice-over line is highlighted");
  await wait(4000);
  await caption(page, "Each flag cites the TikTok policy section it breaks");
  await wait(3500);
  await page.locator("[data-testid=boost]").hover();
  await caption(page, "Approve boost stays off until the post is clear");
  await wait(3000);
  await smoothScroll(page, 500, 1500);
  await caption(page, "A note to the creator is drafted, quoting the line to change");
  await wait(4500);
  await smoothScroll(page, 0, 1000);
  await caption(page, "Simulated: the creator posts the edit. It is re-checked live.");
  await page.locator("[data-testid=fix]").click();
  await page.waitForFunction(() => document.querySelector(".chip.OK_TO_BOOST, .chip.NEEDS_HUMAN, .chip.NEEDS_EDIT") && !document.querySelector("[data-testid=fix]"), null, { timeout: 60000 });
  await wait(1500);
  await caption(page, "Now it is OK to boost");
  await wait(2500);
  await page.locator("[data-testid=boost]").click();
  await page.waitForSelector("text=Boost queued", { timeout: 20000 });
  await caption(page, "Boost queued. The ad platform call is faked in this prototype.");
  await wait(3500);

  await page.goto(`${BASE}/post/${AI_POST}`, { waitUntil: "networkidle" });
  await caption(page, "This one declares an AI voice clone with no label, so: Add AI label");
  await wait(4500);
  await page.locator("[data-testid=fix]").click();
  await page.waitForFunction(() => !document.querySelector("[data-testid=fix]"), null, { timeout: 60000 });
  await caption(page, "Label switched on (simulated), re-checked: OK to boost");
  await wait(3500);

  await page.goto(`${BASE}/eval`, { waitUntil: "networkidle" });
  const score = await page.locator("[data-testid=score]").innerText();
  await caption(page, `20-case eval: ${score} against a 17/20 pass bar`);
  await wait(4000);
  await smoothScroll(page, 330, 2500);
  await caption(page, "The misses are false alarms on clean posts. Details in the README.");
  await wait(4000);
  await caption(page, "Synthetic data, real TikTok policy text. github.com/sivaratrisrinivas/boostcheck");
  await wait(3500);

  await ctx.close();
  await browser.close();
  const webm = readdirSync(dir).find((f) => f.endsWith(".webm"));
  if (!webm) throw new Error("no video");
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", `${dir}/${webm}`, "-an", "-vf", "scale=1280:720,fps=30,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "22", "-movflags", "+faststart", OUT]);
  console.log("wrote", OUT);
})();
