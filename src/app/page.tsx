import Link from "next/link";
import { BRANDS } from "@/lib/brands";
import { listPosts } from "@/lib/repo";
import { Chip } from "@/components/Chip";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ brand?: string }> }) {
  const { brand: b } = await searchParams;
  const brand = b && BRANDS[b] ? b : "dewly";
  const posts = await listPosts(brand);
  const count = (d: string) => posts.filter((p) => p.decision === d).length;
  const queued = posts.filter((p) => p.boost_state === "queued").length;
  return (
    <>
      <h1>{BRANDS[brand].campaign}</h1>
      <p className="sub">
        {posts.length} creator posts tracked. Each one was checked against TikTok&apos;s public ad policy before anyone can boost it.
      </p>
      <div className="tabs">
        {Object.values(BRANDS).map((x) => (
          <Link key={x.id} href={`/?brand=${x.id}`} className={x.id === brand ? "on" : ""}>{x.name} <span className="muted">({x.category})</span></Link>
        ))}
      </div>
      <div className="summary">
        <div className="stat"><b>{count("OK_TO_BOOST")}</b><span>OK to boost</span></div>
        <div className="stat"><b>{count("NEEDS_EDIT")}</b><span>Needs edit</span></div>
        <div className="stat"><b>{count("ADD_AI_LABEL")}</b><span>Add AI label</span></div>
        <div className="stat"><b>{count("NEEDS_HUMAN")}</b><span>Needs a person</span></div>
        <div className="stat"><b>{queued}</b><span>Boost queued (simulated)</span></div>
      </div>
      <table>
        <thead><tr><th>Post</th><th>Creator</th><th>Caption</th><th>Views</th><th>Check</th><th>Flags</th><th>Boost</th></tr></thead>
        <tbody>
          {posts.map((p) => (
            <tr key={p.id} className="row" data-id={p.id}>
              <td><Link className="rowlink" href={`/post/${p.id}`}>{p.id}</Link></td>
              <td>@{p.handle}</td>
              <td className="cap"><Link className="rowlink" href={`/post/${p.id}`}>{p.caption}</Link></td>
              <td>{p.views.toLocaleString("en-US")}</td>
              <td><Chip d={p.decision} /></td>
              <td>{p.result?.flags.length ?? 0}</td>
              <td>{p.boost_state === "queued" ? <span className="chip queued">Queued</span> : <span className="muted">Not boosted</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
