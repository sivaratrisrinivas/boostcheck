import { NextResponse } from "next/server";
import cases from "../../../../evals/cases.json";
import { saveEvalRun } from "@/lib/db";
import { runEval, type EvalCase } from "@/lib/evalcore";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Runs the 20-case eval live against the model and stores the run.
export async function POST() {
  const started = new Date().toISOString();
  const res = await runEval(cases as EvalCase[]);
  const models = [...new Set(res.rows.map((r) => r.model ?? "rules-only"))];
  await saveEvalRun({ started, score: res.score, total: res.total, models, rows: res.rows });
  return NextResponse.json({ score: res.score, total: res.total });
}
