import { NextResponse } from "next/server"

import { getVisitors } from "@/src/features/marketing-tracking/lib/server/store"
import { buildSummary } from "@/src/features/marketing-tracking/lib/server/summary"

export const dynamic = "force-dynamic"

export async function GET() {
  const summary = buildSummary(await getVisitors())
  return NextResponse.json(summary, {
    headers: { "Cache-Control": "no-store" },
  })
}
