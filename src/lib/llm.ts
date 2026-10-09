import { POLICY } from "./policy";
import type { PostInput } from "./types";

export interface ModelFlag {
  type: "absolute_claim" | "implied_result" | "before_after" | "promo_mismatch" | "promo_no_terms";
  source: "caption" | "transcript" | "onscreen" | "landing";
  quote: string;
  reason: string;
}
export interface ModelOut {
  flags: ModelFlag[];
  humor: boolean;
  summary: string;
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["flags", "humor", "summary"],
  properties: {
    flags: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "source", "quote", "reason"],
        properties: {
          type: { type: "string", enum: ["absolute_claim", "implied_result", "before_after", "promo_mismatch", "promo_no_terms"] },
          source: { type: "string", enum: ["caption", "transcript", "onscreen", "landing"] },
          quote: { type: "string" },
          reason: { type: "string" },
        },
      },
    },
    humor: { type: "boolean" },
    summary: { type: "string" },
  },
};

const SYSTEM = `You review a creator's short video post before a brand pays to run it as a TikTok ad.
Apply only these TikTok ad policy rules (quoted):
1. Misleading claims: "${POLICY.misleading_claims.quote}" Examples not allowed: "Get slim legs right away", "Get money in 10 seconds", claims of cures, "Number 1 essence on TikTok".
2. Before-and-after: "${POLICY.before_after.quote}" Comparative claims may be allowed with evidence or a clear disclaimer.
3. Inconsistent information: "${POLICY.inconsistent_info.quote}"

Flag types:
- absolute_claim: absolute terms about the product in relation to time, region or brand (#1, guaranteed, instantly, best on TikTok).
- implied_result: the creator states or implies a specific product outcome as fact (cured, gone, lost N pounds, earns $N), including in the voice-over only. Personal opinions and feelings ("feels soft", "I like the texture", "the reminder got me out the door") are fine.
- before_after: showing or narrating a before vs after comparison of the product's effect.
- promo_mismatch: a price, discount or offer in the ad that differs from the landing page.
- promo_no_terms: a promotion, giveaway or offer in the ad whose terms appear nowhere on the landing page.

Rules for your answer:
- Only flag real risks. A clean post gets an empty flags array.
- "quote" must be copied exactly, character for character, from the named source field. Quote the shortest full phrase that carries the problem.
- A comparison backed by a visible disclaimer or evidence is allowed; do not flag it.
- The landing page is reference only. Never flag a line from the landing page; use it to compare offers and terms.
- A video length or how long something takes to explain or watch ("in 15 seconds", "payday routine in 30 seconds") is not a result claim.
- Set humor=true if the risky line is plainly a joke or sarcasm, but still flag it, because ad review reads claims literally.
- summary: one plain sentence.`;

function userMsg(p: PostInput): string {
  return JSON.stringify({ caption: p.caption, transcript: p.transcript, onscreen: p.onscreen ?? "", landing: p.landing });
}

async function groq(model: string, p: PostInput, attempt = 0): Promise<ModelOut> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("no GROQ_API_KEY");
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userMsg(p) },
      ],
      response_format: { type: "json_schema", json_schema: { name: "boostcheck", strict: true, schema: SCHEMA } },
    }),
  });
  if (r.status === 429 && attempt < 3) {
    const wait = Math.min(Number(r.headers.get("retry-after") ?? "5") || 5, 20);
    await new Promise((res) => setTimeout(res, wait * 1000));
    return groq(model, p, attempt + 1);
  }
  if (!r.ok) throw new Error(`groq ${model} ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  return JSON.parse(j.choices[0].message.content) as ModelOut;
}

async function gemini(p: PostInput): Promise<ModelOut> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("no GEMINI_API_KEY");
  const r = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: userMsg(p) }] }],
        generationConfig: { temperature: 0, responseMimeType: "application/json", responseJsonSchema: SCHEMA },
      }),
    }
  );
  if (!r.ok) throw new Error(`gemini ${r.status}`);
  const j = await r.json();
  return JSON.parse(j.candidates[0].content.parts[0].text) as ModelOut;
}

/** Try Groq (gpt-oss-120b, then gpt-oss-20b), then Gemini. Returns model name used. */
export async function modelCheck(p: PostInput): Promise<{ out: ModelOut; model: string } | { error: string }> {
  const errors: string[] = [];
  const tries: [string, () => Promise<ModelOut>][] = [
    ["groq/openai/gpt-oss-120b", () => groq("openai/gpt-oss-120b", p)],
    ["groq/openai/gpt-oss-20b", () => groq("openai/gpt-oss-20b", p)],
    ["gemini-2.5-flash", () => gemini(p)],
  ];
  for (const [name, fn] of tries) {
    try {
      return { out: await fn(), model: name };
    } catch (e) {
      errors.push((e as Error).message);
    }
  }
  return { error: errors.join(" | ") };
}
