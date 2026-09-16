import { NextResponse } from "next/server"

import { recordEvents } from "@/src/features/marketing-tracking/lib/server/store"
import type { TrackingPayload } from "@/src/features/marketing-tracking/lib/types"

export const dynamic = "force-dynamic"

const MAX_EVENTS_PER_BATCH = 100

/**
 * Ingest a batch of visitor events. Reached both by `fetch` and, on page hide,
 * by `navigator.sendBeacon` — which posts `text/plain`, so the body is parsed
 * manually rather than via `request.json()`.
 */
export async function POST(request: Request) {
  let payload: TrackingPayload
  try {
    payload = JSON.parse(await request.text()) as TrackingPayload
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 })
  }

  const visitorId = payload?.visitorId
  const events = Array.isArray(payload?.events) ? payload.events : []
  if (typeof visitorId !== "string" || !visitorId || events.length === 0) {
    return NextResponse.json({ ok: false, error: "invalid payload" }, { status: 400 })
  }

  await recordEvents(visitorId, events.slice(0, MAX_EVENTS_PER_BATCH))
  return NextResponse.json({ ok: true })
}
