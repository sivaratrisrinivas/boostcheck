// Postgres access. Uses DATABASE_URL (any Postgres; the live demo uses Render's free Postgres).
// Without DATABASE_URL it falls back to PGlite, an embedded Postgres in WASM, so local setup needs no database.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

type Q = (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>;
let queryFn: Promise<Q> | null = null;

async function connect(): Promise<Q> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { Pool } = await import("pg");
    // Internal hostnames (no dot, e.g. Render's private network) and localhost connect without TLS.
    const host = new URL(url).hostname;
    const noTls = host === "localhost" || !host.includes(".") || url.includes("sslmode=disable");
    const pool = new Pool({ connectionString: url, ssl: noTls ? undefined : { rejectUnauthorized: false }, max: 3 });
    return (sql, params) => pool.query(sql, params as any[]);
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = process.env.VERCEL ? undefined : path.join(process.cwd(), ".pglite");
  const db = dir ? new PGlite(dir) : new PGlite();
  return (sql, params) => db.query(sql, params as any[]) as any;
}

const SCHEMA = `
create table if not exists posts (
  id text primary key,
  brand text not null,
  handle text not null,
  views int not null,
  caption text not null,
  transcript text not null,
  onscreen text not null default '',
  meta jsonb not null,
  intended text,
  revision jsonb,
  revised boolean not null default false,
  decision text,
  result jsonb,
  boost_state text not null default 'not_boosted',
  updated_at timestamptz not null default now()
);
create table if not exists eval_runs (
  id serial primary key,
  started timestamptz not null,
  score int not null,
  total int not null,
  models text[] not null,
  rows jsonb not null
);
create table if not exists events (
  id serial primary key,
  post_id text,
  kind text not null,
  detail jsonb,
  at timestamptz not null default now()
);`;

function readJson(rel: string): any {
  const p = path.join(process.cwd(), rel);
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
}

export async function seed(q: Q, force = false) {
  const { rows } = await q("select count(*)::int as n from posts");
  if (rows[0].n > 0 && !force) return seedEvals(q);
  await q("delete from posts");
  await q("delete from events");
  const posts = readJson("data/posts.json") ?? [];
  const results = readJson("data/results.json") ?? {};
  for (const p of posts) {
    const r = results[p.id] ?? null;
    await q(
      `insert into posts (id, brand, handle, views, caption, transcript, onscreen, meta, intended, revision, decision, result)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [p.id, p.brand, p.handle, p.views, p.caption, p.transcript, p.onscreen, JSON.stringify(p.meta), p.intended, JSON.stringify(p.revision), r?.decision ?? null, r ? JSON.stringify(r) : null]
    );
  }
  await seedEvals(q);
}

async function seedEvals(q: Q) {
  // Load every committed eval run (evals/results/*.json) that is not in the table yet.
  const dir = path.join(process.cwd(), "evals/results");
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => /^\d{4}-.*\.json$/.test(f)) : [];
  for (const f of files) {
    const run = readJson(`evals/results/${f}`);
    const { rows: ex } = await q("select 1 from eval_runs where started = $1", [run.started]);
    if (!ex.length)
      await q("insert into eval_runs (started, score, total, models, rows) values ($1,$2,$3,$4,$5)", [run.started, run.score, run.total, run.models, JSON.stringify(run.rows)]);
  }
}

export async function db(): Promise<Q> {
  if (!queryFn)
    queryFn = (async () => {
      const q = await connect();
      for (const stmt of SCHEMA.split(";").map((s) => s.trim()).filter(Boolean)) await q(stmt);
      await seed(q);
      return q;
    })().catch((e) => {
      queryFn = null; // retry on the next request instead of caching the failure
      throw e;
    });
  return queryFn;
}

export async function saveEvalRun(run: { started: string; score: number; total: number; models: string[]; rows: unknown }) {
  const q = await db();
  await q("insert into eval_runs (started, score, total, models, rows) values ($1,$2,$3,$4,$5)", [run.started, run.score, run.total, run.models, JSON.stringify(run.rows)]);
}
