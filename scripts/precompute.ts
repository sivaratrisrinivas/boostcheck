// Runs the checker once over every synthetic campaign post and stores results in data/results.json,
// so the demo loads without 120 model calls. Re-run after changing the checker.
import "./env";
import { writeFileSync } from "node:fs";
import posts from "../data/posts.json";
import { BRANDS } from "../src/lib/brands";
import { checkPost } from "../src/lib/check";

(async () => {
  const out: Record<string, unknown> = {};
  let agree = 0;
  for (const p of posts as any[]) {
    const r = await checkPost({ caption: p.caption, transcript: p.transcript, onscreen: p.onscreen, landing: BRANDS[p.brand].landing, meta: p.meta }, { handle: p.handle, brand: BRANDS[p.brand].name });
    out[p.id] = r;
    if (r.decision === p.intended) agree++;
    console.log(p.id, p.intended, "=>", r.decision, r.model);
  }
  writeFileSync("data/results.json", JSON.stringify(out, null, 1));
  console.log(`dev-set agreement with intended label: ${agree}/${(posts as any[]).length}`);
})();
