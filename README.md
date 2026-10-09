# BoostCheck

Checks a creator post against TikTok's public ad policy before a brand boosts it as a paid ad.

Live demo: https://boostcheck.onrender.com (free Render instance: the first load after idle can take about a minute) · Walkthrough video (72 s, silent): https://boostcheck.onrender.com/demo.mp4 (also `public/demo.mp4`) · Eval: https://boostcheck.onrender.com/eval

## Problem

Creator platforms now let brands turn an organic creator video into a paid ad in one click. The winners go straight to paid spend, so a policy miss means a rejected or restricted ad on the post that was working best. BoostCheck reads the caption, the voice-over transcript, the on-screen text and the brand's landing page, and decides: **OK to boost**, **Needs edit** (with a drafted note to the creator that quotes the line to change), or **Add AI label**. Posts it can't judge (for example, not in English) go to a person. "Approve boost" stays off until a post is clear.

## Evidence

TikTok's [Misleading and false content](https://ads.tiktok.com/help/article/tiktok-ads-policy-misleading-and-false-content) ad policy (last updated April 2026) says ads must not "promise or exaggerate results" or use "absolute terms about a product in relation to time, region, or brand"; bans "before-and-after results"; bans "mismatched or inconsistent information on the promotion, price, discounts" between ad and landing page; and says "If we identify AI-generated content that has not been disclosed, your ad will be rejected or restricted." Background removal and lighting fixes are listed as minor edits that need no label. The [Branded Content Policy](https://www.tiktok.com/legal/page/global/bc-policy/en) requires the commercial content disclosure toggle. Every flag in the app quotes the post line and the policy section it breaks (`src/lib/policy.ts`).

## Built vs simulated

| Built and working | Simulated or not built |
|---|---|
| Rules: absolute terms, % discount vs landing page, disclosure toggle, declared AI use without a label, non-English routing | Posts, creators, brands (Dewly, Pocketly, Loopstep) and landing pages are synthetic (`data/`) |
| Model check (Groq `gpt-oss-120b`, JSON schema) for implied results, before/after, promos with no terms; a flag is dropped unless its quote is found word for word | The boost: "Approve boost" only writes `queued` to the database |
| Decision, drafted creator note, reviewer override, event log, all in Postgres | The creator's edit: a pre-written revision is applied when you click it |
| 20-case eval runner with stored runs and a results page | AI use is read from declared metadata, not detected from pixels or audio |
| Campaign table with status chips, deployed on Render's free tier | No Whisper, OCR, Meta policy, or sending notes to creators |

**Eval:** 18/20 on the latest run (bar 17/20); four runs scored 19, 18, 19, 18. All misses are false alarms on clean posts. Details, failure types and what was tuned on the eval: [evals/RUNS.md](evals/RUNS.md).

## Run it (under 5 minutes)

```sh
git clone https://github.com/sivaratrisrinivas/boostcheck && cd boostcheck
npm install
cp .env.example .env    # add a free GROQ_API_KEY (console.groq.com) or GEMINI_API_KEY
npm run dev             # http://localhost:3000, uses embedded PGlite, no database setup
npm run eval            # runs the 20 cases against the model, writes evals/results/
```

Set `DATABASE_URL` to use any Postgres. The live demo uses a free Render Postgres over Render's private network (free Render databases expire after 30 days, here around Nov 9, 2026; the app falls back to PGlite without one). Without a model key, posts the rules can't clear go to "Needs a person" instead of auto-clearing. `npm run seed` re-runs the checker over the 120 synthetic posts.

## Next steps

1. Get a real rejection rate for boosted creator posts; that number decides whether this is worth running.
2. A fresh eval set written by someone else, plus Meta's ad standards.
3. Whisper on the actual video and OCR for on-screen text, instead of provided transcripts.
4. Run on post ingest and gate the real boost button; log reviewer overrides as training data.

Data: all posts, creators and brands are invented for this prototype. Policy text is quoted from TikTok's public pages, opened Oct 10, 2026. This is an independent prototype and says nothing about how any company's internal systems work. MIT license.
