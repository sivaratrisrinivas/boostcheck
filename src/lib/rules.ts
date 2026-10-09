import type { Flag, PostInput, Source } from "./types";
import { looksNonEnglish, percents, spans } from "./text";

// Absolute or time-bound result terms, written from the policy examples
// ("Get slim legs right away", "Get money in 10 seconds", "Number 1 essence on TikTok").
const ABSOLUTE: { re: RegExp; why: string }[] = [
  { re: /#\s?1\b|\bnumber\s?(one|1)\b|\bno\.\s?1\b/i, why: "ranking claim (#1 / number one)" },
  { re: /\bguarantee(d|s)?\b/i, why: "guaranteed result" },
  { re: /\binstantly\b|\bright away\b|\bovernight results?\b/i, why: "result promised in no time" },
  {
    re: /\b(get|gets|got|lose|earn|make|see|cash|money|approved|fixed|gone|results?)\b[^.!?\n]{0,40}\bin (\d+|ten|five|thirty) (seconds?|minutes?)\b/i,
    why: "result promised within seconds or minutes",
  },
  { re: /\b100% (effective|guaranteed|results?)\b/i, why: "100% result claim" },
  { re: /\b(cures?|cured)\b/i, why: "cure claim" },
  { re: /\bbest\b[^.!?\n]{0,30}\b(on tiktok|in the world|ever made)\b/i, why: "superlative vs all brands" },
];

const AD_SOURCES: Source[] = ["caption", "transcript", "onscreen"];
const SIGNIFICANT_AI = new Set(["ai_voice_clone", "ai_generated_person", "ai_generated_video", "ai_face_swap"]);
const AI_DISCLOSED = /#ai(generated|gc)?\b|\bai[- ]generated\b|\bmade with ai\b|\bai voice\b|\bai avatar\b/i;

function textOf(p: PostInput, s: Source): string {
  if (s === "caption") return p.caption;
  if (s === "transcript") return p.transcript;
  if (s === "onscreen") return p.onscreen ?? "";
  if (s === "landing") return p.landing;
  return "";
}

export function runRules(p: PostInput): { flags: Flag[]; nonEnglish: boolean } {
  const flags: Flag[] = [];

  const nonEnglish = looksNonEnglish(`${p.caption} ${p.transcript}`);
  if (nonEnglish) {
    flags.push({
      type: "non_english",
      source: "caption",
      quote: p.caption,
      sectionId: "misleading_claims",
      reason: "Caption or voice-over is not in English. The rule list and model prompt are English-only, so a person should review it.",
      by: "rules",
    });
    return { flags, nonEnglish };
  }

  // 1. Absolute terms.
  for (const s of AD_SOURCES) {
    for (const sp of spans(textOf(p, s))) {
      const hit = ABSOLUTE.find((a) => a.re.test(sp));
      if (hit)
        flags.push({ type: "absolute_claim", source: s, quote: sp, sectionId: "misleading_claims", reason: `Absolute term: ${hit.why}.`, by: "rules" });
    }
  }

  // 2. Discount mismatch vs landing page.
  const landing = percents(p.landing);
  const landingMax = landing.length ? Math.max(...landing.map((x) => x.value)) : null;
  for (const s of AD_SOURCES) {
    for (const sp of spans(textOf(p, s))) {
      for (const pc of percents(sp)) {
        if (landingMax === null)
          flags.push({ type: "promo_mismatch", source: s, quote: sp, sectionId: "inconsistent_info", reason: `Ad mentions ${pc.value}% but the landing page shows no discount.`, by: "rules" });
        else if (pc.value > landingMax)
          flags.push({ type: "promo_mismatch", source: s, quote: sp, sectionId: "inconsistent_info", reason: `Ad says ${pc.value}%, landing page says up to ${landingMax}%.`, by: "rules" });
      }
    }
  }

  // 3. Commercial content disclosure toggle.
  if (!p.meta.disclosureToggle)
    flags.push({ type: "missing_disclosure", source: "metadata", quote: "disclosureToggle: off", sectionId: "branded_disclosure", reason: "Commercial content disclosure toggle is off.", by: "rules" });

  // 4. Declared AI use without a label.
  const sig = p.meta.aiUse.filter((u) => SIGNIFICANT_AI.has(u));
  const selfLabeled = AI_DISCLOSED.test(`${p.caption} ${p.onscreen ?? ""}`);
  if (sig.length && !p.meta.aiLabel && !selfLabeled)
    flags.push({
      type: "unlabeled_ai",
      source: "metadata",
      quote: `aiUse: ${sig.join(", ")}; aiLabel: off`,
      sectionId: "aigc",
      reason: `Declared ${sig.join(", ").replace(/_/g, " ")} counts as significant AI use, and there is no AIGC label or disclaimer.`,
      by: "rules",
    });

  return { flags, nonEnglish };
}

export { textOf };
