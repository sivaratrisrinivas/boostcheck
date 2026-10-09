import { BRANDS } from "./brands";
import { checkPost } from "./check";
import { db } from "./db";
import type { CheckResult, PostInput } from "./types";

export interface PostRow {
  id: string;
  brand: string;
  handle: string;
  views: number;
  caption: string;
  transcript: string;
  onscreen: string;
  meta: PostInput["meta"];
  intended: string;
  revision: { caption?: string; transcript?: string; onscreen?: string; aiLabel?: boolean } | null;
  revised: boolean;
  decision: string | null;
  result: CheckResult | null;
  boost_state: string;
  updated_at: string;
}

export async function listPosts(brand: string): Promise<PostRow[]> {
  const q = await db();
  const { rows } = await q("select * from posts where brand = $1 order by id", [brand]);
  return rows;
}

export async function getPost(id: string): Promise<PostRow | null> {
  const q = await db();
  const { rows } = await q("select * from posts where id = $1", [id]);
  return rows[0] ?? null;
}

export async function events(id: string) {
  const q = await db();
  const { rows } = await q("select kind, detail, at from events where post_id = $1 order by at desc limit 20", [id]);
  return rows;
}

async function log(id: string, kind: string, detail: unknown) {
  const q = await db();
  await q("insert into events (post_id, kind, detail) values ($1,$2,$3)", [id, kind, JSON.stringify(detail)]);
}

export function inputOf(p: PostRow): PostInput {
  return { caption: p.caption, transcript: p.transcript, onscreen: p.onscreen, landing: BRANDS[p.brand].landing, meta: p.meta };
}

export async function recheck(id: string) {
  const p = await getPost(id);
  if (!p) throw new Error("not found");
  const r = await checkPost(inputOf(p), { handle: p.handle, brand: BRANDS[p.brand].name });
  const q = await db();
  await q("update posts set decision=$2, result=$3, updated_at=now() where id=$1", [id, r.decision, JSON.stringify(r)]);
  await log(id, "checked", { decision: r.decision, model: r.model, flags: r.flags.length });
  return r;
}

/** Simulates the creator posting an edited version (or switching on the AI label), then re-checks. */
export async function applyFix(id: string) {
  const p = await getPost(id);
  if (!p || !p.revision) throw new Error("no revision");
  const rv = p.revision;
  const meta = { ...p.meta, aiLabel: rv.aiLabel ?? p.meta.aiLabel };
  const q = await db();
  await q("update posts set caption=$2, transcript=$3, onscreen=$4, meta=$5, revised=true where id=$1", [
    id, rv.caption ?? p.caption, rv.transcript ?? p.transcript, rv.onscreen ?? p.onscreen, JSON.stringify(meta),
  ]);
  await log(id, "creator_fix_applied", { simulated: true, changed: Object.keys(rv) });
  return recheck(id);
}

export async function boost(id: string) {
  const p = await getPost(id);
  if (!p) throw new Error("not found");
  if (p.decision !== "OK_TO_BOOST") throw new Error("boost is blocked until the post is OK to boost");
  const q = await db();
  await q("update posts set boost_state='queued', updated_at=now() where id=$1", [id]);
  await log(id, "boost_queued", { simulated: true, note: "No ad platform was called." });
}

export async function override(id: string) {
  const p = await getPost(id);
  if (!p || !p.result) throw new Error("not found");
  const r = { ...p.result, decision: "OK_TO_BOOST", notes: [...p.result.notes, "A reviewer overrode the flags and cleared this post."] };
  const q = await db();
  await q("update posts set decision='OK_TO_BOOST', result=$2, updated_at=now() where id=$1", [id, JSON.stringify(r)]);
  await log(id, "reviewer_override", { previous: p.decision });
}

export async function evalRuns() {
  const q = await db();
  const { rows } = await q("select id, started, score, total, models, rows from eval_runs order by started desc limit 10");
  return rows;
}
