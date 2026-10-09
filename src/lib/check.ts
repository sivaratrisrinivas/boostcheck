import { modelCheck } from "./llm";
import { POLICY } from "./policy";
import { runRules, textOf } from "./rules";
import { findVerbatim, percents } from "./text";
import type { CheckResult, Decision, Flag, PostInput } from "./types";

const SECTION_FOR: Record<string, string> = {
  absolute_claim: "misleading_claims",
  implied_result: "misleading_claims",
  before_after: "before_after",
  promo_mismatch: "inconsistent_info",
  promo_no_terms: "inconsistent_info",
};

const EDIT_TYPES = new Set(["absolute_claim", "implied_result", "before_after", "promo_mismatch", "promo_no_terms", "missing_disclosure"]);

function dedupe(flags: Flag[]): Flag[] {
  const seen = new Map<string, Flag>();
  for (const f of flags) {
    const k = `${f.type}|${f.source}|${f.quote.toLowerCase()}`;
    // A rule hit and a model hit on overlapping text: keep the rule one (deterministic), drop the model duplicate.
    const overlap = [...seen.values()].find(
      (g) => g.type === f.type && g.source === f.source && (g.quote.toLowerCase().includes(f.quote.toLowerCase()) || f.quote.toLowerCase().includes(g.quote.toLowerCase()))
    );
    if (!seen.has(k) && !overlap) seen.set(k, f);
  }
  return [...seen.values()];
}

export interface NoteCtx {
  handle?: string;
  brand?: string;
}

const FIX: Record<string, (f: Flag, p: PostInput) => string> = {
  absolute_claim: () => "TikTok ads can't use absolute terms like \"#1\", \"guaranteed\" or a result in seconds. Could you describe your own experience instead?",
  implied_result: () => "This reads as a promised result. Could you say how it felt for you, without stating the outcome as a fact?",
  before_after: () => "Paid ads can't show before-and-after results. Could you cut the comparison and keep the routine part?",
  promo_mismatch: (_f, p) => {
    const l = percents(p.landing);
    const max = l.length ? Math.max(...l.map((x) => x.value)) : null;
    return max === null ? "The landing page doesn't show this offer. Could you remove it?" : `The landing page says up to ${max}% off. Could you match that wording?`;
  },
  promo_no_terms: () => "The landing page doesn't show terms for this offer. Could you remove it or point to where the terms live?",
  missing_disclosure: () => "Please switch on the commercial content disclosure toggle for this post.",
  unlabeled_ai: () => "Please switch on TikTok's AI-generated content label, or add a clear \"AI-generated\" line to the caption.",
};

const WHERE: Record<string, string> = {
  caption: "In the caption",
  transcript: "In the voice-over",
  onscreen: "In the on-screen text",
  landing: "On the landing page",
  metadata: "In the post settings",
};

export function draftNote(flags: Flag[], p: PostInput, ctx: NoteCtx = {}): string | null {
  const actionable = flags.filter((f) => f.type !== "non_english");
  if (!actionable.length) return null;
  const lines = actionable.map((f) =>
    f.source === "metadata" ? `- ${WHERE[f.source]}: ${FIX[f.type](f, p)}` : `- ${WHERE[f.source]} you say "${f.quote}". ${FIX[f.type](f, p)}`
  );
  return [
    `Hi ${ctx.handle ? "@" + ctx.handle : "there"}, thanks for the ${ctx.brand ?? ""} post, it's doing well and we'd like to run it as a paid ad on TikTok.`.replace("  ", " "),
    "Before we can, TikTok's ad policy needs a small change:",
    ...lines,
    "Once it's updated we'll boost it. Thanks!",
  ].join("\n");
}

export async function checkPost(p: PostInput, ctx: NoteCtx = {}, opts: { useModel?: boolean } = {}): Promise<CheckResult> {
  const t0 = Date.now();
  const notes: string[] = [];
  const { flags: ruleFlags, nonEnglish } = runRules(p);
  if (nonEnglish) {
    return { decision: "NEEDS_HUMAN", flags: ruleFlags, creatorNote: null, notes: ["Not English. Sent to a person before any automated decision."], model: null, ms: Date.now() - t0 };
  }

  let flags = [...ruleFlags];
  let model: string | null = null;
  let modelFailed = false;
  if (opts.useModel !== false) {
    const res = await modelCheck(p);
    if ("error" in res) {
      modelFailed = true;
      notes.push("Model check unavailable, so only the rules ran.");
    } else {
      model = res.model;
      for (const mf of res.out.flags) {
        // Guardrail: the quote must exist verbatim in the cited source (or any ad source).
        let src: Flag["source"] = mf.source;
        let verbatim = findVerbatim(textOf(p, src), mf.quote);
        if (!verbatim) {
          for (const s of ["caption", "transcript", "onscreen"] as const) {
            verbatim = findVerbatim(textOf(p, s), mf.quote);
            if (verbatim) { src = s; break; }
          }
        }
        if (!verbatim) {
          notes.push(`Dropped a model flag (${mf.type}) because its quote was not found word for word: "${mf.quote}"`);
          continue;
        }
        // Landing-page lines are the reference, not the post under review.
        if (src === "landing") continue;
        // Discount numbers are checked by code. If every % in the quote is within the landing offer, the model is overruled.
        if (mf.type === "promo_mismatch") {
          const lp = percents(p.landing);
          const max = lp.length ? Math.max(...lp.map((x) => x.value)) : null;
          const qp = percents(verbatim);
          if (max !== null && qp.length && qp.every((x) => x.value <= max)) {
            notes.push(`Overruled a model discount flag: "${verbatim}" is within the landing page offer (up to ${max}%).`);
            continue;
          }
        }
        flags.push({ type: mf.type, source: src, quote: verbatim, sectionId: SECTION_FOR[mf.type], reason: mf.reason, by: "model" });
      }
      if (res.out.humor && res.out.flags.length) notes.push("The model thinks the flagged line is a joke. TikTok reviews claims literally, so it is still flagged; a person can override.");
    }
  }
  flags = dedupe(flags);

  const hasEdit = flags.some((f) => EDIT_TYPES.has(f.type));
  const hasAi = flags.some((f) => f.type === "unlabeled_ai");
  let decision: Decision = hasEdit ? "NEEDS_EDIT" : hasAi ? "ADD_AI_LABEL" : "OK_TO_BOOST";
  if (decision === "OK_TO_BOOST" && modelFailed) {
    decision = "NEEDS_HUMAN";
    notes.push("Rules found nothing, but the fuzzy checks did not run, so this is not auto-cleared.");
  }
  const creatorNote = decision === "NEEDS_EDIT" || decision === "ADD_AI_LABEL" ? draftNote(flags, p, ctx) : null;
  return { decision, flags, creatorNote, notes, model, ms: Date.now() - t0 };
}

export { POLICY };
