import { BRANDS } from "./brands";
import { checkPost } from "./check";
import { POLICY } from "./policy";
import { textOf } from "./rules";
import { findVerbatim } from "./text";
import type { CheckResult, PostInput } from "./types";

export interface EvalCase {
  id: string;
  group: string;
  expect: string[];
  expectFlag?: string;
  expectSource?: string;
  brand: string;
  caption: string;
  transcript: string;
  onscreen?: string;
  meta: PostInput["meta"];
}

export interface EvalRow {
  id: string;
  group: string;
  expected: string;
  got: string;
  pass: boolean;
  why: string;
  flags: { type: string; source: string; quote: string; section: string; by: string }[];
  notes: string[];
  model: string | null;
}

export function toInput(c: EvalCase): PostInput {
  return { caption: c.caption, transcript: c.transcript, onscreen: c.onscreen, landing: BRANDS[c.brand].landing, meta: c.meta };
}

export function grade(c: EvalCase, r: CheckResult): { pass: boolean; why: string } {
  const p = toInput(c);
  if (!c.expect.includes(r.decision)) return { pass: false, why: `decision ${r.decision}, expected ${c.expect.join(" or ")}` };
  for (const f of r.flags) {
    if (!POLICY[f.sectionId]) return { pass: false, why: `flag ${f.type} has no policy section` };
    if (f.source !== "metadata" && !findVerbatim(textOf(p, f.source), f.quote)) return { pass: false, why: `flag ${f.type} quote not verbatim` };
  }
  if (c.expect.includes("OK_TO_BOOST") && r.flags.length) return { pass: false, why: "clean case got flags" };
  if (c.expectFlag) {
    const hit = r.flags.find((f) => f.type === c.expectFlag && (!c.expectSource || f.source === c.expectSource));
    if (!hit) return { pass: false, why: `right decision but no ${c.expectFlag} flag${c.expectSource ? " on " + c.expectSource : ""}` };
  }
  return { pass: true, why: "" };
}

export async function runEval(cases: EvalCase[], onRow?: (r: EvalRow) => void): Promise<{ score: number; total: number; rows: EvalRow[] }> {
  const rows: EvalRow[] = [];
  for (const c of cases) {
    const r = await checkPost(toInput(c), { handle: "creator", brand: BRANDS[c.brand].name });
    const g = grade(c, r);
    const row: EvalRow = {
      id: c.id,
      group: c.group,
      expected: c.expect.join(" | "),
      got: r.decision,
      pass: g.pass,
      why: g.why,
      flags: r.flags.map((f) => ({ type: f.type, source: f.source, quote: f.quote, section: f.sectionId, by: f.by })),
      notes: r.notes,
      model: r.model,
    };
    rows.push(row);
    onRow?.(row);
  }
  return { score: rows.filter((r) => r.pass).length, total: rows.length, rows };
}
