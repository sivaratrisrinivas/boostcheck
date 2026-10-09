import { NextResponse } from "next/server";
import { db, seed } from "@/lib/db";

export const dynamic = "force-dynamic";

// Restores the synthetic campaigns to their seeded state (demo reset).
export async function POST() {
  const q = await db();
  await seed(q, true);
  return NextResponse.json({ ok: true });
}
