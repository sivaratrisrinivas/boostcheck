import { evalRuns } from "@/lib/repo";
import { Chip } from "@/components/Chip";

export const dynamic = "force-dynamic";

export default async function EvalPage() {
  const runs = await evalRuns();
  const r = runs[0];
  if (!r) return <p>No eval runs yet. Run npm run eval.</p>;
  return (
    <>
      <h1>Eval: 20 hand-written cases</h1>
      <p className="sub">Pass bar 17/20. A case passes when the decision matches and every flag quotes the post word for word and names a policy section. Cases are in evals/cases.json.</p>
      <div className="summary">
        <div className="stat"><span>Latest run</span><b className="big" data-testid="score">{r.score}/{r.total}</b><span>{r.score >= 17 ? "Meets the 17/20 bar" : "Below the 17/20 bar"}</span></div>
        <div className="stat"><span>Model</span><b style={{ fontSize: 15 }}>{r.models.filter((m: string) => m !== "rules-only").join(", ")}</b><span>{new Date(r.started).toISOString().slice(0, 16).replace("T", " ")} UTC</span></div>
        <div className="stat"><span>All stored runs</span><b style={{ fontSize: 15 }}>{runs.map((x: any) => `${x.score}`).join(", ")}</b><span>newest first</span></div>
      </div>
      <table>
        <thead><tr><th>Case</th><th>Group</th><th>Expected</th><th>Got</th><th>Result</th><th>Flags (quote)</th></tr></thead>
        <tbody>
          {r.rows.map((x: any) => (
            <tr key={x.id}>
              <td>{x.id}</td>
              <td>{x.group.replace(/_/g, " ")}</td>
              <td>{x.expected.split(" | ").map((e: string) => <Chip key={e} d={e} />)}</td>
              <td><Chip d={x.got} /></td>
              <td><span className={`chip ${x.pass ? "pass" : "fail"}`}>{x.pass ? "pass" : "fail"}</span>{x.why ? <div className="notes">{x.why}</div> : null}</td>
              <td className="cap notes">{x.flags.map((f: any, i: number) => <div key={i}>{f.type.replace(/_/g, " ")} ({f.by}): &ldquo;{f.quote}&rdquo;</div>)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
