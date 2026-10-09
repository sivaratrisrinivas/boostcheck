import "./env";
import { writeFileSync } from "node:fs";
import cases from "../evals/cases.json";
import { runEval, type EvalCase } from "../src/lib/evalcore";
import { saveEvalRun } from "../src/lib/db";

(async () => {
  const started = new Date().toISOString();
  const res = await runEval(cases as EvalCase[], (r) =>
    console.log(`${r.pass ? "PASS" : "FAIL"} ${r.id} ${r.group.padEnd(22)} got ${r.got.padEnd(12)} ${r.why}`)
  );
  const models = [...new Set(res.rows.map((r) => r.model ?? "rules-only"))];
  const run = { started, models, score: res.score, total: res.total, bar: 17, rows: res.rows };
  const stamp = started.replace(/[:.]/g, "-");
  writeFileSync(`evals/results/${stamp}.json`, JSON.stringify(run, null, 2));
  writeFileSync("evals/results/latest.json", JSON.stringify(run, null, 2));
  try { await saveEvalRun(run); } catch (e) { console.log("(db save skipped:", (e as Error).message, ")"); }
  console.log(`\nScore ${res.score}/${res.total} (bar 17/20) ${res.score >= 17 ? "PASS" : "BELOW BAR"} models: ${models.join(", ")}`);
  process.exit(0);
})();
