import Link from "next/link";
import { notFound } from "next/navigation";
import { BRANDS } from "@/lib/brands";
import { POLICY } from "@/lib/policy";
import { events, getPost } from "@/lib/repo";
import type { Flag, Source } from "@/lib/types";
import { Chip } from "@/components/Chip";
import { Actions, CopyNote } from "@/components/Actions";

export const dynamic = "force-dynamic";

function Marked({ text, quotes }: { text: string; quotes: string[] }) {
  if (!text) return <span className="muted">(none)</span>;
  const qs = quotes.filter(Boolean).sort((a, b) => b.length - a.length);
  if (!qs.length) return <>{text}</>;
  const esc = qs.map((q) => q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(${esc.join("|")})`, "gi"));
  return <>{parts.map((p, i) => (qs.some((q) => q.toLowerCase() === p.toLowerCase()) ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>))}</>;
}

const SRC: Record<Source, string> = { caption: "caption", transcript: "voice-over", onscreen: "on-screen text", landing: "landing page", metadata: "post settings" };
const TYPE: Record<string, string> = {
  absolute_claim: "Absolute claim", implied_result: "Implied result", before_after: "Before and after", promo_mismatch: "Discount mismatch",
  promo_no_terms: "Promo with no terms", missing_disclosure: "No commercial disclosure", unlabeled_ai: "AI content with no label", non_english: "Not English",
};

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getPost(id);
  if (!p) notFound();
  const brand = BRANDS[p.brand];
  const flags: Flag[] = p.result?.flags ?? [];
  const q = (s: Source) => flags.filter((f) => f.source === s).map((f) => f.quote);
  const ev = await events(id);
  return (
    <>
      <p className="sub"><Link href={`/?brand=${p.brand}`}>&larr; {brand.campaign}</Link></p>
      <h1>{p.id} by @{p.handle} <Chip d={p.decision} /></h1>
      <p className="sub">{p.views.toLocaleString("en-US")} organic views. {p.revised ? "Creator edit applied (simulated)." : ""}</p>
      <div className="grid">
        <div>
          <div className="card">
            <h2>The post</h2>
            <div className="label">Caption</div><div className="field"><Marked text={p.caption} quotes={q("caption")} /></div>
            <div className="label">Voice-over transcript</div><div className="field"><Marked text={p.transcript} quotes={q("transcript")} /></div>
            <div className="label">On-screen text</div><div className="field"><Marked text={p.onscreen} quotes={q("onscreen")} /></div>
            <div className="label">Declared AI use</div>
            <div className="field">{p.meta.aiUse.length ? p.meta.aiUse.join(", ").replace(/_/g, " ") : "none"}; AI label {p.meta.aiLabel ? "on" : "off"}; commercial disclosure {p.meta.disclosureToggle ? "on" : "off"}</div>
          </div>
          <div className="card">
            <h2>Landing page ({brand.name}, synthetic)</h2>
            <div className="field muted">{brand.landing}</div>
          </div>
        </div>
        <div>
          <div className="card">
            <h2>Check result</h2>
            {flags.length === 0 && <p>No policy risks found.</p>}
            {flags.map((f, i) => (
              <div key={i} className={`flag ${f.type}`}>
                <div><b>{TYPE[f.type]}</b> in the {SRC[f.source]} <span className="by">({f.by === "rules" ? "rule" : "model"})</span></div>
                <div className="q">&ldquo;{f.quote}&rdquo;</div>
                <div>{f.reason}</div>
                <div className="pol">TikTok policy, {POLICY[f.sectionId]?.title}: &ldquo;{POLICY[f.sectionId]?.quote}&rdquo; <a href={POLICY[f.sectionId]?.url} target="_blank">source</a></div>
              </div>
            ))}
            {p.result?.notes.length ? <div className="notes">{p.result.notes.map((n, i) => <div key={i}>{n}</div>)}</div> : null}
            <div className="hint">{p.result?.model ? `Rules plus ${p.result.model}` : "Rules only"}</div>
            <Actions id={p.id} decision={p.decision} hasRevision={!!p.revision} revised={p.revised} boosted={p.boost_state === "queued"} note={p.result?.creatorNote ?? null} />
          </div>
          {p.result?.creatorNote && (
            <div className="card">
              <h2>Drafted note to the creator</h2>
              <pre className="note" data-testid="note">{p.result.creatorNote}</pre>
              <CopyNote note={p.result.creatorNote} />
            </div>
          )}
          {ev.length > 0 && (
            <div className="card">
              <h2>Log</h2>
              {ev.map((e: any, i: number) => <div key={i} className="notes">{new Date(e.at).toISOString().slice(0, 19).replace("T", " ")} UTC: {e.kind.replace(/_/g, " ")}</div>)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
