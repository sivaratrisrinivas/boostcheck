// Generates synthetic SideShift-style campaign posts (dev set, separate from evals/cases.json).
// Everything here is invented: brands, creators, captions, transcripts.
import { writeFileSync } from "node:fs";
import type { AiUse } from "../src/lib/types";

type Seed = { caption: string; transcript: string; onscreen?: string; aiUse?: AiUse[]; intended: string; revision?: { caption?: string; transcript?: string; onscreen?: string; aiLabel?: boolean } };

let s = 7;
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];

const FIRST = ["maya", "jules", "theo", "rina", "kofi", "sam", "lena", "omar", "priya", "dani", "noah", "ivy", "marco", "zoe", "eli", "ana", "ben", "kai", "nia", "leo"];
const SUFFIX = ["daily", "makes", "irl", "eats", "walks", "ugc", "loves", "tries", "notes", "life"];

const CLEAN: Record<string, { cap: string[]; vo: string[] }> = {
  dewly: {
    cap: [
      "morning skincare with the Dewly barrier serum #ad",
      "grwm but make it 3 steps #dewly #ad",
      "trying Dewly after a long flight, skin felt so dry #ad",
      "my no-fuss routine before work #ad",
      "why this serum lives on my desk now #ad",
      "dry winter skin check with Dewly #ad",
      "Dewly fall sale, code DEW30 for up to 30% off #ad",
      "the serum I reach for after the gym #ad",
      "skincare shelf reset, Dewly made the cut #ad",
      "honest week one thoughts on Dewly #ad",
      "a slow Sunday routine #ad",
      "packing my travel skincare #ad",
    ],
    vo: [
      "I like that it's really light and doesn't feel sticky under sunscreen.",
      "Two pumps, pat it in, done. It smells like nothing, which I love.",
      "My skin felt tight after the flight and this felt nice and calming going on.",
      "I've been using it for about a week. The texture is my favorite part so far.",
      "It layers well under makeup and doesn't pill, which is my main test.",
      "The bottle is small enough for my gym bag, so I actually use it.",
      "If you've been curious, their fall sale is on, up to thirty percent off with my code.",
      "I keep it simple: cleanser, this serum, moisturizer.",
      "It's not magic, it's just a nice serum that my skin seems to like.",
      "I use it at night mostly, and it feels comfortable when I wake up.",
    ],
  },
  pocketly: {
    cap: [
      "how I set up budget buckets with Pocketly #ad",
      "payday routine in 30 seconds #ad",
      "my bills calendar finally lives in one app #ad",
      "Pocketly round-ups, week two #ad",
      "budgeting for a trip with Pocketly #ad",
      "what my grocery bucket looks like this month #ad",
      "the app that reminds me before rent is due #ad",
      "student budget check-in #ad",
      "splitting my paycheck the lazy way #ad",
      "trying Pocketly's savings goals #ad",
    ],
    vo: [
      "I split every paycheck into rent, groceries and fun money so I can see what's left.",
      "The bill reminders pinged me two days before my phone bill, which helped.",
      "Round-ups move spare change into savings. It's small, but I like watching it add up.",
      "I set a goal for a weekend trip and the progress bar keeps me honest.",
      "Seeing my grocery bucket shrink makes me think twice about extra snacks.",
      "There is a monthly plan, so check the fee schedule on their site first.",
      "I mostly use it to see upcoming bills in one place.",
      "It's not a bank, it's a budgeting app that sits on top of my account.",
    ],
  },
  loopstep: {
    cap: [
      "walking streak day 12 with Loopstep #ad",
      "my lunch break walk routine #ad",
      "trying the Loopstep 7 day free trial #ad",
      "small habits that stuck this month #ad",
      "Loopstep annual plan is 40% off this week #ad",
      "evening walk reminder actually worked #ad",
      "weekly goal check-in #ad",
      "rainy day indoor steps #ad",
      "how I got back into walking #ad",
      "my favorite Loopstep feature #ad",
    ],
    vo: [
      "I set a ten minute walk after lunch and the reminder got me out the door.",
      "The streak counter is silly but it works on me.",
      "I like the weekly goal more than daily ones, it feels less stressful.",
      "There's a free trial, then it's yearly, and you can cancel in settings.",
      "This week they have forty percent off the annual plan for new members.",
      "On rainy days I walk laps around my apartment and it still counts.",
      "It's a simple app. Walk, log, see your streak.",
      "My favorite part is the gentle nudge at 6pm.",
    ],
  },
};

const FLAGGED: Record<string, Seed[]> = {
  dewly: [
    { intended: "NEEDS_EDIT", caption: "the best serum on TikTok, period #ad", transcript: "I've tried so many and this is the one I keep buying.", revision: { caption: "my favorite serum lately #ad" } },
    { intended: "NEEDS_EDIT", caption: "Dewly 50% off with DEW30 this week only #ad", transcript: "Go grab it while the sale is on.", revision: { caption: "Dewly up to 30% off with DEW30 this week #ad" } },
    { intended: "NEEDS_EDIT", caption: "two weeks of Dewly #ad", transcript: "Left side is day one, right side is day fourteen. My dark spots faded so much.", onscreen: "BEFORE / AFTER", revision: { transcript: "Two weeks in and I still like the texture, it's part of my routine now.", onscreen: "" } },
    { intended: "NEEDS_EDIT", caption: "night routine #ad", transcript: "Honestly this serum cured my eczema. I don't even need my cream anymore.", revision: { transcript: "This serum feels calm on my skin at night, which I like." } },
    { intended: "NEEDS_EDIT", caption: "skin update #ad", transcript: "My wrinkles disappeared in a week, I'm not even kidding.", revision: { transcript: "A week in and my skin feels soft in the mornings." } },
    { intended: "NEEDS_EDIT", caption: "results guaranteed or I'll eat my hat #ad", transcript: "This is the serum I use every morning.", revision: { caption: "the serum I use every morning #ad" } },
  ],
  pocketly: [
    { intended: "NEEDS_EDIT", caption: "get money in 10 seconds with Pocketly #ad", transcript: "I needed a little cash before payday.", revision: { caption: "how I use Pocketly before payday #ad" } },
    { intended: "NEEDS_EDIT", caption: "my side income app #ad", transcript: "I made two thousand dollars last month just from round-ups.", revision: { transcript: "Round-ups move spare change into savings, and it adds up slowly." } },
    { intended: "NEEDS_EDIT", caption: "Pocketly is the number 1 money app for students #ad", transcript: "I use it for my bills.", revision: { caption: "the money app I use as a student #ad" } },
    { intended: "NEEDS_EDIT", caption: "Pocketly gives you $500 instantly #ad", transcript: "Seriously, just download it.", revision: { caption: "Pocketly advances for eligible members, check limits #ad" } },
    { intended: "NEEDS_EDIT", caption: "before Pocketly vs after Pocketly #ad", transcript: "Before, I was in overdraft every month. After, I have three thousand in savings.", onscreen: "BEFORE / AFTER", revision: { caption: "why I keep using Pocketly #ad", transcript: "Seeing my bills in one place helps me plan the month.", onscreen: "" } },
    { intended: "NEEDS_EDIT", caption: "Pocketly giveaway, comment to win $1,000 #ad", transcript: "Comment below and I'll pick a winner Friday.", revision: { caption: "how I plan my month with Pocketly #ad", transcript: "Here's the bucket setup I use." } },
  ],
  loopstep: [
    { intended: "NEEDS_EDIT", caption: "lose 10 pounds in your first week with Loopstep #ad", transcript: "Walk with me.", revision: { caption: "first week of walking with Loopstep #ad" } },
    { intended: "NEEDS_EDIT", caption: "Loopstep deal #ad", transcript: "They're doing 70% off the annual plan right now.", revision: { transcript: "They're doing 40% off the annual plan for new members right now." } },
    { intended: "NEEDS_EDIT", caption: "30 day glow up #ad", transcript: "Day one versus day thirty, look at my waist.", onscreen: "DAY 1 vs DAY 30", revision: { transcript: "Thirty days of walks, and I like having a routine.", onscreen: "" } },
    { intended: "NEEDS_EDIT", caption: "my back pain is gone #ad", transcript: "Walking with Loopstep fixed my back pain completely.", revision: { caption: "walks that help me reset #ad", transcript: "A short walk after lunch helps me feel less stiff." } },
    { intended: "NEEDS_EDIT", caption: "the #1 fitness app on TikTok #ad", transcript: "Everyone's using it for a reason.", revision: { caption: "the fitness app I actually open #ad" } },
    { intended: "NEEDS_EDIT", caption: "guaranteed results in 7 days #ad", transcript: "Just walk every day.", revision: { caption: "7 days of daily walks #ad" } },
  ],
};

const AI: Record<string, Seed[]> = {
  dewly: [
    { intended: "ADD_AI_LABEL", caption: "Dewly in 15 seconds #ad", transcript: "This is Dewly, a light serum with ceramides.", aiUse: ["ai_voice_clone"], revision: { aiLabel: true } },
    { intended: "ADD_AI_LABEL", caption: "meet our routine guide #ad", transcript: "Hi, I'm Ava. Here's how I layer Dewly.", aiUse: ["ai_generated_person"], revision: { aiLabel: true } },
  ],
  pocketly: [
    { intended: "ADD_AI_LABEL", caption: "Pocketly explained #ad", transcript: "Pocketly puts your bills and buckets in one place.", aiUse: ["ai_voice_clone"], revision: { aiLabel: true } },
    { intended: "ADD_AI_LABEL", caption: "budget tips with Max #ad", transcript: "Hey, I'm Max, and this is my bucket setup.", aiUse: ["ai_generated_person"], revision: { aiLabel: true } },
  ],
  loopstep: [
    { intended: "ADD_AI_LABEL", caption: "dance break walk #ad", transcript: "Walking to the beat with Loopstep.", aiUse: ["ai_face_swap"], revision: { aiLabel: true } },
    { intended: "ADD_AI_LABEL", caption: "coach Rio says hi #ad", transcript: "I'm Rio, your walking coach in Loopstep.", aiUse: ["ai_generated_video"], revision: { aiLabel: true } },
  ],
};

const out: any[] = [];
for (const brand of ["dewly", "pocketly", "loopstep"]) {
  const posts: Seed[] = [];
  for (let i = 0; i < 32; i++) {
    const minor: AiUse[] = rnd() < 0.15 ? [pick<AiUse>(["background_removal", "color_correction", "denoise"])] : [];
    posts.push({ intended: "OK_TO_BOOST", caption: CLEAN[brand].cap[i % CLEAN[brand].cap.length], transcript: pick(CLEAN[brand].vo), aiUse: minor });
  }
  posts.push(...FLAGGED[brand], ...AI[brand]);
  // shuffle deterministically
  for (let i = posts.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [posts[i], posts[j]] = [posts[j], posts[i]]; }
  posts.forEach((p, i) => {
    out.push({
      id: `${brand}-${String(i + 1).padStart(2, "0")}`,
      brand,
      handle: `${pick(FIRST)}.${pick(SUFFIX)}`,
      views: Math.floor(4000 + rnd() * 400000),
      caption: p.caption,
      transcript: p.transcript,
      onscreen: p.onscreen ?? "",
      meta: { aiUse: p.aiUse ?? [], aiLabel: false, disclosureToggle: true },
      intended: p.intended,
      revision: p.revision ?? null,
    });
  });
}
writeFileSync("data/posts.json", JSON.stringify(out, null, 1));
console.log(`wrote ${out.length} posts`);
