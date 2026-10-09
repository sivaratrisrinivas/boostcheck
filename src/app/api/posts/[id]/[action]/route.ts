import { NextResponse } from "next/server";
import { applyFix, boost, override, recheck } from "@/lib/repo";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(_req: Request, ctx: { params: Promise<{ id: string; action: string }> }) {
  const { id, action } = await ctx.params;
  try {
    if (action === "recheck") return NextResponse.json(await recheck(id));
    if (action === "fix") return NextResponse.json(await applyFix(id));
    if (action === "boost") { await boost(id); return NextResponse.json({ ok: true, boost: "queued (simulated)" }); }
    if (action === "override") { await override(id); return NextResponse.json({ ok: true }); }
    return NextResponse.json({ error: "unknown action" }, { status: 404 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
