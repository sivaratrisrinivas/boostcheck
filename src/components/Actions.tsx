"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function Actions(props: { id: string; decision: string | null; hasRevision: boolean; revised: boolean; boosted: boolean; note: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  async function run(action: string, label: string) {
    setBusy(action);
    setMsg(`${label}...`);
    const r = await fetch(`/api/posts/${props.id}/${action}`, { method: "POST" });
    const j = await r.json();
    setBusy(null);
    setMsg(r.ok ? null : j.error);
    router.refresh();
  }
  const ok = props.decision === "OK_TO_BOOST";
  return (
    <div>
      <div className="btns">
        <button className="primary" data-testid="boost" disabled={!ok || props.boosted || !!busy} onClick={() => run("boost", "Queuing boost")}>
          {props.boosted ? "Boost queued" : "Approve boost"}
        </button>
        {props.hasRevision && !props.revised && !ok && (
          <button data-testid="fix" disabled={!!busy} onClick={() => run("fix", "Creator updates the post, re-checking")}>
            {props.decision === "ADD_AI_LABEL" ? "Creator adds AI label (simulated)" : "Creator posts the edit (simulated)"}
          </button>
        )}
        <button data-testid="recheck" disabled={!!busy} onClick={() => run("recheck", "Re-checking")}>Re-check</button>
        {!ok && (
          <button data-testid="override" disabled={!!busy} onClick={() => run("override", "Overriding")}>Reviewer override</button>
        )}
      </div>
      <div className="hint">
        {msg ?? (props.boosted ? "Boost queued. Simulated: no ad platform was called." : ok ? "Clear to boost. Boosting is simulated." : "Approve boost stays off until the post is OK to boost.")}
      </div>
    </div>
  );
}

export function CopyNote({ note }: { note: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="btns">
      <button onClick={() => { navigator.clipboard?.writeText(note); setDone(true); }}>{done ? "Copied" : "Copy note"}</button>
      <button disabled title="Not built: nothing is sent to creators in this prototype">Send to creator (not built)</button>
    </div>
  );
}
